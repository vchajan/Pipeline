# Project instructions for Codex

This repository contains the MSWA school project **Big Data Pipeline Monitor**.

Always read `docs/PROJECT_BLUEPRINT.md` before making architectural changes.

## Main goal

Implement a full-stack application for evidence, execution simulation and monitoring of data pipelines over datasets.

The system must remain a simulation, not a real Spark, Airflow, Kafka or distributed big data platform.

## Required architecture

- Frontend: React, Vite, TypeScript, React Router, TanStack Query, custom CSS
- Backend: Python, FastAPI, Pydantic, SQLAlchemy, Alembic
- Database: PostgreSQL in Docker, SQLite fallback for tests/local development
- Async jobs: Redis + RQ worker
- Scheduler: separate singleton scheduler service
- Proxy: Nginx
- Auth: Keycloak as primary authentication, demo auth fallback
- Security: RBAC roles admin/operator/viewer
- Observability: audit log, outbox events, worker heartbeat, scheduler heartbeat
- Testing: Pytest, Vitest, Playwright, smoke test
- CI: GitHub Actions

## Domain model

```text
User

Dataset <- Pipeline <- PipelineVersion
             ^
          JobRun
             ^
        JobRunStep

Pipeline <- AlertRule <- AlertEvent
```

Additional operational entities:
- AuditLog
- OutboxEvent
- WorkerHeartbeat
- SchedulerHeartbeat

## Implementation rules

- Do not use MUI.
- Do not add mobile / Capacitor packaging.
- Use custom CSS.
- Keep business logic outside route handlers.
- Use services for business logic.
- Use schemas for request/response validation.
- Use Alembic migrations for schema creation.
- Use Docker Compose for local orchestration.
- Backend must not execute pipeline runs inside the HTTP request.
- Backend creates JobRun and enqueues work into Redis/RQ.
- Worker processes the JobRun asynchronously.
- Scheduler must be a separate singleton service.
- Keycloak is the primary auth mode.
- Demo auth is only a fallback for local development and tests.
- Add tests for important business rules.
- Keep the project explainable for a 10-minute oral defence.

## Required business rules

- Pipeline can be created only for an existing Dataset.
- Pipeline can run only when active is true.
- Pipeline can have only one active PipelineVersion.
- Run transitions:
  - pending -> queued
  - queued -> running
  - queued -> cancelled
  - running -> success
  - running -> failed
  - running -> cancelled
- Alert is created when:
  - run fails
  - runtime exceeds threshold
  - records processed are below threshold
  - pipeline did not run on schedule
  - step failed

## Roles

viewer:
- read-only access

operator:
- can start pipelines
- can cancel/update runs
- can acknowledge/resolve alerts

admin:
- full access
- can manage datasets, pipelines, versions, alert rules and users

## Work style

Implement in small phases.
After each phase:
- list changed files
- explain what was implemented
- run relevant checks if possible
- do not start the next phase until asked
