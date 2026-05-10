# Big Data Pipeline Monitor

MSWA school project for simulating evidence, execution and monitoring of data pipelines over datasets.

The application is intentionally a simulation. It does not run Spark, Airflow, Kafka, Flink or a distributed big data platform. It models the same architectural concerns in a small, explainable full-stack system: REST API, database schema, asynchronous worker, scheduler, authentication, RBAC, monitoring pages and tests.

## What It Demonstrates

- Bounded context for dataset pipeline monitoring
- FastAPI service layer with Pydantic schemas and SQLAlchemy models
- PostgreSQL persistence with Alembic migrations and SQLite fallback for tests
- Redis/RQ queue so HTTP requests do not execute pipeline work
- Separate worker and singleton scheduler processes
- React/Vite frontend with React Router, TanStack Query and custom CSS
- Keycloak JWT authentication as primary mode, demo auth fallback for local work
- RBAC roles: `viewer`, `operator`, `admin`
- Audit log, outbox events, worker heartbeat and scheduler heartbeat
- Pytest, Vitest and Playwright test coverage

## Architecture

```text
Browser
  |
  v
Nginx :8088
  |
  +--> React frontend :5173
  |
  +--> FastAPI backend :8000
        |
        +--> PostgreSQL
        |
        +--> Redis queue
              |
              v
            RQ worker

Scheduler runs as a separate singleton process and creates scheduled runs.
Keycloak is enabled with docker-compose.keycloak.yml.
```

Main services:

- `postgres`: persistent application database
- `redis`: RQ queue backend
- `backend-migrate`: Alembic migration runner
- `backend`: FastAPI REST API
- `worker`: async pipeline run processor
- `scheduler`: singleton scheduled-run creator
- `frontend`: Vite React app
- `nginx`: single local entry point
- `keycloak-db` and `keycloak`: optional auth infrastructure override

## Domain Model

```text
User

Dataset <- Pipeline <- PipelineVersion
             ^
          JobRun
             ^
        JobRunStep

Pipeline <- AlertRule <- AlertEvent

Operational:
AuditLog, OutboxEvent, WorkerHeartbeat, SchedulerHeartbeat
```

Core business rules:

- A pipeline can be created only for an existing dataset.
- Inactive pipelines cannot be started.
- A pipeline can have only one active version.
- Runs are created in the API, queued in Redis/RQ and processed by the worker.
- Alerts are created when configured rule conditions match run outcomes.
- Viewers are read-only, operators can operate runs and alerts, admins can manage definitions.

## Quick Start Without Keycloak

Demo auth is enabled by default. The frontend sends `X-Demo-User-Id` for local development.

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open:

- App through Nginx: `http://localhost:8088`
- Frontend direct Vite dev server: `http://localhost:5173`
- Backend direct API: `http://localhost:8000`
- Backend docs: `http://localhost:8000/docs`

Demo users:

- Admin: `X-Demo-User-Id: 1`
- Operator: `X-Demo-User-Id: 2`
- Viewer: `X-Demo-User-Id: 3`

## Quick Start With Keycloak

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml up --build
```

Keycloak:

- Admin console: `http://localhost:8080`
- Admin user: `admin`
- Admin password: `admin`
- Realm: `pipeline-monitor`
- Client: `pipeline-monitor-web`
- Users: `admin/admin123`, `operator/operator123`, `viewer/viewer123`

The backend validates Keycloak JWTs when an `Authorization: Bearer <token>` header is sent. Demo auth remains available for local/testing fallback while `DEMO_AUTH_ENABLED=true`.

## Typical Demo Scenario

1. Open the app.
2. Use the demo role switcher as Admin.
3. Create a dataset.
4. Create a pipeline for the dataset.
5. Create an alert rule for the pipeline.
6. Switch to Operator.
7. Run the active pipeline.
8. Inspect the run detail and ETL step timeline.
9. Inspect alerts.
10. Acknowledge and resolve an alert.
11. Show audit logs and system status.

PowerShell API commands for the same flow are in [docs/API_EXAMPLES.md](docs/API_EXAMPLES.md).

## Local Checks

Backend:

```powershell
cd backend
pip install -r requirements.txt
python -m compileall app alembic
python -m pytest
```

Frontend:

```powershell
cd frontend
npm install
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Docker:

```powershell
docker compose config
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml config
```

## Documentation

- [Runbook](docs/RUNBOOK.md)
- [API examples](docs/API_EXAMPLES.md)
- [Architecture decisions](docs/ARCHITECTURE_DECISIONS.md)
- [Testing](docs/TESTING.md)
- [Defence notes](docs/DEFENCE_NOTES.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)
- [Project blueprint](docs/PROJECT_BLUEPRINT.md)

Project instructions for Codex are in [AGENTS.md](AGENTS.md).
