FROM node:22-alpine

WORKDIR /app

COPY . .

RUN if [ -f package-lock.json ]; then npm ci; elif [ -f package.json ]; then npm install; fi

EXPOSE 5173

CMD ["sh", "-c", "if [ -f package.json ]; then npm run dev -- --host 0.0.0.0 --port 5173; else echo 'frontend/package.json is not implemented yet; Phase 1 container is waiting.'; tail -f /dev/null; fi"]
