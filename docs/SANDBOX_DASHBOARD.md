# Sandbox dashboard

The sandbox dashboard is **this same codebase**, built and deployed separately
with sandbox environment variables and pointed at the sandbox build of the Go
API (`go build -tags sandbox`). Nothing is switched at runtime.

## Why a separate build

Next.js inlines every `NEXT_PUBLIC_*` variable into the JavaScript bundle when
`next build` runs. A build made with the live `.env` is a live dashboard
forever; you cannot flip it to sandbox by changing env vars and restarting.
So the sandbox needs its **own checkout/directory, its own `.next` build, its
own pm2 process and its own port**.

## What sandbox mode does (`NEXT_PUBLIC_ENVIRONMENT=sandbox`)

All changes are marked `// SANDBOX:` in the code; `utils/environment.ts` is
the single switch (`isSandbox`).

- Amber "TEST MODE" banner on every page (`components/EnvironmentBanner.tsx`),
  `[SANDBOX] ` tab-title prefix (`app/layout.tsx`).
- Red misconfiguration banner (any build) if `GET /me` reports a different
  `environment` than the build was made for.
- Register: no CAC/utility uploads; success copy says the account is approved
  on email verification.
- Dashboard: "Sandbox tools" card (add test funds, simulate bank transfer).
- Pending transactions / transaction lookup / transaction query: "Resolve as
  success / failed" on pending rows.
- `/sandbox/test-values` page (public in sandbox builds) + sidebar entry.
- Documentation page shows the sandbox base URL.

With `NEXT_PUBLIC_ENVIRONMENT` unset (live), none of this renders.

## Build and deploy

```bash
# 1. Separate checkout, e.g. next to the live one
git clone <repo> /var/www/myhisa-dashboard-sandbox
cd /var/www/myhisa-dashboard-sandbox

# 2. Sandbox env (gitignored). Next loads .env.production.local for builds.
cp .env.sandbox.example .env.production.local
#    edit NEXT_PUBLIC_API_URL (must end in /api/) and NEXT_PUBLIC_LIVE_DASHBOARD_URL

# 3. Install and build (the build bakes in the env above)
npm ci
npm run build

# 4. Run on its own port under a different pm2 name
#    (`npm start` hard-codes -p 8080, the live port, so call next directly)
pm2 start node_modules/next/dist/bin/next --name myhisa-dashboard-sandbox -- start -p 8081
pm2 save
```

Or add a second app to an ecosystem file in the sandbox checkout:

```js
module.exports = {
  apps: [{
    name: "myhisa-dashboard-sandbox",   // live is "airtimereporting"
    script: "node_modules/next/dist/bin/next",
    args: "start -p 8081",
  }],
};
```

Then put a separate hostname (e.g. `sandbox-dashboard.<domain>`) in front of
port 8081 in nginx. To deploy updates: `git pull && npm ci && npm run build &&
pm2 restart myhisa-dashboard-sandbox`. Any change to a `NEXT_PUBLIC_*` value
needs a rebuild, not just a restart.

## Checks after deploy

- The amber banner shows on the login page, and the tab title starts with
  `[SANDBOX]`.
- After login there is **no** red misconfiguration banner (if there is, the
  build is pointed at the live API or the API is not a sandbox build).
- `/sandbox/test-values` loads the outcome table.
- The live dashboard shows no banner (its build has no `NEXT_PUBLIC_ENVIRONMENT`).
