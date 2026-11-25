# Shymol Chaya Complex LTD. — Apartment Management System

Next.js (App Router, TypeScript) · Prisma · PostgreSQL and email/password authentication on Supabase · Vercel.

> **Status: working draft, not yet run end to end.** It was written without the ability to install packages or run
> the app, so expect to fix small errors on first run. Follow "First run" below and fix anything that breaks
> before relying on it for real money.

## What works (by design)
| Area | Details |
|---|---|
| Flats | 50 flats seeded (2A–2B, 3A–10F). Edit owner/tenant/phone/occupancy/custom charge. Ledger per flat. |
| Residents | Admin registers each resident email against a flat. Unregistered accounts are rejected. Residents see only their own flat, read-only. |
| Billing | Default charge with effective-date history, per-flat overrides, idempotent monthly generation; billed amounts are snapshots and never change. |
| Payments | Oldest-month-first allocation, partial and multi-month, overpayment rejected, unique receipt numbers, printable receipt, void with reason, CSV export. |
| Expenses | 12 seeded categories; "recorded" vs "paid" are separate; void with reason. |
| Balance | Opening balance + money received − expenses paid. Unpaid charges and unpaid expenses are not counted. |
| Notices | Publish with priority and expiry; shown on the resident page. |
| Roles | Super Admin: everything. Manager: payments, expenses, flats, residents, notices, bill generation. Only Super Admin: default charge, opening balance, month closing, managers. |
| Safety | Month closing locks payments/expenses/bills; audit log for changes; DB triggers block deleting financial rows; CHECK constraints; row-level security. |

## Not built yet
Charts, PDF/Excel exports (CSV for payments only), file uploads (receipts/proofs), maintenance task screens
(table exists), expense category management screen, configurable Manager permissions (roles are fixed in code),
reports pages, search/filters, automated tests beyond `tests/allocate.test.ts`. Ask for these next.

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

## Deploy (GitHub + Vercel)
1. Create a **private** GitHub repo and push this folder (`.env` is git-ignored).
2. Vercel > Add New Project > import the repo. Choose a region near Supabase (Tokyo for the current project). Add the same variables as `.env`,
   with `NEXT_PUBLIC_SITE_URL` set to your Vercel URL.
   For Prisma Cloud, set `NEXT_PUBLIC_SITE_URL` to the app's public production URL; the auth callback uses it for redirects.
3. Add the Vercel URL under Supabase > Authentication > URL Configuration.
4. Run once against production: `npm run db:deploy` (with production `DATABASE_URL`/`DIRECT_URL`), then the constraints SQL and the seed.
5. Add a second Super Admin account so you cannot be locked out.

## Project layout
- `prisma/schema.prisma` data model · `prisma/constraints.sql` DB rules · `prisma/seed.ts` initial data
- `lib/allocate.ts, billing.ts, payments.ts, finance.ts` money rules · `lib/actions.ts` all admin write actions
- `lib/session.ts` approved-email access control · `app/auth/callback` sign-in return
- `app/admin/*` staff screens · `app/resident` resident screen · `app/globals.css` styling

## Backups
Free Supabase projects may not include automatic backups. Use a paid plan or schedule `pg_dump` exports.
Never put keys in chat or commit `.env`.
