# Infrastructure

This folder contains local infrastructure helpers for the Big Data Pipeline Monitor.

## Keycloak

The Keycloak override imports `infra/keycloak/pipeline-monitor-realm.json` when the Keycloak container starts.
Keycloak imports realms only into a fresh database; if you already started Keycloak before adding or changing this file, remove the Keycloak volume first with:

```bash
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml down -v
```

Start the stack with Keycloak:

```bash
docker compose -f docker-compose.yml -f docker-compose.keycloak.yml up --build
```

Or use the helper scripts:

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

Demo users:
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
