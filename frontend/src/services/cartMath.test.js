import { test } from "node:test";
import assert from "node:assert/strict";
import { cartTotals } from "./cartMath.js";
test("counts units rather than rows", () =>
  assert.deepEqual(
    cartTotals([
      { product: { price: 2999, stock: 5 }, quantity: 2 },
      { product: { price: 1499, stock: 2 }, quantity: 1 },
    ]),
    { count: 3, subtotal: 7497, unavailable: false },
  ));
test("handles an empty cart", () =>
  assert.deepEqual(cartTotals([]), {
    count: 0,
    subtotal: 0,
    unavailable: false,
  }));
test("blocks checkout for deleted or insufficient products", () => {
  assert.equal(cartTotals([{ product: null, quantity: 1 }]).unavailable, true);
  assert.equal(
    cartTotals([{ product: { price: 5, stock: 1 }, quantity: 2 }]).unavailable,
    true,
  );
});
test("calculates decimal currency in paise", () =>
  assert.equal(
    cartTotals([{ product: { price: 0.1, stock: 9 }, quantity: 3 }]).subtotal,
    0.3,
  ));
