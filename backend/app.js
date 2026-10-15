import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import { getPaymentGateway } from "./config/razorpay.js";
import { ApiError } from "./utils/errors.js";
export function createApp(options = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.locals.getPaymentGateway = options.getPaymentGateway || getPaymentGateway;
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowed = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    if (origin && origin !== allowed)
      return next(new ApiError(403, "Origin is not allowed"));
    if (origin) {
      res.set("Access-Control-Allow-Origin", allowed);
      res.set("Vary", "Origin");
      res.set("Access-Control-Allow-Credentials", "true");
    }
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    req.body ??= {};
    next();
  });
  app.get("/api/health", (req, res) =>
    res.json({ success: true, message: "ShopKart API is running" }),
  );
  // Exact lab paths for Postman, plus /api paths for the React proxy/production app.
  for (const prefix of ["", "/api"]) {
    const browserPage = (router) => (req, res, next) => {
      if (
        !prefix &&
        process.env.NODE_ENV === "production" &&
        req.method === "GET" &&
        req.headers.accept?.includes("text/html")
      )
        return next();
      router(req, res, next);
    };
    app.use(`${prefix}/customers`, browserPage(customerRoutes));
    app.use(`${prefix}/products`, browserPage(productRoutes));
    app.use(`${prefix}/wishlist`, browserPage(wishlistRoutes));
    app.use(`${prefix}/cart`, browserPage(cartRoutes));
    app.use(`${prefix}/orders`, browserPage(orderRoutes));
  }
  if (process.env.NODE_ENV === "production") {
    const dist = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../frontend/dist",
    );
    app.use(express.static(dist));
    app.get("/{*page}", (req, res, next) =>
      req.path.startsWith("/api/")
        ? next()
        : res.sendFile(path.join(dist, "index.html")),
    );
  }
  app.use((req, res) =>
    res.status(404).json({ success: false, message: "Route not found" }),
  );
  app.use((err, req, res, next) => {
    let status = err.status || 500;
    let message = err.message;
    if (err.code === 11000) {
      status = 409;
      message = "This record already exists";
    }
    if (
      err.name === "ValidationError" ||
      err.name === "CastError" ||
      err.type === "entity.parse.failed"
    ) {
      status = 400;
      message = "Invalid request data";
    }
    if (err.name === "VersionError") {
      status = 409;
      message = "Your data changed in another request. Refresh and try again.";
    }
    if (status >= 500 && !(err instanceof ApiError))
      message = "Something went wrong. Please try again.";
    res.status(status).json({ success: false, message });
  });
  return app;
}
