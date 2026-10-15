# Lab requirement map

Source: [Lab-2029-Problem-Statements](https://github.com/mrinal1224/Lab-2029-Problem-Statements), reviewed at commit `8e5cd461777c81c08a1dab2f417b120cbe853f3a` on 15 October 2026.

The final Lab 06 revision makes Razorpay Test Mode mandatory and supersedes its older direct-order wording. `POST /orders` is retained as an alias for pending payment-order creation; it never bypasses payment verification.

| Lab | Required implementation | Location / verification |
|---|---|---|
| 01 | MVC Customer model; registration validation; unique email; bcrypt hash; login; JWT HttpOnly cookie; auth middleware; safe profile; logout | `backend/models/customer.model.js`, customer controller/routes, authentication middleware; integration tests |
| 01 bonus | Verify old password, hash new password, protected update | `PATCH /customers/change-password`; Home password form; old token versions invalidated |
| 02 | Controlled register/login forms; API error states; cookies sent; registration redirects to login; login redirects to home; protected home from `/customers/me`; logout; responsive navigation | Login, Register, Home, AuthContext, Navbar, protected route; browser-tested |
| 03 | Product schema, validation, creation/list/detail, invalid-ID/missing-product handling, case-insensitive name search, category + combined filtering | product model/controller/routes; API tests |
| 03 | Dynamic cards/details, URL parameters, search/category UI, loading/error/empty states | Products, ProductDetails, ProductCard, useResource; browser-tested |
| 03 bonus | Price ascending/descending sort | `sort=price_asc` / `sort=price_desc`, Sort by control |
| 04 | Product ObjectId wishlist, populate, authenticated ownership, duplicate 409, removal 404, persistence | Customer wishlist, wishlist controller/routes; API tests |
| 04 | Product save states, disabled duplicate request, wishlist page, navigation, remove/view actions, retry/loading/empty/error | ProductCard, ProductDetails, Wishlist; page-local wishlist state, no wishlist Context/Redux |
| 05 | Product reference + quantity, increment existing row, populate, quantity integer/min/stock validation, delete, persistence and protection | Customer cart, cart controller/routes; API tests |
| 05 | Context API shared cart, add/update/remove/refresh, total-unit navbar count, derived subtotal, quantity controls, disabled invalid actions | CartContext, Cart, ProductCard, ProductDetails, OrderSummary, Navbar; browser-tested |
| 06 | Order user reference, product/name/price/image snapshot, quantity, timestamps, shipping validation | Order model, order controller; API tests |
| 06 | Current user's cart, latest products/stock/prices, ignore fake frontend totals, calculate integer paise | `createPaymentOrder`; API tests |
| 06 | Persist pending order, create Razorpay order server-side, safe checkout response, secret kept private | Razorpay config, order controller |
| 06 | Load/open Razorpay checkout, handle script/failure/cancel, send response for verification | Checkout and payment service |
| 06 | HMAC against stored provider order ID, reject fake signatures, verify captured amount/currency/order, mark paid, clear cart only after verification | `verifyPayment`; positive and negative integration tests with an explicit provider fixture |
| 06 | Global cart reset, confirmation screen, protected user-specific history/details, newest first, loading/error/empty | OrderDetails, Orders, CartContext; ownership tests |

Optional wishlist toggle/count and administrative fulfilment-status progression are not implemented; the required wishlist add/remove APIs and order status display are included. The Lab 01 change-password and Lab 03 sorting bonuses are included.

## Remaining account-specific demonstration

The source code is complete. Set your own MongoDB/JWT/Razorpay environment values, then run one successful and one failed/cancelled Razorpay Test Mode checkout before submission. Automated provider fixtures test server behavior but do not replace the external Razorpay account demonstration. See `SETUP.md` and `TESTING.md`.
