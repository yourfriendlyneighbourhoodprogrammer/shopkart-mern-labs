# Setup: MongoDB, backend environment and Razorpay

## 1. Install and open the project

Install Node.js 22.12 or newer (Node 24 recommended). From the project root:

```bash
npm ci
```

The root is the directory containing `backend`, `frontend`, and `package.json`. Do not install the two folders separately; npm workspaces handle them together.

## 2. Create the MongoDB Atlas connection

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/) and create/select a database cluster. A suitable free cluster is sufficient for this lab.
2. In **Database Access**, create a **database user** with read/write access to the ShopKart database. This is different from your Atlas website login.
3. In **Network Access**, add **your current IP address**. If you change networks, update this entry. Do not open access to every IP merely to fix a connection error.
4. Open the cluster's **Connect → Drivers** option and choose Node.js. Copy its connection string.
5. Replace the user/password placeholders and use `shopkart` as the database name before the `?` query section:

```text
mongodb+srv://YOUR_DB_USER:YOUR_URL_ENCODED_PASSWORD@YOUR_CLUSTER.mongodb.net/shopkart?retryWrites=true&w=majority
```

Use your actual cluster address. URL-encode special characters in the database password (for example `@` becomes `%40`). Do not paste credentials into GitHub, README files, browser chat or screenshots.

Atlas is recommended because the payment-confirmation transaction needs a replica set. A standalone local `mongod` does not support this transaction; a local replica set does.

Official references: [Atlas application connection](https://www.mongodb.com/docs/atlas/driver-connection/) and [connection troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).

## 3. Create backend/.env

macOS/Linux:

```bash
cp backend/.env.example backend/.env
```

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Generate a random JWT secret locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value into `JWT_SECRET`. Your **local** file should have these keys:

```dotenv
MONGODB_URI=your_actual_Atlas_connection_string
JWT_SECRET=your_generated_random_secret
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

- Keep the file named **`.env`**, not `.env.txt`.
- Keep it inside **backend/**.
- `.gitignore` excludes actual `.env` files. Only `.env.example` belongs in GitHub.
- React needs **no `.env` file** for local setup. It calls `/api`; Vite forwards these requests to port 5000.
- Never put database credentials, JWT secrets or the Razorpay secret into a `VITE_` variable. These become browser-visible.
- Restart the backend after changing `.env`.

## 4. Add the mandatory Razorpay Test Mode keys

Lab 06 requires this integration; MongoDB alone is not sufficient for the final payment demonstration.

1. Sign in to [Razorpay Dashboard](https://dashboard.razorpay.com/) and switch to **Test Mode**.
2. Use its API keys section to generate your **test** Key ID and Key Secret. Complete any account verification yourself if requested.
3. Put both values in `backend/.env`:

```dotenv
RAZORPAY_KEY_ID=rzp_test_your_actual_test_key
RAZORPAY_KEY_SECRET=your_actual_test_secret
```

4. Configure automatic payment capture in the Razorpay account's payment settings. This application checks that the payment is **captured** before confirming the order.
5. Restart the backend. Use Razorpay's documented Test Mode payment options inside its checkout. Do not use Live Mode credentials or real-money payments.

The server intentionally accepts only Key IDs beginning with `rzp_test_`. The Key ID is public checkout configuration; the Key Secret remains on the backend.

Reference: [Razorpay Standard Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

## 5. Seed and run

```bash
npm run seed
npm run dev
```

Open **http://localhost:5173**. Use `localhost` consistently rather than switching between `localhost` and `127.0.0.1`, because cookies are host-specific and the allowed browser origin is configured explicitly.

1. Register a new account with your own details.
2. Log in; the protected home page displays your profile.
3. Open Products and try search/category/sort.
4. Save a product, visit Wishlist, and remove it.
5. Add a product twice; the cart must show one row with quantity two and a matching navbar count.
6. Refresh: the cart should remain.
7. Proceed to checkout and enter shipping details.
8. Complete a Razorpay **Test Mode** payment.
9. Verify the order displays `PAID / PLACED`, the navbar says `Cart 0`, and My Orders still contains the order after refresh.
10. Also cancel/fail a test checkout. The cart should remain intact.

## Common problems

| Symptom | What to check |
|---|---|
| Database connection failed | Database user's credentials, password URL encoding, cluster address, current-IP access entry |
| Authentication fails after reconnecting | Restart after `.env` changes; log in again if JWT secret changed |
| Cannot reach ShopKart | Both processes from `npm run dev` must be running; port 5000 must be available |
| Origin is not allowed | Use exactly `http://localhost:5173` or change `CLIENT_ORIGIN` deliberately and restart |
| Port 5173 is in use | Stop the other development process, then restart |
| Empty catalogue | Run `npm run seed` against the same database used by the server |
| Razorpay not configured | Supply both test keys in backend/.env and restart |
| Checkout script cannot load | Check network access to `checkout.razorpay.com`; retry |
| Payment not captured | Check automatic capture; return to My Orders and retry verification after capture |
| Transaction error | Use Atlas or a replica set, not a standalone local MongoDB server |

If verification temporarily fails after Razorpay returns a payment, this browser tab keeps the verification response in session storage. Open the pending order and use **Retry payment verification**. Do not pay again just to retry verification. For payment reconciliation after closing the tab or losing the response, this educational project would need a webhook/reconciliation feature before real-world use.

## Build / hosting note

`npm run build` verifies the production frontend. Local evaluation should use `npm run dev`. The backend can serve the build when `NODE_ENV=production`, but production cookies require HTTPS, a correct same-site `CLIENT_ORIGIN`, and a reverse proxy forwarding to its loopback listener. No public hosting deployment is included or required by these lab statements.
