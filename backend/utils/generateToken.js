import jwt from "jsonwebtoken";
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});
export function setToken(res, customer) {
  const token = jwt.sign(
    { sub: String(customer._id), version: customer.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: "7d", algorithm: "HS256" },
  );
  res.cookie("shopkart_token", token, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
