# Nexora Web App

This is the main Next.js application for Nexora. It hosts the unified internal experience for People, Workplace, and Operations modules.

## Key Areas

- Dashboard overview at `/dashboard`
- People Operations at `/people`
- Workplace Operations at `/workplace`
- Module workspaces at `/workplace/[module]`

People Operations brings HRMS workflows into Nexora: employee directory, attendance, leave, recruitment, payroll, onboarding, training, performance, and compliance.

Workplace Operations brings office-management workflows into Nexora: assets, facilities, visitors, room and desk booking, procurement, maintenance, scanner, security, fleet, telemetry, and audit history.

## Local Development

From the repository root:

```bash
npm run dev --workspace=web-app
```

Or start the whole stack:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Auth Direction

Production Nexora should use Clerk authentication. Clerk users are mapped to Nexora employee profiles by email and authorized through `ADMIN`, `MANAGER`, and `USER` roles.

Local mock auth may remain only for isolated development until Clerk keys and environment configuration are supplied.
