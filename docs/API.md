# API reference

Backend base URL: `http://127.0.0.1:5000`.

Every route below also works with `/api` prepended. The React application uses `/api` through Vite's proxy. Postman can use the exact lab paths below.

Send JSON bodies with `Content-Type: application/json`. Login sets `shopkart_token` as an HttpOnly cookie. Postman/Newman retains cookies automatically. Authentication comes from that cookie, not a user ID sent by the client. Despite an isolated Bearer example in Lab 04, this application consistently uses the cookie authentication required by Labs 01–02.

| Method | Route | Auth | Body / purpose |
|---|---|---|---|
| POST | `/customers/register` | No | `fullName`, `email`, `password` (6+ chars, max 72 bytes), `phone` |
| POST | `/customers/login` | No | `email`, `password` |
| GET | `/customers/me` | Yes | Safe current profile |
| POST | `/customers/logout` | Yes | Clear cookie |
| PATCH | `/customers/change-password` | Yes | `oldPassword`, `newPassword` |
| POST | `/products` | No, per lab | `name`, `description`, numeric `price`, `category`, `image`, integer `stock` |
| GET | `/products` | No | Query: `search`, `category`, `sort=price_asc` or `price_desc` |
| GET | `/products/:id` | No | Product detail |
| GET | `/wishlist` | Yes | Populated products |
| POST | `/wishlist/:productId` | Yes | Add, duplicate → 409 |
| DELETE | `/wishlist/:productId` | Yes | Remove, missing entry → 404 |
| GET | `/cart` | Yes | Populated rows with `quantity` and stable `productId` |
| POST | `/cart/:productId` | Yes | Add one / increment one |
| PATCH | `/cart/:productId` | Yes | `{ "quantity": 2 }` |
| DELETE | `/cart/:productId` | Yes | Remove one row |
| POST | `/orders/create-payment-order` | Yes | `{ "shippingAddress": { ... } }` |
| POST | `/orders` | Yes | Alias of pending payment-order creation |
| POST | `/orders/verify-payment` | Yes | `shopKartOrderId`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` |
| GET | `/orders` | Yes | Current user's orders, newest first |
| GET | `/orders/:id` | Yes | Owned order, other user's order → 404 |
| GET | `/api/health` | No | Server health |

Example shipping body:

```json
{
  "shippingAddress": {
    "fullName": "Test Customer",
    "phone": "9000000000",
    "addressLine1": "10 Test Street",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

Create-payment-order returns `shopKartOrderId`, `razorpayOrderId`, amount in **paise**, currency and the public test key ID. The secret is never returned. Client-supplied totals/items/user IDs are not trusted.

## Postman

Import `ShopKart.postman_collection.json`. Set `baseUrl` if needed. Run the **Core API flow** folder against a disposable development database. It creates a unique test account and one product; it does not delete existing data. Requests automatically save product/order identifiers in collection variables.

The **Razorpay manual flow** folder requires your configured test keys and a real Test Mode checkout response. The verification placeholders must be replaced with the actual response; invented signatures are expected to fail. Do not run that folder as an unattended proof of real payment success.

Errors are JSON: `{ "success": false, "message": "..." }`. Validation uses 400, unauthenticated 401, foreign origin 403, missing resource 404, duplicates/concurrent edits 409, provider failure 502 and missing payment configuration 503.
