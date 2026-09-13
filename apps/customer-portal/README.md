# Nexora Workspace Portal

The Nexora Workspace Portal is the Vite + React portal for employee-facing service and operations journeys. It keeps the existing support experience while presenting Nexora as the single product for helpdesk, assets, HRMS, and office operations.

## Current Features

- Submit and track support requests
- Browse the knowledge base
- Open the unified workspace landing route
- Preserve customer-facing ticket journeys during the HRMS and Office Management merge

## Local Development

From the repository root:

```bash
npm run dev --workspace=nexora-workspace
```

Or start the full monorepo:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Product Role

The Next.js app is the primary internal operations surface. This portal remains useful for employee and customer-facing entry points such as request submission, ticket tracking, and knowledge base access.
