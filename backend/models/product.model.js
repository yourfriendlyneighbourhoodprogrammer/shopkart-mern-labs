import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    price: { type: Number, required: true, min: 0.01, max: 10000000 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    image: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { timestamps: true },
);
export default mongoose.model("Product", productSchema);
