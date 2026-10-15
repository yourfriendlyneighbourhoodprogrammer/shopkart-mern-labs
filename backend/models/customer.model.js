import mongoose from "mongoose";
const customerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true },
    tokenVersion: { type: Number, default: 0, select: false },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [
      {
        _id: false,
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          min: 1,
          required: true,
          validate: Number.isInteger,
        },
      },
    ],
  },
  { timestamps: true, optimisticConcurrency: true },
);
export default mongoose.model("Customer", customerSchema);
