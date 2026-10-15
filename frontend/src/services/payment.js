import { api, jsonBody } from "./api";
let scriptPromise;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const timeout = setTimeout(() => fail(), 15000);
    function fail() {
      clearTimeout(timeout);
      script.remove();
      scriptPromise = null;
      reject(
        new Error(
          "Payment checkout could not load. Please check your connection and try again.",
        ),
      );
    }
    script.onload = () => {
      clearTimeout(timeout);
      if (window.Razorpay) resolve();
      else fail();
    };
    script.onerror = fail;
    document.body.appendChild(script);
  });
  return scriptPromise;
}
export function rememberPayment(proof) {
  try {
    sessionStorage.setItem(
      `shopkart-payment-${proof.shopKartOrderId}`,
      JSON.stringify(proof),
    );
  } catch {
    /* Verification still works if storage is unavailable. */
  }
}
export function pendingPayment(id) {
  try {
    return JSON.parse(
      sessionStorage.getItem(`shopkart-payment-${id}`) || "null",
    );
  } catch {
    return null;
  }
}
export async function verifyPayment(proof) {
  const data = await api("/orders/verify-payment", {
    method: "POST",
    body: jsonBody(proof),
  });
  try {
    sessionStorage.removeItem(`shopkart-payment-${proof.shopKartOrderId}`);
  } catch {
    /* Nonessential cleanup. */
  }
  return data;
}
