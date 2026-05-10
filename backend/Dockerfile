FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY . .

RUN if [ -f requirements.txt ]; then pip install -r requirements.txt; fi

EXPOSE 8000

CMD ["sh", "-c", "if [ -f app/main.py ]; then uvicorn app.main:app --host 0.0.0.0 --port 8000; else echo 'backend/app/main.py is not implemented yet; Phase 1 container is waiting.'; tail -f /dev/null; fi"]
