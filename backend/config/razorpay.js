import Razorpay from "razorpay";
import { ApiError } from "../utils/errors.js";
export function getPaymentGateway() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key?.startsWith("rzp_test_") || !secret)
    throw new ApiError(
      503,
      "Razorpay Test Mode is not configured. Add the backend test keys and restart the server.",
    );
  return new Razorpay({ key_id: key, key_secret: secret });
}
