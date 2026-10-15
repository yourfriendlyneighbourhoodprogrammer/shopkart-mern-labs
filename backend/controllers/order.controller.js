import crypto from "node:crypto";
import mongoose from "mongoose";
import Customer from "../models/customer.model.js";
import Order from "../models/order.model.js";
import { ApiError, requiredText, requireId } from "../utils/errors.js";
export function validateAddress(input = {}) {
  const address = {};
  for (const field of [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode",
  ])
    address[field] = requiredText(input?.[field], field, 200);
  if (!/^\+?[0-9]{10,15}$/.test(address.phone))
    throw new ApiError(400, "Phone must contain 10–15 digits");
  if (!/^[0-9]{6}$/.test(address.pincode))
    throw new ApiError(400, "Pincode must contain 6 digits");
  return address;
}
export async function createPaymentOrder(req, res) {
  const customer = await Customer.findById(req.user._id).populate(
    "cart.product",
  );
  if (!customer.cart.length) throw new ApiError(400, "Your cart is empty");
  const shippingAddress = validateAddress(req.body.shippingAddress);
  const items = customer.cart.map(({ product, quantity }) => {
    if (!product)
      throw new ApiError(
        400,
        "A cart product is no longer available. Remove it before checkout.",
      );
    if (quantity > product.stock)
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    return {
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    };
  });
  // Integer paise prevents floating-point accumulation in the payment amount.
  const amount = items.reduce(
    (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
    0,
  );
  const gateway = req.app.locals.getPaymentGateway();
  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    totalAmount: amount / 100,
  });
  try {
    const paymentOrder = await gateway.orders.create({
      amount,
      currency: "INR",
      receipt: String(order._id),
    });
    order.razorpayOrderId = paymentOrder.id;
    await order.save();
  } catch {
    order.paymentStatus = "FAILED";
    await order.save();
    throw new ApiError(
      502,
      "Could not create the payment order. Your cart is unchanged. Please try again.",
    );
  }
  res
    .status(201)
    .json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: order.razorpayOrderId,
      amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
}
export async function verifyPayment(req, res) {
  const {
    shopKartOrderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;
  requireId(shopKartOrderId);
  const order = await Order.findOne({
    _id: shopKartOrderId,
    user: req.user._id,
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (
    typeof razorpay_payment_id !== "string" ||
    !/^pay_[a-zA-Z0-9]+$/.test(razorpay_payment_id) ||
    typeof razorpay_signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(razorpay_signature) ||
    !order.razorpayOrderId ||
    razorpay_order_id !== order.razorpayOrderId
  )
    throw new ApiError(400, "Invalid payment signature");
  const gateway = req.app.locals.getPaymentGateway();
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
    .digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(razorpay_signature, "hex")))
    throw new ApiError(400, "Invalid payment signature");
  if (order.paymentStatus === "PAID") {
    if (order.razorpayPaymentId !== razorpay_payment_id)
      throw new ApiError(409, "Order already paid with a different payment");
    return res.json({ success: true, order });
  }
  let payment;
  try {
    payment = await gateway.payments.fetch(razorpay_payment_id);
  } catch {
    throw new ApiError(
      502,
      "Could not confirm payment status. Please retry verification from My Orders.",
    );
  }
  if (
    payment.order_id !== order.razorpayOrderId ||
    payment.amount !== Math.round(order.totalAmount * 100) ||
    payment.currency !== "INR" ||
    payment.status !== "captured"
  )
    throw new ApiError(
      409,
      "Payment has not been captured for this order. Retry verification shortly.",
    );
  // Atlas supports transactions: paid status and cart clearing commit together.
  // A repeated verification returns the existing order and never clears a newer cart.
  await mongoose.connection.transaction(async (session) => {
    const current = await Order.findById(order._id).session(session);
    if (current.paymentStatus === "PAID") return;
    current.paymentStatus = "PAID";
    current.status = "PLACED";
    current.razorpayPaymentId = razorpay_payment_id;
    await current.save({ session });
    await Customer.updateOne(
      { _id: req.user._id },
      { $set: { cart: [] }, $inc: { __v: 1 } },
      { session },
    );
  });
  res.json({ success: true, order: await Order.findById(order._id) });
}
export async function getOrders(req, res) {
  res.json({
    success: true,
    orders: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }),
  });
}
export async function getOrder(req, res) {
  requireId(req.params.id);
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found");
  res.json({ success: true, order });
}
