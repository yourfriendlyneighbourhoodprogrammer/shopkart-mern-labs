import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import { ApiError, requireId } from "../utils/errors.js";
export async function getWishlist(req, res) {
  const user = await Customer.findById(req.user._id).populate(
    "wishlist",
    "name price category image stock",
  );
  res.json({
    success: true,
    count: user.wishlist.length,
    wishlist: user.wishlist,
  });
}
export async function addWishlist(req, res) {
  const id = req.params.productId;
  requireId(id);
  if (!(await Product.exists({ _id: id })))
    throw new ApiError(404, "Product not found");
  const result = await Customer.updateOne(
    { _id: req.user._id, wishlist: { $ne: id } },
    { $addToSet: { wishlist: id }, $inc: { __v: 1 } },
  );
  if (!result.modifiedCount)
    throw new ApiError(409, "Product already in wishlist");
  res.status(201).json({ success: true, message: "Product added to wishlist" });
}
export async function removeWishlist(req, res) {
  const id = req.params.productId;
  requireId(id);
  const result = await Customer.updateOne(
    { _id: req.user._id, wishlist: id },
    { $pull: { wishlist: id }, $inc: { __v: 1 } },
  );
  if (!result.modifiedCount) throw new ApiError(404, "Product not in wishlist");
  res.json({ success: true, message: "Product removed from wishlist" });
}
