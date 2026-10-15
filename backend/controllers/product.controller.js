import Product from "../models/product.model.js";
import { ApiError, requiredText, requireId } from "../utils/errors.js";
export async function createProduct(req, res) {
  const data = {};
  for (const key of ["name", "description", "category", "image"])
    data[key] = requiredText(
      req.body[key],
      key,
      key === "description" ? 3000 : 500,
    );
  if (!/^https?:\/\//i.test(data.image) && !data.image.startsWith("/images/"))
    throw new ApiError(
      400,
      "Image must be an http(s) URL or a local /images/ path",
    );
  if (
    typeof req.body.price !== "number" ||
    !Number.isFinite(req.body.price) ||
    req.body.price <= 0
  )
    throw new ApiError(400, "Price must be greater than 0");
  if (!Number.isInteger(req.body.stock) || req.body.stock < 0)
    throw new ApiError(400, "Stock must be a non-negative integer");
  data.price = Math.round(req.body.price * 100) / 100;
  data.stock = req.body.stock;
  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
}
export async function getProducts(req, res) {
  const filter = {};
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    const escaped = req.query.search
      .trim()
      .slice(0, 120)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = { $regex: escaped, $options: "i" };
  }
  if (typeof req.query.category === "string" && req.query.category)
    filter.category = req.query.category;
  const sort =
    req.query.sort === "price_asc"
      ? { price: 1, _id: 1 }
      : req.query.sort === "price_desc"
        ? { price: -1, _id: 1 }
        : { createdAt: -1, _id: -1 };
  const products = await Product.find(filter).sort(sort).select("-__v");
  res.json({ success: true, count: products.length, products });
}
export async function getProduct(req, res) {
  requireId(req.params.id);
  const product = await Product.findById(req.params.id).select("-__v");
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ success: true, product });
}
