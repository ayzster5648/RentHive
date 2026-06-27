# RentHive

A property-management web app inspired by TenantCloud — landlord and tenant portals for
managing properties, units, leases, rent, and maintenance.

> Original, clean-room implementation. Not affiliated with or copied from TenantCloud.

## Stack

- **Next.js 15** (App Router, React 19, Server Actions)
- **Prisma ORM** — PostgreSQL (local dev and production)
- **Tailwind CSS**
- Cookie-based session auth with role separation (landlord / tenant)

## Quick start

You need a PostgreSQL database. The fastest free option is [Neon](https://neon.tech)
or Vercel Postgres — create one, copy its connection string (~2 minutes, no install).

```bash
npm install
cp .env.example .env        # then paste your Postgres URL into DATABASE_URL
npm run setup               # generates client, creates tables, seeds demo data
npm run dev                 # http://localhost:3000
```

### Demo accounts (password: `password123`)

| Role     | Email                   |
| -------- | ----------------------- |
| Landlord | landlord@renthive.com   |
| Tenant   | alex@example.com        |
| Tenant   | jordan@example.com (has overdue rent) |

## Features

**Landlord**
- Dashboard — occupancy, rent collected, outstanding balances, overdue rent, recent maintenance
- Properties & units — add properties, add units, see occupancy and rent roll
- Tenants — directory with balances and lease end dates
- Leases — full lease list with terms and deposits
- Rent & Payments — invoice ledger, record/mark payments
- Maintenance — triage requests, change status

**Tenant**
- Overview — lease summary, balance, next due date
- Pay Rent — invoice history, simulated card payment
- Maintenance — submit and track requests

## Useful scripts

| Script             | What it does                              |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start the dev server                      |
| `npm run setup`    | Generate client + create DB + seed        |
| `npm run backup`   | Snapshot the whole database to `/backups` |
| `npm run restore -- <file>` | Rebuild the database from a backup |
| `npm run db:studio`| Open Prisma Studio to browse data         |
| `npm run build`    | Production build                          |

## Data safety & backups

- Your data lives in a managed PostgreSQL database (Neon), which is durable and
  survives all app redeploys and restarts.
- **Backups:** run `npm run backup` to write a timestamped JSON snapshot of every
  table to `/backups` (gitignored — it contains tenant personal data). Restore any
  snapshot with `npm run restore -- backups/backup-<timestamp>.json`.
- **Accidental-wipe protection:** `npm run setup`, `db:reset`, and `db:fresh` refuse
  to run against a database that already has data unless you set `ALLOW_DB_WIPE=1`.
- For automatic point-in-time recovery, enable history/restore in your Neon project.

### Excel export

`npm run export:xlsx` writes a multi-sheet `.xlsx` (Summary, Properties, Units,
Tenants, Leases, Invoices, Payments, Expenses, Maintenance, Applications,
Inspections) to `/exports`.

### Auto-updating Google Sheet (weekly)

`.github/workflows/weekly-backup.yml` runs every Monday (and on demand from the
Actions tab) and writes all your data into a Google Sheet — one tab per data type.
Open the same sheet anytime and it's current. `npm run sync:sheets` does the same
locally.

One-time setup:

1. Create a Google Sheet and copy its **ID** from the URL
   (`docs.google.com/spreadsheets/d/<THIS_PART>/edit`).
2. In [Google Cloud Console](https://console.cloud.google.com): create a project,
   enable the **Google Sheets API**, create a **Service Account**, and add a
   **JSON key** for it. Download the key file.
3. **Share** the Google Sheet (Share button) with the service account's email
   (`...@...iam.gserviceaccount.com`) as an **Editor**.
4. Add repository secrets (GitHub → Settings → Secrets and variables → Actions):

| Secret | Value |
| ------ | ----- |
| `DATABASE_URL` | your Neon connection string |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | the full contents of the downloaded JSON key |
| `GOOGLE_SHEET_ID` | the sheet ID from step 1 |

5. Run it once from the **Actions** tab → "Weekly Google Sheet sync" → **Run workflow**.

To run locally, put the same three values in `.env` (`GOOGLE_SERVICE_ACCOUNT_JSON`
as a single line) and run `npm run sync:sheets`.

## Deploying to Vercel

1. Create a free Postgres database (Neon or Vercel Postgres) and copy its
   connection string.
2. Locally, put that string in `.env` as `DATABASE_URL`, then run
   `npm run setup` once to create the tables and seed demo data.
3. On Vercel: **Import** this repo, set the **Framework Preset to Next.js**, and
   add two Environment Variables — `DATABASE_URL` (same string) and
   `SESSION_SECRET` (any long random value). Deploy.

## External integrations

Four features ship with simulated defaults but flip to real providers as soon as
you set an env var (see `.env.example`). Full walkthrough in **[INTEGRATIONS.md](INTEGRATIONS.md)**:

| Feature | Provider | Adapter |
|---|---|---|
| Online rent payments | Stripe | `src/lib/integrations/payments.ts` |
| Document file uploads | AWS S3 / R2 | `src/lib/integrations/storage.ts` |
| Bank reconciliation | Plaid | `src/lib/integrations/bank.ts` |
| Email notifications | Resend | `src/lib/integrations/notifications.ts` |

## Notes & next steps

This is a working MVP, not a production system. Before going live you'd also want:

- A vetted auth library (e.g. Auth.js / iron-session) instead of the demo cookie scheme
- Client-side payment confirmation + Stripe webhooks before marking invoices paid
- Automated recurring-invoice generation (a cron job creating monthly rent invoices)
