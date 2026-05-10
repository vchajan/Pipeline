# Course Connections

This project is designed to be explainable in a software architecture course.

## Integration Levels

- Presentation layer: React frontend
- Application/business layer: FastAPI services
- Data layer: PostgreSQL and SQLAlchemy
- API layer: REST endpoints
- Asynchronous layer: Redis/RQ worker queue
- Infrastructure layer: Docker Compose and Nginx
- Identity layer: Keycloak

## Integration Styles

Synchronous:

- Browser and frontend call REST API endpoints.
- Health and readiness checks are request/response operations.

Asynchronous:

- Backend enqueues JobRun ids into Redis/RQ.
- Worker processes runs outside the HTTP request.
- Scheduler creates scheduled runs independently from user traffic.

Reverse proxy:

- Nginx provides a single local entry point.

## BPM Mapping

- Pipeline = process definition
- PipelineVersion = versioned process definition
- JobRun = process instance
- JobRunStep = activity/task
- AlertRule = decision/business rule
- AlertEvent = incident

## DWH, ETL And ELT Mapping

- Dataset = source metadata
- Pipeline = ETL/ELT process
- JobRunStep = extract, transform, load
- Target layer = staging, raw, clean or mart
- Dashboard = monitoring/analytical view

## Big Data Concepts

The system references common big-data execution styles without running a real distributed platform:

- engines: python, sql, spark, databricks, aws_glue
- processing modes: batch, streaming, lambda, kappa
- load types: full, incremental
- source types: database, CSV, API, event stream, data lake

## Security Concepts

- Keycloak as identity provider
- JWT bearer authentication
- Demo auth as local fallback
- RBAC authorization
- Audit logging for traceability

## Operational Concepts

- Health and readiness endpoints
- Worker heartbeat
- Scheduler heartbeat
- Outbox table for future event publishing
- Docker Compose service orchestration

## Architectural Trade-Offs

The project prefers explainability over production complexity. It does not deploy a real big data cluster, but it demonstrates the boundaries, flows and responsibilities around one.
