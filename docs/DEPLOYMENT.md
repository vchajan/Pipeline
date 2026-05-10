# Deployment

Docker Compose is the primary local deployment method.

## Default Stack

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Default services:

- `postgres`
- `redis`
- `backend-migrate`
- `backend`
- `worker`
- `scheduler`
- `frontend`
- `nginx`

Open:

- App through Nginx: `http://localhost:8088`
- Backend direct: `http://localhost:8000`
- Frontend direct: `http://localhost:5173`

## Keycloak Stack

```powershell
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml up --build
```

Adds:

- `keycloak-db`
- `keycloak`

Keycloak:

- URL: `http://localhost:8080`
- Admin: `admin` / `admin`
- Realm: `pipeline-monitor`
- Client: `pipeline-monitor-web`
- Users: `admin/admin123`, `operator/operator123`, `viewer/viewer123`

## Compose Validation

```powershell
docker compose config
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml config
```

## Migrations

The `backend-migrate` service runs:

```bash
alembic upgrade head
```

The backend starts only after migrations complete successfully.

## Worker And Scheduler

The worker process runs:

```bash
python -m app.workers.worker
```

The scheduler process runs:

```bash
python -m app.scheduler
```

The scheduler should remain a singleton. Worker replicas may be scaled for demonstration:

```powershell
docker compose up --build --scale worker=3
```

## Smoke Test

After the stack is running:

```powershell
python infra/smoke_test.py --api-base http://localhost:8000
```

Through Nginx:

```powershell
python infra/smoke_test.py --api-base http://localhost:8088/api
```

The smoke test requires backend, database, Redis and worker to be healthy.

## Production Gaps

For a production deployment, add:

- HTTPS/TLS
- secret manager
- non-demo credentials
- stricter CORS
- centralized logs and metrics
- stronger scheduler locking
- external alert delivery
