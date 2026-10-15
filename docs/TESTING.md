# Test report and evaluation checklist

Verified on 15 October 2026 with Node.js 24.10.0.

## Automated results

| Check | Result |
|---|---|
| API integration suite | 12 tests passed |
| Frontend cart calculation suite | 4 tests passed |
| Postman collection via Newman, Core API flow | 18 requests, 20 assertions, all passed |
| React production build | Passed |
| Installed project dependency audit after removing an unnecessary test library | 0 reported vulnerabilities |

Run from the project root:

```bash
npm run check
```

The first API test run downloads a MongoDB test binary from MongoDB's distribution service. Internet access and permission to open temporary localhost ports are needed. Tests create a disposable replica set and never connect to your configured Atlas database. They clean up the test server on completion.

Optional Postman CLI run (against a separately running disposable development API):

```bash
npx --yes newman run docs/ShopKart.postman_collection.json --folder "Core API flow"
```

Postman uses `127.0.0.1:5000` explicitly to avoid a different IPv6 service answering `localhost:5000` on some computers. Browser UI still uses `http://localhost:5173` and Vite forwards to the same IPv4 API.

### Covered behavior

- Protected routes, foreign-origin rejection, invalid credentials and password exclusion.
- Registration field validation, case-insensitive duplicate email and bcrypt storage.
- Cookie flags, current profile, logout and password-change session invalidation.
- Product validation, literal punctuation in search, case-insensitive/combined search, filtering and invalid/missing IDs.
- Wishlist population, duplicates, missing entries and cross-user isolation.
- Cart increment without duplicate rows, positive integer quantities, stock bounds, user isolation, removal and persistence across logout/login.
- Empty cart, invalid shipping, stock changed after cart addition and deleted products.
- Provider order-creation failure preserves cart.
- Fake browser totals ignored and historical snapshots remain unchanged after product updates.
- Forged signatures/wrong provider order IDs rejected, other user's order inaccessible.
- Valid signed provider fixture confirms order and clears cart transactionally.
- Repeated verification is idempotent and preserves a newly created cart.
- Derived frontend unit counts, currency arithmetic and unavailable-item detection.

**Payment test boundary:** API tests inject a named Razorpay fixture; they exercise the real HMAC and database transaction code. They do not contact Razorpay or prove that a student's own payment account works. Actual Test Mode checkout remains an environment-dependent manual test after keys are configured.

## Browser checks

Verified against the real React application and a temporary MongoDB-backed Express server:

- Logged-out access redirects to login.
- Registration redirects to login; login opens the protected home page.
- Catalogue data, combined search/category filtering, product details and images render.
- Wishlist save is reflected immediately and appears on the Wishlist page.
- Adding to cart updates the navbar without a refresh.
- Increasing quantity updates totals; quantity and cart count survive reload.
- Invalid pincode is rejected before checkout.
- Missing Razorpay keys produce an explicit setup error and preserve the cart.
- Desktop and 390-pixel mobile catalogue/cart layouts have no horizontal overflow.

Screenshots: [cart](screenshots/cart.jpg), [checkout setup state](screenshots/checkout.jpg).

## Final manual check with your environment

1. Add your Atlas, JWT and Razorpay Test Mode environment values.
2. Seed the catalogue, register and log in.
3. Demonstrate search, filter, sorting, details, wishlist add/remove, duplicate rejection, cart quantity and totals.
4. Refresh and log out/in to demonstrate persistence.
5. Complete a **successful Razorpay Test Mode** checkout. Confirm `PAID`, `PLACED`, payment ID saved, `Cart 0`, and order history after refresh.
6. Cancel/fail a Test Mode checkout. Confirm cart preservation and no false success.
7. Try another user's order ID; expect 404.
8. Verify no actual `.env` file is tracked in GitHub.
9. Read `WALKTHROUGH.md` and explain the code before the compulsory viva.

No claim is made that live Razorpay checkout or your personal Atlas configuration has already been tested. No live-money transaction should be attempted for this lab.
