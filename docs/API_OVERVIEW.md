# API Overview

The FastAPI backend exposes REST endpoints at the root path and under `/api`.

Use root paths directly against `http://localhost:8000`. Use `/api` paths through Nginx at `http://localhost:8088/api`.

## Health

- `GET /health`
- `GET /ready`

## Auth

- `GET /auth/me`

Authentication:

- Demo auth: `X-Demo-User-Id: 1`, `2` or `3`
- Keycloak auth: `Authorization: Bearer <jwt>`

## Datasets

- `POST /datasets` admin
- `GET /datasets`
- `GET /datasets/{id}`
- `PATCH /datasets/{id}` admin

## Pipelines

- `POST /pipelines` admin
- `GET /pipelines`
- `GET /pipelines/{id}`
- `PATCH /pipelines/{id}` admin
- `POST /pipelines/{id}/run` operator/admin
- `GET /pipelines/{id}/runs`
- `GET /pipelines/{id}/alerts`

## Pipeline Versions

- `POST /pipelines/{id}/versions` admin
- `GET /pipelines/{id}/versions`
- `PATCH /pipeline-versions/{id}/activate` admin

## Runs

- `GET /runs`
- `GET /runs/{id}`
- `PATCH /runs/{id}` operator/admin
- `PATCH /runs/{id}/cancel` operator/admin

The backend stores JobRunStep records, but dedicated `/runs/{id}/steps` and timeline endpoints are not implemented yet.

## Alert Rules

- `POST /alert-rules` admin
- `GET /alert-rules`
- `GET /alert-rules/{id}`
- `PATCH /alert-rules/{id}` admin
- `DELETE /alert-rules/{id}` admin

## Alerts

- `GET /alerts`
- `GET /alerts/{id}`
- `PATCH /alerts/{id}/acknowledge` operator/admin
- `PATCH /alerts/{id}/resolve` operator/admin

## Dashboard And Operations

- `GET /dashboard/summary`
- `GET /system/status`
- `GET /audit-logs`

## Demo Scenario API Flow

1. Create dataset as admin.
2. Create pipeline as admin.
3. Optionally create active pipeline version with deterministic config.
4. Create alert rule as admin.
5. Run pipeline as operator.
6. Poll `GET /runs/{id}` until terminal status.
7. List alerts.
8. Acknowledge or resolve alert as operator.

PowerShell examples are in `docs/API_EXAMPLES.md`.
