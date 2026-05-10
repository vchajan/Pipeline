# Codex Phase Prompts

Use these prompts one by one. Do not ask Codex to implement the whole project in one pass.

## Phase 1 — infrastructure skeleton

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 1: infrastructure skeleton.

Create or update these files:
- `.gitignore`
- `.env.example`
- `docker-compose.yml`
- `docker-compose.keycloak.yml`
- `nginx/nginx.conf`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `README.md` with a short quick-start section

The Docker Compose setup should define these services:
- postgres
- redis
- backend-migrate
- backend
- worker
- scheduler
- frontend
- nginx

The Keycloak compose override should add:
- keycloak-db
- keycloak

Do not implement backend business logic yet.
Do not implement frontend pages yet.
Do not use MUI.
Do not add mobile packaging.

After editing, show me:
1. changed files
2. how to run the stack
3. any assumptions you made
```

## Phase 2 — backend core

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 2: backend core.

Create the FastAPI backend structure:
- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/db/session.py`
- `backend/app/db/base.py`
- `backend/app/db/seed.py`
- `backend/requirements.txt`
- `backend/alembic.ini`
- `backend/alembic/env.py`

Set up FastAPI, settings from env vars, PostgreSQL via DATABASE_URL, SQLite fallback, SQLAlchemy session handling, Alembic, /health and /ready.
Do not implement domain models yet except minimal Base import structure.
```

## Phase 3 — domain models and migration

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 3: domain models and initial Alembic migration.

Create SQLAlchemy models for User, Dataset, Pipeline, PipelineVersion, JobRun, JobRunStep, AlertRule, AlertEvent, AuditLog, OutboxEvent, WorkerHeartbeat and SchedulerHeartbeat.

Create model files under backend/app/models/, imports in backend/app/db/base.py and initial Alembic migration under backend/alembic/versions/.
Use enum columns for statuses, roles, alert conditions, severity, processing mode and load type.
Do not implement API routes yet.
```

## Phase 4 — API routes and service layer

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 4: backend API routes and service layer.

Create schemas, services and routes for datasets, pipelines, pipeline versions, runs, alert rules, alerts, dashboard summary, audit logs and system status.

Business logic must be in services, not route handlers.

For POST /pipelines/{id}/run, create the JobRun and leave a TODO for queue enqueue if needed.
```

## Phase 5 — Redis/RQ worker

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 5: Redis/RQ worker.

Add backend/app/workers/queue.py, backend/app/workers/pipeline_jobs.py and backend/app/workers/worker.py.

Update pipeline run service so backend creates JobRun in queued state, creates extract/transform/load steps, enqueues run_id to Redis/RQ and returns immediately.

Worker must process steps, simulate runtime/records/failure, set final status, create alerts, write AuditLog and OutboxEvent, and update WorkerHeartbeat.
```

## Phase 6 — scheduler

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 6: scheduler service.

Add backend/app/scheduler.py and backend/app/services/scheduler_service.py.

Use croniter. Scheduler must run separately, check active scheduled pipelines, prevent duplicate scheduled runs, enqueue runs, and update SchedulerHeartbeat.
```

## Phase 7 — authentication and authorization

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 7: authentication and authorization.

Primary mode: Keycloak JWT authentication.
Fallback mode: demo auth using X-Demo-User-Id.

Add backend/app/core/security.py, backend/app/core/keycloak.py, backend/app/core/permissions.py, backend/app/api/deps.py, auth schemas and /auth/me.

Implement RBAC and protect write endpoints.
```

## Phase 8 — Keycloak infrastructure

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 8: Keycloak infrastructure.

Create infra/keycloak/pipeline-monitor-realm.json, start-keycloak-mode.ps1, start-keycloak-mode.sh, export-realm.ps1, export-realm.sh and infra/README.md.

Realm: pipeline-monitor.
Client: pipeline-monitor-web.
Roles: admin, operator, viewer.
Users: admin/admin123, operator/operator123, viewer/viewer123.
```

## Phase 9 — frontend foundation

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 9: frontend foundation.

Create React frontend with Vite, TypeScript, React Router, TanStack Query and custom CSS.
Do not use MUI. Do not add mobile packaging.

Create src/api, src/auth, src/components, src/layouts, src/pages, src/routes, src/styles and src/types.
Implement layout, navigation, API client, QueryClient provider, placeholder pages and reusable loading/error/empty components.
```

## Phase 10 — frontend pages

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 10: frontend pages.

Implement Dashboard, Datasets, Dataset detail, Pipelines, Pipeline detail, Pipeline versions, Runs, Run detail with ETL steps/timeline, Alert rules, Alerts, Alert detail, Users, Audit logs and System status.

Use TanStack Query, React Router, custom CSS, role-based actions and loading/empty/error states.
```

## Phase 11 — tests

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 11: tests.

Add backend Pytest tests for main business rules.
Add frontend Vitest tests for dashboard, empty/error states and role-based UI.
Add Playwright e2e test for creating dataset/pipeline/rule, running pipeline, viewing run detail and resolving alert.
```

## Phase 12 — smoke test, CI and documentation

```text
Read `AGENTS.md` and `docs/PROJECT_BLUEPRINT.md`.

Implement only Phase 12: smoke test, CI and documentation.

Add infra/smoke_test.py, .github/workflows/ci.yml, backend/README.md, frontend/README.md and docs: ARCHITECTURE, DOMAIN_MODEL, API_OVERVIEW, COURSE_CONNECTIONS, DEFENCE_NOTES, DEPLOYMENT, TESTING.
```
