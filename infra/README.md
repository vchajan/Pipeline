# Infrastructure

This folder contains local infrastructure helpers for the Big Data Pipeline Monitor.

## Docker Compose Modes

Default stack:

```powershell
docker compose up --build
```

Services:

- `postgres`
- `redis`
- `backend-migrate`
- `backend`
- `worker`
- `scheduler`
- `frontend`
- `nginx`

Keycloak stack:

```powershell
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml up --build
```

Adds:

- `keycloak-db`
- `keycloak`

## Keycloak

The Keycloak override imports `infra/keycloak/pipeline-monitor-realm.json` when the Keycloak container starts.

Keycloak imports realms only into a fresh database. If you already started Keycloak before changing the realm file, remove the Keycloak volume first:

```powershell
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml down -v
```

Start with helper scripts:

```powershell
.\infra\keycloak\start-keycloak-mode.ps1
```

```bash
./infra/keycloak/start-keycloak-mode.sh
```

Keycloak admin console:

- URL: `http://localhost:8080`
- Admin user: `admin`
- Admin password: `admin`

Application realm:

- Realm: `pipeline-monitor`
- Client: `pipeline-monitor-web`
- Roles: `admin`, `operator`, `viewer`

Demo realm users:

- `admin` / `admin123`
- `operator` / `operator123`
- `viewer` / `viewer123`

Export the current realm back to the tracked JSON file:

```powershell
.\infra\keycloak\export-realm.ps1
```

```bash
./infra/keycloak/export-realm.sh
```

## Operational Notes

- Nginx is the recommended local entry point at `http://localhost:8088`.
- The backend is also published at `http://localhost:8000`.
- Redis and PostgreSQL are published for local debugging.
- The scheduler is intended to run as a singleton service.
- Worker services can be scaled, but the scheduler should not be scaled.

## Smoke Test

After the default stack is running, execute:

```powershell
python infra/smoke_test.py --api-base http://localhost:8000
```

Or test through Nginx:

```powershell
python infra/smoke_test.py --api-base http://localhost:8088/api
```

The smoke test checks health/readiness, creates a dataset, pipeline, active failing version and alert rule, starts a run, waits for worker completion and verifies the resulting alert.
