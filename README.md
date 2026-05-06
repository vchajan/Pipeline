# Big Data Pipeline Monitor

MSWA school project.

This application simulates evidence, execution and monitoring of data pipelines over datasets.

Stack:
Backend: Python, FastAPI, SQLAlchemy, SQLite, Pydantic.
Frontend: React, Vite, TypeScript.

Domain model:
Dataset <- Pipeline <- PipelineVersion
JobRun -> Pipeline
JobRunStep -> JobRun
AlertRule -> Pipeline
AlertEvent -> AlertRule
User is optional.

Business rules:
- Pipeline must reference an existing dataset.
- Pipeline can run only when active is true.
- Run transitions: pending to running, running to success, running to failed.
- Alert is created when a run fails or runtime threshold is exceeded.

Run backend:
cd backend
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload

Run frontend:
cd frontend
npm install
npm run dev
