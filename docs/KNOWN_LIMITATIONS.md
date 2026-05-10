# Known Limitations

The project is intentionally scoped for a school software architecture defence.

## Simulation Scope

- Pipeline execution is simulated in Python.
- No real Spark, Airflow, Kafka, Flink, Databricks or AWS Glue jobs run.
- Runtime, records processed and failures are derived from PipelineVersion config.

## Backend

- User management endpoints are not implemented yet.
- Run-step and run-timeline endpoints are not exposed yet, although steps are stored in the database.
- Outbox events are written but not delivered to a broker or external service.
- Scheduler duplicate prevention uses database queries, not distributed locks.
- Alerting is stored in the database only; there is no email, Slack or webhook delivery.
- SQLite fallback is useful for tests but does not match PostgreSQL perfectly.

## Frontend

- Keycloak login redirect flow is not implemented in the UI.
- The Users page shows current/demo user information rather than full user administration.
- Run detail infers step display when dedicated step API responses are not available.
- The UI is functional for demonstration, not a production design system.

## Security

- Demo auth is enabled by default for local development.
- Production would require disabling demo auth, HTTPS/TLS, secure cookies or token handling, stronger CORS policy and secret management.
- Keycloak realm users use simple demo passwords.

## Operations

- Docker Compose is intended for local demonstration, not production orchestration.
- No centralized logging or metrics stack is included.
- Worker scaling is possible, but retry/dead-letter strategy is basic.

## Testing

- Tests cover important business rules and UI behavior, but not every endpoint or every edge case.
- Playwright e2e uses mocked API responses for frontend flow reliability.
- The smoke test requires a live local stack with backend, Redis, PostgreSQL and worker running.
