# RentHive

A property-management web app inspired by TenantCloud — landlord and tenant portals for
managing properties, units, leases, rent, and maintenance.

> Original, clean-room implementation. Not affiliated with or copied from TenantCloud.

## Stack

- **Next.js 15** (App Router, React 19, Server Actions)
- **Prisma ORM** — SQLite in dev (zero setup), Postgres-ready for production
- **Tailwind CSS**
- Cookie-based session auth with role separation (landlord / tenant)

## Quick start

```bash
npm install
cp .env.example .env   # then edit if needed (works as-is for local dev)
npm run setup          # generates client, creates the SQLite DB, seeds demo data
npm run dev            # http://localhost:3000
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
| `npm run db:reset` | Wipe and reseed the database              |
| `npm run db:studio`| Open Prisma Studio to browse data         |
| `npm run build`    | Production build                          |

## Switching to Postgres

1. In `prisma/schema.prisma`, set `datasource db { provider = "postgresql" }`.
2. In `.env`, set `DATABASE_URL` to your Postgres connection string.
3. Run `npm run db:push && npm run db:seed`.

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
