import bcrypt from "bcrypt";
import Customer from "../models/customer.model.js";
import { ApiError, requiredText } from "../utils/errors.js";
import { cookieOptions, setToken } from "../utils/generateToken.js";
const publicCustomer = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  createdAt: user.createdAt,
});
function passwordValid(password) {
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    Buffer.byteLength(password) > 72
  )
    throw new ApiError(
      400,
      "Password must be at least 6 characters and at most 72 bytes",
    );
}
export async function register(req, res) {
  const fullName = requiredText(req.body.fullName, "Full name", 100);
  const email = requiredText(req.body.email, "Email", 254).toLowerCase();
  const phone = requiredText(req.body.phone, "Phone", 20);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ApiError(400, "Enter a valid email");
  if (!/^\+?[0-9]{10,15}$/.test(phone))
    throw new ApiError(400, "Phone must contain 10–15 digits");
  passwordValid(req.body.password);
  if (await Customer.exists({ email }))
    throw new ApiError(409, "Email already exists");
  const customer = await Customer.create({
    fullName,
    email,
    phone,
    password: await bcrypt.hash(req.body.password, 12),
  });
  res
    .status(201)
    .json({
      success: true,
      message: "Customer registered successfully",
      customer: publicCustomer(customer),
    });
}
export async function login(req, res) {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";
  const customer = await Customer.findOne({ email }).select(
    "+password +tokenVersion",
  );
  if (!customer || !(await bcrypt.compare(password, customer.password)))
    throw new ApiError(401, "Invalid credentials");
  setToken(res, customer);
  res.json({
    success: true,
    message: "Login successful",
    customer: publicCustomer(customer),
  });
}
export function me(req, res) {
  res.json(publicCustomer(req.user));
}
export function logout(req, res) {
  res.clearCookie("shopkart_token", cookieOptions());
  res.json({ success: true, message: "Logged out successfully" });
}
export async function changePassword(req, res) {
  passwordValid(req.body.newPassword);
  const customer = await Customer.findById(req.user._id).select(
    "+password +tokenVersion",
  );
  if (
    typeof req.body.oldPassword !== "string" ||
    !(await bcrypt.compare(req.body.oldPassword, customer.password))
  )
    throw new ApiError(401, "Current password is incorrect");
  customer.password = await bcrypt.hash(req.body.newPassword, 12);
  customer.tokenVersion += 1;
  await customer.save();
  setToken(res, customer);
  res.json({
    success: true,
    message: "Password changed. Other sessions have been signed out.",
  });
}
