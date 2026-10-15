import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  createProduct,
  getProducts,
  getProduct,
} from "../controllers/product.controller.js";
const router = Router();
router.get("/", getProducts);
router.post("/", createProduct);
router.get("/:id", getProduct);
export default router;
