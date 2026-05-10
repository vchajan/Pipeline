# Architecture

Big Data Pipeline Monitor is a full-stack simulation of a pipeline monitoring platform.

## Purpose

The project demonstrates software architecture around evidence, execution simulation and monitoring of data pipelines over datasets. It deliberately does not run real Spark, Airflow, Kafka, Flink or other distributed big data infrastructure.

## High-Level View

```text
Browser
  |
  v
Nginx
  |
  +--> React frontend
  |
  +--> FastAPI backend
        |
        +--> PostgreSQL
        |
        +--> Redis/RQ queue
              |
              v
            Worker

Scheduler runs separately and creates scheduled runs.
Keycloak is available through a Compose override.
```

## Components

### Frontend

The frontend is a React/Vite TypeScript application. React Router handles navigation and TanStack Query handles server-state fetching and mutations. The UI uses custom CSS only.

Pages:

- Dashboard
- Datasets and dataset detail
- Pipelines, pipeline detail and versions
- Runs and run detail
- Alert rules
- Alerts and alert detail
- Users
- Audit logs
- System status

### Backend

The backend is a FastAPI application. Routes are thin and delegate business rules to services. Pydantic schemas define API contracts. SQLAlchemy models define persistence. Alembic creates the database schema.

Main backend folders:

- `app/api`: routes and dependencies
- `app/core`: configuration, Keycloak validation, RBAC helpers
- `app/db`: SQLAlchemy session and base metadata
- `app/models`: ORM models and enums
- `app/schemas`: request/response schemas
- `app/services`: business rules
- `app/workers`: Redis/RQ worker code

### PostgreSQL

PostgreSQL is the primary local Docker database. It stores domain entities, operational telemetry, audit logs and outbox events.

### Redis/RQ Worker

Redis stores RQ jobs. The backend enqueues a run id, and the worker loads the JobRun from the database. The worker then simulates extract, transform and load steps, updates run status, creates alerts, writes audit/outbox records and updates WorkerHeartbeat.

### Scheduler

The scheduler is a separate singleton process. It checks active pipelines with cron schedules, creates scheduled JobRuns when due and enqueues them to Redis/RQ. It writes SchedulerHeartbeat.

### Nginx

Nginx is the local single entry point. It proxies frontend traffic to Vite and API traffic to FastAPI.

### Keycloak

Keycloak is the primary authentication infrastructure. The override compose file starts Keycloak and imports a `pipeline-monitor` realm with client, roles and demo users. Demo auth remains available for local development and tests.

## Security Model

Authentication modes:

- Keycloak JWT bearer token
- Demo auth fallback with `X-Demo-User-Id`

Roles:

- viewer: read-only
- operator: can start/cancel runs and acknowledge/resolve alerts
- admin: full management of definitions

## Observability

The application records:

- AuditLog for important actions
- OutboxEvent for future event publishing
- WorkerHeartbeat for worker status
- SchedulerHeartbeat for scheduler status

## Key Architectural Point

The backend never executes pipeline runs inside the HTTP request. It creates a queued JobRun and hands execution to Redis/RQ. This demonstrates asynchronous integration and keeps API request handling separated from long-running work.
