import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import { ApiError, requireId } from "../utils/errors.js";
async function respond(userId, res) {
  const user = await Customer.findById(userId);
  // Keep the original IDs before populate replaces a deleted product with null.
  const ids = user.cart.map((item) => String(item.product));
  await user.populate("cart.product");
  const cart = user.cart.map((item, i) => ({
    product: item.product,
    productId: ids[i],
    quantity: item.quantity,
  }));
  res.json({ success: true, cart });
}
export async function getCart(req, res) {
  await respond(req.user._id, res);
}
export async function mutateCart(req, res) {
  const id = req.params.productId;
  requireId(id);
  const user = await Customer.findById(req.user._id);
  const item = user.cart.find((row) => String(row.product) === id);
  if (req.method === "DELETE") {
    if (!item) throw new ApiError(404, "Product not in cart");
    user.cart = user.cart.filter((row) => String(row.product) !== id);
  } else {
    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, "Product not found");
    if (req.method === "PATCH" && !item)
      throw new ApiError(404, "Product not in cart");
    const quantity =
      req.method === "POST" ? (item?.quantity || 0) + 1 : req.body.quantity;
    if (!Number.isInteger(quantity) || quantity < 1)
      throw new ApiError(400, "Quantity must be a whole number of at least 1");
    if (quantity > product.stock)
      throw new ApiError(
        400,
        `Only ${product.stock} units of ${product.name} are available`,
      );
    if (item) item.quantity = quantity;
    else user.cart.push({ product: id, quantity });
  }
  await user.save();
  await respond(user._id, res);
}
