# Big Data Pipeline Monitor

Codex-ready repository scaffold for the MSWA project **Big Data Pipeline Monitor**.

This repository starts as a scaffold for Codex. The full technical specification and phase prompts are in:

- `AGENTS.md`
- `docs/PROJECT_BLUEPRINT.md`
- `docs/CODEX_PHASE_PROMPTS.md`

## How to use

1. Unzip this folder.
2. Open the root folder in VS Code.
3. Start Codex extension or Codex CLI in this folder.
4. Ask Codex to read `AGENTS.md`, `docs/PROJECT_BLUEPRINT.md` and `docs/CODEX_PHASE_PROMPTS.md`.
5. Start with Phase 1 only.

Suggested first prompt:

```text
Read AGENTS.md, docs/PROJECT_BLUEPRINT.md and docs/CODEX_PHASE_PROMPTS.md.
Implement only Phase 1: infrastructure skeleton.
Do not implement all business logic yet.
After editing, summarize changed files and commands to test.
```

## Target architecture

- Frontend: React, Vite, TypeScript, React Router, TanStack Query, custom CSS
- Backend: FastAPI, Pydantic, SQLAlchemy, Alembic
- Database: PostgreSQL in Docker, SQLite fallback
- Async jobs: Redis + RQ worker
- Scheduler: standalone singleton service
- Proxy: Nginx
- Auth: Keycloak primary mode, demo auth fallback
- Security: RBAC roles admin/operator/viewer, audit log
- Tests: Pytest, Vitest, Playwright, smoke test
- CI: GitHub Actions

This project is a simulation of data pipeline orchestration and monitoring. It is not a real Spark, Airflow, Kafka or distributed big data platform.
