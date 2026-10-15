import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";
import { ApiError } from "../utils/errors.js";
export async function authenticate(req, res, next) {
  let payload;
  try {
    payload = jwt.verify(
      req.cookies.shopkart_token || "",
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
    );
  } catch {
    throw new ApiError(401, "Please log in to continue");
  }
  const user = await Customer.findById(payload.sub).select("+tokenVersion");
  if (!user || user.tokenVersion !== payload.version)
    throw new ApiError(401, "Please log in to continue");
  req.user = user;
  next();
}
