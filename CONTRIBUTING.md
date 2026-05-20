# Contributing to NexFlow

Thank you for taking the time to contribute! This guide covers everything you need to get started.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Running Tests](#running-tests)
- [Code Style](#code-style)

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20 LTS |
| npm | 10 |
| Docker Desktop | latest |
| Python | 3.12 |
| uv (Python PM) | 0.4+ |

---

## Local Development Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/nexflow.git
cd nexflow
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in the required values — at minimum you need:
- `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from [Clerk Dashboard](https://dashboard.clerk.com))
- `OPENAI_API_KEY` (from [OpenAI Platform](https://platform.openai.com/api-keys)) — optional, can stub

### 3. Start infrastructure (Postgres + Redis)

```bash
docker-compose up -d nexflow-db nexflow-cache
```

### 4. Run Prisma migrations

```bash
# Auth service
cd services/auth-service
npx prisma migrate dev --name init
cd ../..

# Work-item service
cd services/work-item-service
npx prisma migrate dev --name init
cd ../..

# Helpdesk service
cd services/helpdesk-service
npx prisma migrate dev --name init
cd ../..
```

### 5. Start all services (development)

```bash
# Start everything via Turborepo
npm run dev

# Or start individual services:
cd services/auth-service && npm run start:dev
cd services/work-item-service && npm run start:dev
cd services/helpdesk-service && npm run start:dev
cd apps/web-app && npm run dev

# AI Orchestrator (Python):
cd services/ai-orchestrator
uv sync
uv run uvicorn src.main:app --reload --port 8000
```

### 6. Open the app

Navigate to [http://localhost:3000](http://localhost:3000). Sign in with Clerk.

---

## Project Structure

```
nexflow/
├── apps/
│   ├── web-app/          # Next.js frontend (port 3000)
│   ├── gateway/          # Nginx config (port 8080)
│   └── database/         # SQL migrations & seed data
├── services/
│   ├── auth-service/     # NestJS — Clerk auth + RBAC (port 3001)
│   ├── work-item-service/# NestJS — Projects & work items (port 3002)
│   ├── helpdesk-service/ # NestJS — Tickets + BullMQ SLA (port 3003)
│   ├── notification-service/ # NestJS — Email notifications (port 3004)
│   ├── integration-service/  # NestJS — GitHub webhooks (port 3005)
│   ├── realtime-service/ # NestJS — Socket.IO gateway (port 4000)
│   └── ai-orchestrator/  # FastAPI — GPT-4o-mini triage (port 8000)
└── packages/
    ├── shared-types/     # Shared TypeScript interfaces & guards
    ├── ui-kit/           # Shared React components
    └── config/           # Shared ESLint, Prettier, TSConfig
```

---

## Branch Naming

Follow this convention:

```
<type>/<short-description>

Examples:
feat/kanban-drag-drop
fix/sla-countdown-timer
chore/update-deps
docs/contributing-guide
test/sla-service-unit
```

Valid types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`

---

## Commit Messages

We use **[Conventional Commits](https://www.conventionalcommits.org/)**.

```
<type>(<scope>): <short description>

Examples:
feat(helpdesk): add SLA dashboard page
fix(auth): handle missing Clerk token gracefully
test(work-item): add status transition unit tests
chore(ci): add GitHub Actions workflow
docs: update contributing guide
```

Rules:
- Use present tense ("add feature" not "added feature")
- Keep subject line under 72 characters
- Reference issues in the body: `Closes #42`

---

## Pull Request Process

1. **Fork** the repo (external contributors) or create a **branch** (maintainers)
2. Make your changes following the code style guide
3. **Write tests** for any new functionality
4. **Run the full test suite** locally (`npm run test`)
5. **Run lint** (`npm run lint`)
6. Create a PR against `main` or `develop`
7. Fill in the PR template — describe what changed and why
8. Request review from at least one maintainer
9. All CI checks must pass before merging

---

## Running Tests

```bash
# Run all tests (Turborepo)
npm run test

# Run a specific service
cd services/helpdesk-service && npm test

# Run with coverage
cd services/work-item-service && npm run test:cov

# Run e2e tests
cd services/auth-service && npm run test:e2e

# Python (AI Orchestrator)
cd services/ai-orchestrator
uv run pytest tests/ -v
```

---

## Code Style

- **TypeScript**: Enforced by ESLint + Prettier (see `packages/config/`)
- **Python**: Formatted with `ruff` (configured in `pyproject.toml`)
- **Imports**: Absolute paths preferred in NestJS services, `@/` alias in Next.js
- **No `any`**: Avoid TypeScript `any` — use proper types or generics
- **No hardcoded values**: All config comes from environment variables via `ConfigService`

### Running the formatter

```bash
# Format all workspaces
npx turbo run format

# Format specific service
cd services/auth-service && npm run format
```
