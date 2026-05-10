# Big Data Pipeline Monitor

MSWA school project for simulating evidence, execution and monitoring of data pipelines over datasets.

The system is intentionally a simulation. It is not a real Spark, Airflow, Kafka or distributed big data platform.

## Quick Start

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Or on Linux/macOS:

```bash
cp .env.example .env
```

Validate the default Docker Compose setup:

```bash
docker compose config
```

Start the Phase 1 infrastructure skeleton:

```bash
docker compose up --build
```

Start with Keycloak included:

```bash
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml up --build
```

The Nginx entry point is available at `http://localhost:8088` by default. PostgreSQL and Redis are also published locally for development.

Phase 1 only wires the infrastructure. Backend, worker, scheduler and frontend containers wait when their application entrypoints do not exist yet; those entrypoints are implemented in later phases.

## Services

- `postgres`: main PostgreSQL database
- `redis`: Redis instance for the future RQ queue
- `backend-migrate`: Alembic migration runner
- `backend`: future FastAPI API service
- `worker`: future RQ worker service
- `scheduler`: future singleton scheduler service
- `frontend`: future Vite React application
- `nginx`: single reverse proxy entry point
- `keycloak-db`: Keycloak database, enabled by override
- `keycloak`: Keycloak auth server, enabled by override

## Useful Commands

```bash
docker compose config
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml config
docker compose ps
docker compose logs -f
docker compose down
docker compose down -v
```

## Target Architecture

- Frontend: React, Vite, TypeScript, React Router, TanStack Query, custom CSS
- Backend: FastAPI, Pydantic, SQLAlchemy, Alembic
- Database: PostgreSQL in Docker, SQLite fallback
- Async jobs: Redis + RQ worker
- Scheduler: standalone singleton service
- Proxy: Nginx
- Auth: Keycloak primary mode, demo auth fallback
- Security: RBAC roles admin/operator/viewer, audit log
- Tests: Pytest, Vitest, Playwright, smoke test
- CI: GitHub Actions

Project guidance lives in `AGENTS.md`, `docs/PROJECT_BLUEPRINT.md` and `docs/CODEX_PHASE_PROMPTS.md`.
