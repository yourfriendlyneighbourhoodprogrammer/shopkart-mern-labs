export function cartTotals(items) {
  return {
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal:
      items.reduce(
        (sum, item) =>
          sum + Math.round((item.product?.price || 0) * 100) * item.quantity,
        0,
      ) / 100,
    unavailable: items.some(
      (item) => !item.product || item.quantity > item.product.stock,
    ),
  };
}
export const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
