# Architecture Decisions

This file summarizes the main architectural choices and trade-offs for defence discussion.

## ADR 1: Simulation Instead Of Real Big Data Runtime

Decision: The project simulates pipeline execution instead of running Spark, Airflow, Kafka or a distributed compute system.

Why:

- Keeps the project explainable in a school setting.
- Focuses on architecture, integration, data modelling and monitoring workflows.
- Avoids infrastructure overhead that would hide the application design.

Trade-off:

- It cannot prove distributed processing performance.
- It can still demonstrate orchestration concepts, ETL states, alerts and observability.

## ADR 2: FastAPI Service Layer With SQLAlchemy

Decision: Use FastAPI routes as thin controllers and put business rules in service modules.

Why:

- Route handlers remain readable.
- Business rules are easier to test directly.
- Pydantic schemas define request and response contracts.
- SQLAlchemy models map cleanly to the domain model.

Trade-off:

- More files than a single simple API module.
- Clearer separation improves maintainability.

## ADR 3: PostgreSQL Main Database With SQLite Fallback

Decision: PostgreSQL is used in Docker, while SQLite is available for local/test fallback.

Why:

- PostgreSQL is realistic for a deployed service.
- SQLite makes tests and simple local checks easier.
- Alembic migrations keep schema evolution explicit.

Trade-off:

- SQLite cannot perfectly match all PostgreSQL behavior.
- Tests focus on business rules and API behavior, not PostgreSQL-specific tuning.

## ADR 4: Redis/RQ For Async Pipeline Runs

Decision: The backend creates a JobRun and enqueues work into Redis/RQ. The worker executes the simulated pipeline.

Why:

- HTTP requests return immediately.
- Worker failures are separated from API request handling.
- The architecture shows asynchronous integration.

Trade-off:

- RQ is simple, but not as feature-rich as Airflow or Celery.
- This is acceptable for an explainable simulation.

## ADR 5: Separate Scheduler Singleton

Decision: The scheduler runs as its own process and is intended to be a singleton.

Why:

- Scheduled-run creation is independent from API traffic.
- It reflects production architectures where schedulers are separate workers.
- Duplicate scheduled runs are prevented by checking schedule windows.

Trade-off:

- In production, stronger locking would be needed for multiple replicas.

## ADR 6: Keycloak Primary Auth With Demo Fallback

Decision: Keycloak JWT validation is the primary mode, with demo auth fallback using `X-Demo-User-Id`.

Why:

- Keycloak demonstrates external identity provider integration.
- Demo auth keeps local development and automated tests simple.
- RBAC remains enforced in both modes.

Trade-off:

- The frontend does not yet implement the Keycloak login redirect flow.
- Backend JWT validation is ready for bearer tokens.

## ADR 7: Custom CSS And No MUI

Decision: Use custom CSS for the frontend instead of MUI.

Why:

- Matches project requirements.
- Keeps the UI lightweight and easy to inspect.
- Avoids hiding design decisions behind a component framework.

Trade-off:

- More styling work is manual.

## ADR 8: Audit Log, Outbox And Heartbeats

Decision: Include operational entities even though this is a simulation.

Why:

- AuditLog supports traceability.
- OutboxEvent demonstrates integration-event thinking.
- WorkerHeartbeat and SchedulerHeartbeat make background services observable.

Trade-off:

- Outbox processing is not implemented yet.
- Heartbeats are simple status records, not full metrics.
