# Frontend

React/Vite frontend for the Big Data Pipeline Monitor.

## Stack

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- Custom CSS
- Vitest
- Playwright

The frontend does not use MUI and does not include mobile packaging.

## Structure

```text
src/
  api/          API client and TanStack Query hooks
  auth/         demo auth helpers and role utilities
  components/   reusable UI components
  layouts/      app shell and navigation
  pages/        routed pages
  routes/       React Router configuration
  styles/       custom CSS
  types/        frontend domain types
tests/          Vitest tests
e2e/            Playwright tests
```

## Local Commands

```powershell
npm install
npm run dev
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

The Vite dev server listens on `http://localhost:5173`.

## API Connection

The frontend uses `VITE_API_BASE_URL`, defaulting to `/api`.

- Through Docker/Nginx: open `http://localhost:8088`
- Direct Vite development: open `http://localhost:5173`
- Vite proxies `/api` to `http://localhost:8000`

## Pages

- Dashboard
- Datasets and dataset detail
- Pipelines, pipeline detail and pipeline versions
- Runs and run detail
- Alert rules
- Alerts and alert detail
- Users
- Audit logs
- System status

## Auth During Development

The app supports a demo role switcher for local development:

- Admin can manage datasets, pipelines, versions and alert rules.
- Operator can start/cancel runs and acknowledge/resolve alerts.
- Viewer is read-only.

Keycloak login UI is intentionally not implemented yet. The backend can validate Keycloak JWTs when a bearer token is supplied.
