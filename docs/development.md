# Local development

## Requirements

- Node.js 22 or newer
- npm from the Node.js installation
- PowerShell on the current Windows workstation

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set a private `AUTH_SECRET` and `SEED_ADMIN_PASSWORD`.
3. Install dependencies with `npm install`.
4. Start the app with `npm run dev -- -p 3210`.
5. Open `http://localhost:3210`; locale routing redirects to `/fr`.

External payment and email keys are deliberately unnecessary in development. The `development` adapters record deterministic local events and never contact a real provider.

## Quality commands

- `npm run typecheck` checks strict TypeScript types.
- `npm run lint` checks application source.
- `npm test` runs all Vitest files with one worker.
- `npm run check` runs the three checks sequentially.
- `npm run build` creates the production build.

The single-worker Vitest configuration is intentional. On this workspace, jsdom setup dominates runtime and parallel Node workers contend with other long-lived applications. The complete baseline is 20 files and 115 tests and can take roughly 2.5 minutes.

## Windows workspace notes

The development and production builds both use `.next`. If routing behaves inconsistently after switching between `build` and `dev`, stop the Reign process, remove only this project's `.next` directory, and restart on port 3210. Do not terminate unrelated Node processes or assume port 3000 belongs to Reign.

## Database lifecycle

Database migration and seed commands are added with the persistence increment. Local data belongs under `data/` and must remain ignored by Git. Production migrations are run as a release step, never automatically from a page request.
