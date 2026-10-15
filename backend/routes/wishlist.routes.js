import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  getWishlist,
  addWishlist,
  removeWishlist,
} from "../controllers/wishlist.controller.js";
const router = Router();
router.use(authenticate);
router.get("/", getWishlist);
router.post("/:productId", addWishlist);
router.delete("/:productId", removeWishlist);
export default router;
