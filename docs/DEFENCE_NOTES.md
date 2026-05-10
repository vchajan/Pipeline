# Defence Notes

Use this as a short guide for a 10-minute oral defence.

## 1. Project Purpose

The project is a Big Data Pipeline Monitor simulation. It models datasets, pipelines, pipeline versions, job runs, ETL steps, alert rules and alert events. It does not run a real Spark or Airflow system. The goal is to demonstrate software architecture around a monitoring and orchestration domain.

## 2. Architecture In One Minute

The browser enters through Nginx. Nginx routes UI traffic to a Vite React frontend and API traffic to a FastAPI backend. The backend stores data in PostgreSQL and queues pipeline run work in Redis/RQ. A separate worker processes queued runs. A separate scheduler creates scheduled runs. Keycloak can provide JWT authentication, while demo auth is available for local testing.

## 3. Bounded Context

The bounded context is pipeline monitoring, not generic data processing.

Important concepts:

- Dataset: source metadata
- Pipeline: ETL/ELT process definition
- PipelineVersion: versioned execution config
- JobRun: process instance
- JobRunStep: extract, transform, load activity
- AlertRule: monitoring rule
- AlertEvent: incident created by a rule

## 4. Business Rules To Highlight

- Pipelines require an existing dataset.
- Inactive pipelines cannot run.
- Only one active version per pipeline.
- Runs move through controlled status transitions.
- Worker creates alerts when rules match failed runs, failed steps, runtime threshold or records threshold.
- Viewer is read-only, operator can operate runs and alerts, admin can manage definitions.

## 5. Integration Styles

- REST API is synchronous request/response.
- Redis/RQ is asynchronous queue integration.
- Nginx is a single entry point and reverse proxy.
- Keycloak is external identity provider integration.
- OutboxEvent models future event publishing.

## 6. Why It Is Defensible

- Code is split by responsibilities: routes, schemas, services, models, workers, scheduler.
- Business logic is not embedded in route handlers.
- Database schema is created through Alembic.
- Background work is outside HTTP requests.
- Tests cover important business and UI rules.
- Documentation explains operations, API examples, decisions and limitations.

## 7. Demo Flow

1. Show dashboard.
2. Create dataset as Admin.
3. Create pipeline as Admin.
4. Create alert rule as Admin.
5. Switch to Operator.
6. Run pipeline.
7. Open run detail and explain ETL steps.
8. Open alerts and acknowledge/resolve one.
9. Show system status and audit logs.

## 8. Honest Limitations

- Execution is simulated, not real distributed compute.
- Frontend Keycloak login redirect is not implemented.
- User management endpoints are not implemented.
- Run-step API endpoints are not exposed yet.
- Outbox is written but not delivered to another service.
- Production deployment would need HTTPS, secret management and stronger scheduler locking.

## 9. Closing Statement

The project is not a big data engine. It is a software architecture project that demonstrates how a monitoring platform around big data pipelines could be structured, secured, tested and operated.
