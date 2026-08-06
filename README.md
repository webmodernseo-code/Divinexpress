# Reign

Reign is a bilingual FR/EN premium-commerce application built with Next.js 16 and React 19. It includes a storefront, guest checkout, and an administration dashboard. The server foundation uses a local relational database and credential-free development adapters; real payment and email providers are intentionally required before production.

## Start locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run db:setup
npm run dev -- -p 3210
```

Set `AUTH_SECRET`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` in `.env.local` before logging into `/fr/connexion`. No default production password exists.

## Commands

```text
npm run dev          Start Next.js development mode
npm run build        Create a production build
npm run typecheck    Check strict TypeScript
npm run lint         Lint application source
npm test             Run Vitest with deterministic worker settings
npm run check        Run typecheck, lint, and tests
npm run db:migrate   Apply database migrations
npm run db:seed      Seed the current storefront catalog
npm run db:setup     Migrate and seed
```

See [local development](docs/development.md), [operations](docs/operations.md), [production readiness](docs/production-readiness.md), and the [full-stack design](docs/superpowers/specs/2026-08-04-reign-fullstack-foundation-design.md).

## Architecture

UI code calls server actions or route handlers. Server boundaries validate input and delegate to domain services, which use repository/database adapters. Payment and notification providers implement interfaces so development can be fully exercised without contacting a real account.

SQLite is the credential-free development database. Production launch requires a managed PostgreSQL adapter, signed payment webhooks, transactional email, media storage, legal data, shipping/tax rules, and the verification gates listed in `docs/production-readiness.md`.
