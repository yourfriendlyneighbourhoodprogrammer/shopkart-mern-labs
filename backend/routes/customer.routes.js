import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  register,
  login,
  me,
  logout,
  changePassword,
} from "../controllers/customer.controller.js";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);
router.patch("/change-password", authenticate, changePassword);
export default router;
