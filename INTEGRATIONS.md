# Wiring RentHive to external services

RentHive works fully out of the box with **simulated** versions of four features.
Each one is a swappable adapter in `src/lib/integrations/`. To make a feature
real, you set an environment variable, install one package, and the app routes
through the real provider automatically — no code changes required for the happy
path. The provider code is already written inside each adapter.

How to tell what mode you're in: each adapter exports a `*Configured()` check.
If the env var is absent → simulated. If present → real provider.

| Feature | Adapter file | Simulated default | Make it real |
|---|---|---|---|
| Online rent payments | `payments.ts` | Marks invoice paid, method "Card (simulated)" | Stripe |
| Document file uploads | `storage.ts` | Stores file metadata only | AWS S3 / R2 |
| Bank reconciliation | `bank.ts` | No external statement lines | Plaid |
| Email notifications | `notifications.ts` | Logs to server console | Resend |

---

## 1. Online rent payments — Stripe

Used by the tenant **Pay now** button (`src/app/(portal)/actions.ts → payInvoice`).

1. Create a Stripe account and copy your **secret key** (test mode is fine).
2. Add to `.env`:
   ```
   STRIPE_SECRET_KEY="sk_test_..."
   ```
3. Install the SDK:
   ```
   npm i stripe
   ```
4. Restart `npm run dev`. Payments now create a real Stripe PaymentIntent.

The PaymentIntent is created in `src/lib/integrations/payments.ts`. For a
production checkout you'll also want to confirm the intent client-side (Stripe
Elements) and handle the `payment_intent.succeeded` webhook before marking the
invoice paid.

## 2. Document file uploads — AWS S3 (or any S3-compatible store)

Used by **Documents → File manager** (`createDocument`). Today it records file
metadata; wiring storage lets you persist and serve the actual file bytes.

1. Create an S3 bucket (or Cloudflare R2 / Backblaze B2 — all S3-compatible).
2. Add to `.env`:
   ```
   S3_BUCKET="renthive-files"
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   ```
3. Install the SDK:
   ```
   npm i @aws-sdk/client-s3
   ```
4. Call `uploadFile()` from a form that sends the file bytes (multipart), then
   save the returned `url` on the `Document` record. The upload helper is in
   `src/lib/integrations/storage.ts`.

## 3. Bank reconciliation — Plaid

Used by **Reconciliation**. Without it, reconciliation runs against your recorded
payments/expenses. With Plaid you can pull real statement lines to match against.

1. Create a Plaid account, get `client_id` + `secret`, and complete the Link flow
   to obtain an `access_token` for the connected account.
2. Add to `.env`:
   ```
   PLAID_CLIENT_ID="..."
   PLAID_SECRET="..."
   PLAID_ACCESS_TOKEN="..."
   PLAID_ENV="sandbox"
   ```
3. Install the SDK:
   ```
   npm i plaid
   ```
4. `fetchBankTransactions()` in `src/lib/integrations/bank.ts` returns the statement
   lines; match them against the reconciliation worksheet rows.

## 4. Email notifications — Resend

A general `sendEmail()` helper (e.g. overdue-rent notices, application updates).

1. Create a Resend account and verify a sending domain.
2. Add to `.env`:
   ```
   RESEND_API_KEY="re_..."
   EMAIL_FROM="RentHive <you@yourdomain.com>"
   ```
3. Install the SDK:
   ```
   npm i resend
   ```
4. Call `sendEmail({ to, subject, body })` from any server action.

---

## Production database (Postgres)

The schema is Postgres-compatible. To switch off SQLite:

1. In `prisma/schema.prisma`, set `datasource db { provider = "postgresql" }`.
2. In `.env`, set `DATABASE_URL` to your Postgres connection string.
3. `npm run db:push && npm run db:seed`.
