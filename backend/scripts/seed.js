import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import Product from "../models/product.model.js";
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("YOUR_"))
  throw new Error("Set MONGODB_URI in backend/.env first.");
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  const products = JSON.parse(
    await readFile(new URL("../data/products.json", import.meta.url), "utf8"),
  );
  for (const product of products)
    await Product.updateOne(
      { name: product.name },
      { $setOnInsert: product },
      { upsert: true, runValidators: true },
    );
  console.log(
    "Sample catalogue ready. Existing products and customer data were preserved.",
  );
} catch {
  console.error("Seeding failed. Check MongoDB setup in docs/SETUP.md.");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
