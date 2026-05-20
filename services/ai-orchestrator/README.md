# AI Orchestrator — `services/ai-orchestrator`

FastAPI microservice that provides AI-powered triage and ticket summarisation for NexFlow.

## Architecture

```
work-item-service  ──XADD──►  events:triage  ──XREADGROUP──►  triage_worker
                                                                     │
                                                              (GPT-4o-mini)
                                                                     │
                                                              events:updates  ──XREADGROUP──►  work-item-service
                                                                                              (patches work items)

web-app / helpdesk-service  ──POST──►  /ai/summarize-ticket  ──►  GPT-4o-mini
web-app / work-item-service ──POST──►  /ai/triage-work-item  ──►  GPT-4o-mini
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check — Redis ping + OpenAI key presence |
| `POST` | `/ai/triage-work-item` | Synchronous LLM triage (category, priority, effort, labels) |
| `POST` | `/ai/summarize-ticket` | Ticket summary + sentiment + suggested resolution |

## Environment Variables

Copy `.env.example` to `.env` and populate all values.

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | Your OpenAI secret key |
| `AI_MODEL` | No | LLM model name (default: `gpt-4o-mini`) |
| `AI_MAX_TOKENS` | No | Max output tokens (default: `512`) |
| `AI_TEMPERATURE` | No | Generation temperature (default: `0.3`) |
| `REDIS_HOST` | No | Redis hostname (default: `localhost`) |
| `REDIS_PORT` | No | Redis port (default: `6379`) |
| `REDIS_PASSWORD` | No | Redis password if required |
| `TRIAGE_STREAM` | No | Input stream name (default: `events:triage`) |
| `TRIAGE_CONSUMER_GROUP` | No | Consumer group (default: `ai-orchestrator-group`) |
| `UPDATES_STREAM` | No | Output stream name (default: `events:updates`) |
| `PORT` | No | FastAPI port (default: `8000`) |

## Local Development

### Prerequisites
- Python 3.9+
- `uv` or `pip`
- Redis running locally or via Docker Compose

### Install & Run

```bash
# From services/ai-orchestrator
pip install -e ".[dev]"

# Or with uv
uv pip install -e .

# Start the server
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker Compose (recommended)

```bash
# From monorepo root
docker-compose up nexflow-cache
```

Then start the service with the env file:

```bash
uvicorn src.main:app --env-file .env --reload
```

### Interactive Docs

Visit [http://localhost:8000/docs](http://localhost:8000/docs) for the Swagger UI.

## Streams Reference

| Stream | Direction | Published by | Consumed by |
|--------|-----------|--------------|-------------|
| `events:triage` | Input | work-item-service | ai-orchestrator (triage_worker) |
| `events:updates` | Output | ai-orchestrator | work-item-service (AiUpdatesWorker) |
| `events:breach` | Output | ai-orchestrator | Future: notification dashboard |
