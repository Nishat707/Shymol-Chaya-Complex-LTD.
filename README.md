# Shymol Chaya Complex LTD. — Apartment Management System

Next.js (App Router, TypeScript) · Prisma · PostgreSQL and email/password authentication on Supabase · Vercel.

> **Status: working draft, not yet run end to end.** It was written without the ability to install packages or run
> the app, so expect to fix small errors on first run. Follow "First run" below and fix anything that breaks
> before relying on it for real money.

## What works (by design)
| Area | Details |
|---|---|
| Flats | 50 flats seeded (2A–2B, 3A–10F). Edit owner/tenant/phone/occupancy/custom charge. Ledger per flat. |
| Residents | Admin registers each resident email against a flat. Unregistered accounts are rejected. Residents see a read-only community dashboard with balance/dues, per-flat owner dues, all-time payer and expense-category charts, recent paid expenses, and active notices; staff-only pages remain restricted. Staff and residents can sign out from the app navigation. |
| Billing | Default charge with effective-date history, per-flat overrides, idempotent monthly generation; billed amounts are snapshots and never change. |
| Payments | Oldest-month-first allocation, partial and multi-month, overpayment rejected, unique receipt numbers, printable receipt, void with reason, CSV export. |
| Expenses | Manage active categories, including one-click setup of 12 standard categories; "recorded" vs "paid" are separate; void with reason. |
| Balance | Opening balance + money received − expenses paid. Unpaid charges and unpaid expenses are not counted. |
| Notices | Publish with priority and expiry; shown on the resident page. |
| Roles | Super Admin: everything. Manager: payments, expenses, flats, residents, notices, bill generation. Only Super Admin: default charge, opening balance, month closing, managers. |
| Safety | Month closing locks payments/expenses/bills; audit log for changes; DB triggers block deleting financial rows; CHECK constraints; row-level security. |

## Not built yet
PDF/Excel exports (CSV for payments only), file uploads (receipts/proofs), maintenance task screens
(table exists), configurable Manager permissions (roles are fixed in code),
reports pages, search/filters, and broader automated tests beyond the focused payment-allocation and dashboard-analytics checks. Ask for these next.

## Requirements
Node.js 20+, VS Code (install the recommended extensions when prompted), and a Supabase account.

## Local visual preview
Run `npm run dev` and open `http://127.0.0.1:3000` to browse a read-only demo with fictional sample data.
Demo actions are disabled and do not connect to Supabase. The preview route is available only in local development.
In production, the home page and `/login` use real authentication; configure Supabase email/password sign-in by
following "First run" below.

## First run (local, VS Code)
1. Unzip, then `File > Open Folder` in VS Code. Open a terminal.
2. `npm install`
3. `npm test` (checks the payment allocation logic)
4. Create a Supabase project near your residents and hosting region. Copy `.env.example` to `.env` and fill it in:
   - Project Settings > API: URL and anon key.
   - Project Settings > Database > Connection string: pooled (port 6543) for `DATABASE_URL`, direct (5432) for `DIRECT_URL`.
   - `SUPER_ADMIN_EMAIL` = the email you will use to sign in as Super Admin.
5. Create the database tables: `npx prisma migrate dev --name init`
   This generates `prisma/migrations/`. **Commit that folder to GitHub**; it is your migration history.
6. Apply the integrity rules: `psql "$DIRECT_URL" -f prisma/constraints.sql`
   (or paste the file into Supabase > SQL Editor and run it).
7. Seed: `npm run db:seed`
8. Supabase email/password sign-in:
   - Supabase > Authentication > Sign In / Providers > Email: ensure Email is enabled.
   - Authentication > Users > Add user. Create a confirmed user with the same email as `SUPER_ADMIN_EMAIL`
     and set a password. Do not put that password in `.env` or source control.
   - Authentication > URL Configuration: Site URL `http://127.0.0.1:3000`; allow
     `http://127.0.0.1:3000/**` (and your Vercel URL later). Use "Forgot or need to set your password?" on the login
     page to receive a secure reset link.
9. `npm run dev`, open http://127.0.0.1:3000/login, and sign in with the Super Admin email and password.
10. Settings > "Generate monthly bills" for each month you want billed. Then Flats > open a flat > add the resident's email.
    Create a confirmed Supabase Auth user with the same email so the resident can sign in.

## Additional features migration
The additive database migration for resident suggestions, maintenance requests, notifications, notice
categories/pinning, and resident profile fields is in `migrations/app/`. The Prisma deploy workflow applies
it automatically. For a manually managed database, use the project's Prisma migration process; the standalone
SQL alternative is documented below only for operators who do not run the migration workflow.

```bash
psql "$DIRECT_URL" -f prisma/additional-features.sql
psql "$DIRECT_URL" -f prisma/constraints.sql
```

## Deploy to Vercel using the existing Prisma Postgres database
1. Import the private GitHub repository into Vercel and select Next.js.
2. Set these Vercel environment variables:
   - `DATABASE_URL` = a dedicated production connection URL for the existing Prisma Postgres database (not the Supabase database URL).
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the existing Supabase Auth project values.
   - `NEXT_PUBLIC_SITE_URL` = the canonical public URL, such as `https://your-domain.com`.
3. Add the domain in Vercel, then set `NEXT_PUBLIC_SITE_URL` to that exact origin and redeploy.
4. In Supabase > Authentication > URL Configuration, set the Site URL and allow the Vercel production domain as a redirect URL.

The Vercel app and Prisma Cloud app use the same Prisma Postgres database. Do not run migrations or the full seed as part of this deployment: production already contains its schema, Super Admin, and 50 flats. Keep the database URL in Vercel's encrypted environment settings; never commit it or paste it into chat.

The existing Prisma Cloud deployment continues using its Composer-provided database client and configuration.

## Project layout
- `prisma/schema.prisma` data model · `prisma/constraints.sql` DB rules · `prisma/seed.ts` initial data
- `lib/allocate.ts, billing.ts, payments.ts, finance.ts` money rules · `lib/actions.ts` all admin write actions
- `lib/session.ts` approved-email access control · `app/auth/callback` sign-in return
- `app/admin/*` staff screens · `app/resident` resident screen · `app/globals.css` styling

## Backups
Free Supabase projects may not include automatic backups. Use a paid plan or schedule `pg_dump` exports.
Never put keys in chat or commit `.env`.
