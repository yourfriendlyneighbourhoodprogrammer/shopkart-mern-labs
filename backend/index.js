import mongoose from "mongoose";
import { createApp } from "./app.js";
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes("YOUR_"))
  throw new Error("Set MONGODB_URI in backend/.env. See docs/SETUP.md.");
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32 ||
  process.env.JWT_SECRET.startsWith("replace_")
)
  throw new Error(
    "Set JWT_SECRET to a random string of at least 32 characters.",
  );
try {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  const port = Number(process.env.PORT) || 5000;
  const server = createApp().listen(port, "127.0.0.1", () =>
    console.log(`ShopKart API: http://localhost:${port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      }),
    );
} catch {
  console.error(
    "Database connection failed. Check your Atlas database user, password, network access list and MONGODB_URI.",
  );
  process.exit(1);
}
