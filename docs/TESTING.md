# Testing

The project includes backend Pytest tests, frontend Vitest tests, Playwright e2e tests, Docker Compose config validation and a smoke test.

## Backend Tests

Install dependencies:

```powershell
cd backend
pip install -r requirements.txt
```

Run:

```powershell
python -m pytest
```

Covered rules:

- create dataset
- create pipeline requires existing dataset
- inactive pipeline cannot run
- run creates JobRun and JobRunStep records
- invalid run transition is rejected
- failed run creates alert
- viewer cannot create dataset
- operator can start pipeline
- admin can create alert rule

## Backend Compile Check

```powershell
python -m compileall backend/app backend/alembic
```

## Frontend Tests

Install dependencies:

```powershell
cd frontend
npm install
```

Run typecheck and unit tests:

```powershell
npm run typecheck
npm run test
```

Vitest covers:

- dashboard summary renders
- empty state renders
- error state renders
- viewer does not get enabled create/run actions
- operator sees an enabled Run pipeline button

Run production build:

```powershell
npm run build
```

## Playwright E2E

Install browser:

```powershell
npx playwright install chromium
```

Run:

```powershell
npm run test:e2e
```

The e2e flow covers demo role selection, dataset creation, pipeline creation, alert rule creation, running a pipeline, opening run detail, opening alerts and acknowledging/resolving an alert.

## Smoke Test

Start the stack first:

```powershell
docker compose up --build
```

Run against backend:

```powershell
python infra/smoke_test.py --api-base http://localhost:8000
```

Run through Nginx:

```powershell
python infra/smoke_test.py --api-base http://localhost:8088/api
```

Smoke test behavior:

- checks `/health`
- checks `/ready`
- creates dataset
- creates pipeline
- creates active deterministic failing pipeline version
- creates alert rule
- runs pipeline
- waits for worker completion
- verifies failed status
- verifies run details are retrievable
- verifies alert was created

## Docker Compose Validation

```powershell
docker compose config
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml config
```

## CI

GitHub Actions runs:

- backend compile check
- backend Pytest tests
- frontend typecheck
- frontend Vitest tests
- frontend build
- Playwright e2e
- Docker Compose config validation

## Suggested Full Local Verification

```powershell
python -m compileall backend/app backend/alembic

cd backend
python -m pytest

cd ..\frontend
npm run typecheck
npm run test
npm run build
npm run test:e2e

cd ..
docker compose config
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml config
python infra/smoke_test.py --api-base http://localhost:8000
```
