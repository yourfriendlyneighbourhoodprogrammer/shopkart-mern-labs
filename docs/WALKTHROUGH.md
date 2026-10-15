# Implementation walkthrough and viva preparation

Read the files while following this guide. Be ready to explain the reasoning and demonstrate a failure case, not only the happy path.

## 1. Follow one request

React calls `api()` in `frontend/src/services/api.js`. It includes cookies and serializes JSON. Vite forwards `/api` to Express. Express parses JSON/cookies, selects a route, authenticates protected routes, executes a controller, and returns JSON. Mongoose models describe the documents stored in MongoDB.

Read `backend/app.js`, then one routes file, its controller, and its model. The app factory is separate from `index.js` so tests can use the real application with a temporary database and an explicit payment provider fixture.

## 2. Authentication

Registration checks every field and hashes the password with bcrypt. Hashing is one-way; login uses `bcrypt.compare`, not decrypting the password. The email index handles duplicate registration even if simultaneous requests pass the initial lookup.

Login signs a JWT containing only the customer ID and token version. The browser receives it as an HttpOnly cookie, so JavaScript cannot read it. `credentials: 'include'` allows cookie-based API requests. SameSite and the origin check help reject cross-site browser requests. Production cookies are Secure.

The middleware verifies the token and loads the customer as `req.user`. A protected React route is only a UI guard; Express must protect the API independently. `/customers/me` supplies the current profile instead of trusting user details stored in localStorage.

Password change verifies the old password, hashes the new one and increments the token version. Other existing sessions no longer match. Logout clears the cookie; it does not delete the customer, wishlist or cart.

## 3. Product discovery

Products are inserted into MongoDB by a seed script or `POST /products`. React fetches and maps API results into cards. Local SVG files are product images, not hardcoded frontend product records.

`/products/:id` uses a URL parameter for one record. `/products?search=keyboard&category=Electronics` uses query parameters to filter a collection. Search input is escaped before becoming a regular expression so punctuation means literal text. Price sorting is handled on the server.

`useResource` tracks loading/data/error, cancels obsolete requests and exposes retry. Search is debounced so the server is not called for every instantaneous keystroke. Empty results are a valid state and have their own screen.

## 4. Wishlist relationships

`Customer.wishlist` contains Product ObjectIds. `populate()` loads the current product name, price and image. Duplicating full products in the wishlist would make price changes stale.

The current user always comes from JWT middleware. A body such as `{ userId: 'someone-else' }` cannot select another wishlist. Atomic `$addToSet` and a conditional filter prevent duplicates; duplicate adds return 409. `$pull` removes references. React wishlist state remains local to the page/card as Lab 04 requires.

## 5. Cart and Context

A cart row stores a Product reference and an integer quantity. Adding the same product increments its row. Stock validation happens in Express even if the frontend disables the plus button. A malicious client can bypass button states.

`CartProvider` shares one cart across the navbar, cards, detail page, cart page and checkout. Every successful mutation replaces it with the backend response. Derived total units and subtotal are calculated from the rows, not stored as separate database fields.

The navbar counts **units**, not distinct products: two keyboards and one mouse means `Cart 3`. Failed changes preserve the existing state and display errors. MongoDB stores the cart so it survives refresh and logout/login. Optimistic concurrency rejects overlapping stale customer saves rather than silently losing updates.

## 6. Checkout and immutable snapshots

The browser sends shipping details. The server reloads the authenticated customer's cart and latest product documents, checks stock, and calculates prices. A fake frontend total is ignored.

Cart data points to current products; order data copies purchase-time name/price/quantity/image. That deliberate duplication preserves history if a product is renamed or repriced later.

Razorpay expects the smallest currency unit. For INR, ₹2,999 becomes 299900 paise. Summing integer paise also avoids floating-point addition errors.

## 7. Payment trust boundary

The backend creates a pending ShopKart order and calls Razorpay's Orders API with the server total. React receives only the public key ID, provider order ID, amount and currency. The secret never leaves the backend.

The hosted checkout returns payment ID, order ID and signature. A browser callback is not proof by itself. The backend computes HMAC SHA-256 using the **stored** Razorpay order ID and returned payment ID, then compares signatures safely. It also fetches provider payment status and checks the captured amount/currency/order.

Only after verification does a MongoDB transaction mark the order paid/placed and clear the cart together. A retry after success returns the existing order and does not clear a cart created later. The frontend clears its shared cart after the API confirms success.

Provider failure, forged signatures or cancelled checkout must not produce success or erase the cart. A temporary verification failure can be retried from the pending order while the response remains in this tab's session storage.

## 8. Explain the tests honestly

API tests use actual Express routes, actual Mongoose queries and an isolated real MongoDB replica set. Only the external Razorpay calls are replaced with a clearly defined fixture. A valid HMAC tests server confirmation behavior; it is not evidence that your own Razorpay account is configured.

After adding real test keys, complete both a successful and cancelled/failed Test Mode checkout. Never claim a live provider payment was tested before doing that step.

## Short viva prompts

1. Where are authentication and authorization each enforced?
2. Why are passwords excluded from responses and default Mongoose selection?
3. Why does wishlist use references while orders use snapshots?
4. What happens if product stock changes after adding to cart?
5. How does one cart update change the navbar immediately?
6. Why is a price or user ID supplied by React not trusted?
7. Why is the cart preserved when Razorpay checkout merely opens?
8. Why do we use a stored order ID when calculating HMAC?
9. What is a transaction, and why does the project require Atlas/a replica set?
10. How does repeat payment verification avoid deleting a new cart?
11. What would you add before real-money production use? (Inventory reservation, webhooks/reconciliation, refund handling, administrative access, abuse controls and operational monitoring.)

Use the source and your own explanations. Do not memorize answers without tracing the request flow.
