# Backend

FastAPI backend for the Big Data Pipeline Monitor simulation.

## Stack

- FastAPI
- Pydantic schemas
- SQLAlchemy ORM
- Alembic migrations
- PostgreSQL in Docker
- SQLite fallback for tests/local development
- Redis/RQ enqueue integration
- Pytest

## Structure

```text
app/
  api/
    routes/        REST route modules
    deps.py        database and auth dependencies
  core/            config, Keycloak JWT validation, permissions
  db/              SQLAlchemy engine/session and model imports
  models/          SQLAlchemy domain and operational models
  schemas/         Pydantic request/response contracts
  services/        business rules and persistence orchestration
  workers/         Redis/RQ queue and pipeline job processor
  main.py          FastAPI application
  scheduler.py     scheduler process entry point
alembic/           migration environment and versions
tests/             Pytest suite
```

## Local Commands

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run compile check:

```powershell
python -m compileall app alembic
```

Run tests:

```powershell
python -m pytest
```

Run locally with SQLite fallback:

```powershell
$env:AUTH_MODE = "demo"
$env:DEMO_AUTH_ENABLED = "true"
$env:DATABASE_URL = ""
$env:SQLITE_DATABASE_URL = "sqlite:///./pipeline_monitor.db"
uvicorn app.main:app --reload
```

## Important Endpoints

- `GET /health`
- `GET /ready`
- `GET /auth/me`
- `/datasets`
- `/pipelines`
- `/pipelines/{id}/versions`
- `/pipelines/{id}/run`
- `/runs`
- `/alert-rules`
- `/alerts`
- `/dashboard/summary`
- `/system/status`
- `/audit-logs`

The same routes are also mounted under `/api` for Nginx usage.

## Auth

Primary mode is Keycloak JWT bearer auth. Demo auth is a local fallback using:

```text
X-Demo-User-Id: 1  admin
X-Demo-User-Id: 2  operator
X-Demo-User-Id: 3  viewer
```

RBAC is enforced by FastAPI dependencies:

- viewer: read-only
- operator: start/cancel runs and acknowledge/resolve alerts
- admin: full definition management

## Worker And Scheduler

The backend API only creates queued JobRuns and enqueues work. The RQ worker executes the simulated extract, transform and load steps. The scheduler is a separate singleton process that creates scheduled runs for active pipelines with cron expressions.
