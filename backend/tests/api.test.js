import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "../app.js";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
let db,
  app,
  alice,
  bob,
  product,
  orderData,
  providerAmount,
  failProvider = false;
process.env.JWT_SECRET = "test-only-random-secret-with-more-than-32-characters";
process.env.RAZORPAY_KEY_ID = "rzp_test_fixture";
process.env.RAZORPAY_KEY_SECRET = "fixture-secret";
const address = {
  fullName: "Test Customer",
  phone: "9000000000",
  addressLine1: "10 Test Street",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};
const gateway = {
  orders: {
    create: async (body) => {
      if (failProvider) throw new Error("provider offline");
      providerAmount = body.amount;
      return { id: `order_${new mongoose.Types.ObjectId()}` };
    },
  },
  payments: {
    fetch: async () => ({
      order_id: orderData.razorpayOrderId,
      amount: providerAmount,
      currency: "INR",
      status: "captured",
    }),
  },
};
before(async () => {
  db = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "7.0.14" },
  });
  await mongoose.connect(db.getUri());
  await Promise.all([Customer.init(), Product.init(), Order.init()]);
  app = createApp({ getPaymentGateway: () => gateway });
  alice = request.agent(app);
  bob = request.agent(app);
});
after(async () => {
  await mongoose.disconnect();
  if (db) await db.stop();
});
test("protected APIs reject anonymous requests and unknown origins", async () => {
  for (const path of ["/customers/me", "/wishlist", "/cart", "/orders"])
    await request(app).get(path).expect(401);
  await request(app)
    .post("/customers/login")
    .set("Origin", "https://untrusted.example")
    .send({})
    .expect(403);
});
test("register validates fields, rejects duplicates, hashes passwords and never returns them", async () => {
  await alice.post("/customers/register").send({}).expect(400);
  await alice
    .post("/customers/register")
    .send({
      fullName: "Alice",
      email: "alice@example.test",
      phone: "9000000000",
      password: "123",
    })
    .expect(400);
  for (const [agent, name] of [
    [alice, "alice"],
    [bob, "bob"],
  ]) {
    const result = await agent
      .post("/customers/register")
      .send({
        fullName: name,
        email: `${name}@example.test`,
        phone: "9000000000",
        password: "secret123",
      })
      .expect(201);
    assert.equal(result.body.customer.password, undefined);
  }
  await alice
    .post("/customers/register")
    .send({
      fullName: "Alice",
      email: "ALICE@example.test",
      phone: "9000000000",
      password: "secret123",
    })
    .expect(409);
  const stored = await Customer.findOne({ email: "alice@example.test" }).select(
    "+password",
  );
  assert.match(stored.password, /^\$2[ab]\$/);
});
test("login returns an HttpOnly cookie, protects profile, and handles invalid credentials", async () => {
  await alice
    .post("/customers/login")
    .send({ email: "alice@example.test", password: "wrong" })
    .expect(401);
  for (const [agent, name] of [
    [alice, "alice"],
    [bob, "bob"],
  ]) {
    const response = await agent
      .post("/customers/login")
      .send({ email: `${name}@example.test`, password: "secret123" })
      .expect(200);
    assert.match(response.headers["set-cookie"][0], /HttpOnly/);
    assert.match(response.headers["set-cookie"][0], /SameSite=Lax/);
  }
  const result = await alice.get("/customers/me").expect(200);
  assert.equal(result.body.email, "alice@example.test");
  assert.equal(result.body.password, undefined);
});
test("product CRUD validation, literal search, combined filters, sorting and IDs", async () => {
  await request(app).post("/products").send({}).expect(400);
  const body = {
    name: "Test Keyboard [Pro]",
    description: "A keyboard",
    price: 2999,
    category: "Electronics",
    image: "/images/keyboard.svg",
    stock: 3,
  };
  await request(app)
    .post("/products")
    .send({ ...body, price: 0 })
    .expect(400);
  await request(app)
    .post("/products")
    .send({ ...body, stock: -1 })
    .expect(400);
  product = (await request(app).post("/products").send(body).expect(201)).body
    .product;
  const list = await request(app)
    .get("/products?search=KEYBOARD&category=Electronics&sort=price_asc")
    .expect(200);
  assert.equal(list.body.count, 1);
  assert.equal(
    (await request(app).get("/products?search=%5BPro%5D").expect(200)).body
      .count,
    1,
  );
  assert.equal(
    (
      await request(app)
        .get("/products?search=keyboard&category=Books")
        .expect(200)
    ).body.count,
    0,
  );
  await request(app).get(`/products/${product._id}`).expect(200);
  await request(app).get("/products/bad-id").expect(400);
  await request(app)
    .get(`/products/${new mongoose.Types.ObjectId()}`)
    .expect(404);
});
test("wishlist duplicate prevention, population, removal and user isolation", async () => {
  await alice
    .post(`/wishlist/${product._id}`)
    .send({ userId: "ignored" })
    .expect(201);
  await alice.post(`/wishlist/${product._id}`).expect(409);
  const result = await alice.get("/wishlist").expect(200);
  assert.equal(result.body.wishlist[0].name, product.name);
  assert.equal((await bob.get("/wishlist").expect(200)).body.count, 0);
  await alice.delete(`/wishlist/${product._id}`).expect(200);
  await alice.delete(`/wishlist/${product._id}`).expect(404);
  await alice.post("/wishlist/bad").expect(400);
  await alice.post(`/wishlist/${new mongoose.Types.ObjectId()}`).expect(404);
});
test("cart increments without duplicates, enforces integer stock bounds and ownership", async () => {
  await alice.post(`/cart/${product._id}`).expect(200);
  const twice = await alice.post(`/cart/${product._id}`).expect(200);
  assert.equal(twice.body.cart.length, 1);
  assert.equal(twice.body.cart[0].quantity, 2);
  assert.equal(twice.body.cart[0].product.name, product.name);
  for (const quantity of [0, 4, 1.5, "2"])
    await alice.patch(`/cart/${product._id}`).send({ quantity }).expect(400);
  await alice.patch(`/cart/${product._id}`).send({ quantity: 3 }).expect(200);
  await alice.post(`/cart/${product._id}`).expect(400);
  assert.equal((await bob.get("/cart").expect(200)).body.cart.length, 0);
  await bob.patch(`/cart/${product._id}`).send({ quantity: 1 }).expect(404);
  await alice.delete(`/cart/${product._id}`).expect(200);
  await alice.post(`/cart/${product._id}`).expect(200);
});
test("checkout rejects empty carts, invalid address, changed stock and deleted products", async () => {
  await bob.post("/orders").send({ shippingAddress: address }).expect(400);
  await alice
    .post("/orders/create-payment-order")
    .send({ shippingAddress: { ...address, pincode: "1" } })
    .expect(400);
  await alice
    .post("/orders/create-payment-order")
    .send({ shippingAddress: { ...address, city: "   " } })
    .expect(400);
  await Product.updateOne({ _id: product._id }, { $set: { stock: 0 } });
  await alice
    .post("/orders/create-payment-order")
    .send({ shippingAddress: address })
    .expect(400);
  await Product.updateOne({ _id: product._id }, { $set: { stock: 3 } });
  const temporary = await Product.create({
    name: "Temporary",
    description: "test",
    price: 10,
    stock: 2,
    category: "Home",
    image: "/images/mug.svg",
  });
  await bob.post(`/cart/${temporary._id}`).expect(200);
  await temporary.deleteOne();
  await bob
    .post("/orders/create-payment-order")
    .send({ shippingAddress: address })
    .expect(400);
  const cart = await bob.get("/cart").expect(200);
  assert.equal(cart.body.cart[0].product, null);
  await bob.delete(`/cart/${temporary._id}`).expect(200);
});
test("provider failure preserves cart and does not create a paid order", async () => {
  failProvider = true;
  await alice
    .post("/orders/create-payment-order")
    .send({ shippingAddress: address })
    .expect(502);
  failProvider = false;
  assert.equal((await alice.get("/cart")).body.cart.length, 1);
  assert.equal(await Order.countDocuments({ paymentStatus: "PAID" }), 0);
});
test("checkout ignores fake totals, persists snapshots and keeps cart pending", async () => {
  orderData = (
    await alice
      .post("/orders/create-payment-order")
      .send({ shippingAddress: address, totalAmount: 1, items: [] })
      .expect(201)
  ).body;
  assert.equal(orderData.amount, 299900);
  assert.equal(providerAmount, 299900);
  assert.equal(orderData.secret, undefined);
  assert.equal((await alice.get("/cart")).body.cart.length, 1);
  await Product.updateOne(
    { _id: product._id },
    { $set: { price: 3999, name: "Changed title" } },
  );
  const order = (
    await alice.get(`/orders/${orderData.shopKartOrderId}`).expect(200)
  ).body.order;
  assert.equal(order.items[0].price, 2999);
  assert.equal(order.items[0].name, product.name);
  assert.equal(order.paymentStatus, "PENDING");
  await bob.get(`/orders/${order._id}`).expect(404);
});
test("forged signature and wrong order ID cannot confirm payment or clear the cart", async () => {
  const proof = {
    shopKartOrderId: orderData.shopKartOrderId,
    razorpay_order_id: orderData.razorpayOrderId,
    razorpay_payment_id: "pay_fixture",
    razorpay_signature: "0".repeat(64),
  };
  await alice.post("/orders/verify-payment").send(proof).expect(400);
  await alice
    .post("/orders/verify-payment")
    .send({ ...proof, razorpay_order_id: "order_wrong" })
    .expect(400);
  await bob.post("/orders/verify-payment").send(proof).expect(404);
  assert.equal((await alice.get("/cart")).body.cart.length, 1);
  assert.equal(
    (await Order.findById(orderData.shopKartOrderId)).paymentStatus,
    "PENDING",
  );
});
test("valid signed payment confirms atomically, survives reload and is idempotent", async () => {
  const proof = {
    shopKartOrderId: orderData.shopKartOrderId,
    razorpay_order_id: orderData.razorpayOrderId,
    razorpay_payment_id: "pay_fixture",
    razorpay_signature: crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderData.razorpayOrderId}|pay_fixture`)
      .digest("hex"),
  };
  const response = await alice
    .post("/orders/verify-payment")
    .send(proof)
    .expect(200);
  assert.equal(response.body.order.paymentStatus, "PAID");
  assert.equal(response.body.order.status, "PLACED");
  assert.equal(response.body.order.razorpayPaymentId, "pay_fixture");
  assert.equal((await alice.get("/cart")).body.cart.length, 0);
  assert.ok(
    (await alice.get("/orders")).body.orders.some(
      (order) => order.paymentStatus === "PAID",
    ),
  );
  await alice.post(`/cart/${product._id}`).expect(200);
  await alice.post("/orders/verify-payment").send(proof).expect(200);
  assert.equal(
    (await alice.get("/cart")).body.cart.length,
    1,
    "retry must not erase a later cart",
  );
});
test("password change invalidates old sessions, logout clears cookie, cart survives login", async () => {
  const oldSession = request.agent(app);
  await oldSession
    .post("/customers/login")
    .send({ email: "alice@example.test", password: "secret123" })
    .expect(200);
  await alice
    .patch("/customers/change-password")
    .send({ oldPassword: "wrong", newPassword: "newsecret123" })
    .expect(401);
  await alice
    .patch("/customers/change-password")
    .send({ oldPassword: "secret123", newPassword: "newsecret123" })
    .expect(200);
  await oldSession.get("/customers/me").expect(401);
  const response = await alice.post("/customers/logout").expect(200);
  assert.match(response.headers["set-cookie"][0], /Expires=Thu, 01 Jan 1970/);
  await alice.get("/customers/me").expect(401);
  await alice
    .post("/customers/login")
    .send({ email: "alice@example.test", password: "newsecret123" })
    .expect(200);
  assert.equal((await alice.get("/cart")).body.cart.length, 1);
});
