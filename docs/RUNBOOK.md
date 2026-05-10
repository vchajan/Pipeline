# Runbook

This runbook explains how to start, inspect and demonstrate the Big Data Pipeline Monitor.

## Prerequisites

- Docker Desktop or Docker Engine with Compose
- Python 3.12 for backend local checks
- Node.js 22 or compatible modern Node for frontend checks
- PowerShell examples assume Windows, but the same commands map directly to bash

## Environment

Create `.env` from the checked-in template:

```powershell
Copy-Item .env.example .env
```

Important defaults:

- Nginx: `http://localhost:8088`
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Keycloak: `http://localhost:8080`

## Run Without Keycloak

This is the quickest demo mode. Demo auth is enabled and the frontend role switcher selects the `X-Demo-User-Id` header.

```powershell
docker compose up --build
```

Open:

- App: `http://localhost:8088`
- Backend docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
- Readiness: `http://localhost:8000/ready`

## Run With Keycloak

```powershell
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml up --build
```

Keycloak:

- URL: `http://localhost:8080`
- Admin: `admin` / `admin`
- Realm: `pipeline-monitor`
- Client: `pipeline-monitor-web`
- Users: `admin/admin123`, `operator/operator123`, `viewer/viewer123`

If the realm import is stale, reset the Keycloak volume:

```powershell
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml down -v
```

## Useful Docker Commands

```powershell
docker compose config
docker compose ps
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f scheduler
docker compose down
docker compose down -v
```

Validate the Keycloak override:

```powershell
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml config
```

## Typical Demo Scenario

1. Start the default Docker stack.
2. Open `http://localhost:8088`.
3. Keep the role switcher on Admin.
4. Create a dataset from the Datasets page.
5. Create a pipeline from the Pipelines page.
6. Create an alert rule from the Alert Rules page.
7. Switch to Operator.
8. Open the pipeline detail and run the pipeline.
9. Open the run detail to inspect status, runtime, records and ETL steps.
10. Open Alerts and inspect the alert event.
11. Acknowledge and resolve the alert.
12. Open System Status to show worker/scheduler heartbeat.
13. Open Audit Logs to show operational traceability.

## Service Responsibilities

- Backend validates input, applies business rules, creates JobRuns and enqueues work.
- Worker loads queued runs, simulates extract/transform/load, creates alerts, writes audit/outbox records and updates heartbeat.
- Scheduler checks active scheduled pipelines and creates due runs.
- Frontend reads API state through TanStack Query and hides or disables role-restricted actions.
- Nginx provides a single local entry point.
- PostgreSQL stores durable application state.
- Redis stores queued RQ jobs.
- Keycloak provides primary JWT authentication mode.

## Troubleshooting

- If migrations fail, inspect `docker compose logs backend-migrate`.
- If runs stay queued, inspect `docker compose logs worker` and Redis connectivity.
- If scheduled runs do not appear, inspect `docker compose logs scheduler`.
- If frontend API calls fail in direct Vite mode, make sure the backend is running on `http://localhost:8000`.
- If Keycloak users are missing, reset the Keycloak volume and restart with the override.
