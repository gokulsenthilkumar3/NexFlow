# Nexora

> GitHub description: Unified HRMS, workplace operations, asset management, and helpdesk platform for people, places, assets, and support.

Nexora is the combined product replacing the separate NexFlow helpdesk and Office Management / HRMS systems. It is designed to be the single operations workspace and primary system of record for People, Workplace, and Operations teams.

The goal is simple: employees, managers, HR, IT, facilities, finance, and operations should work from one application, one identity model, and one shared PostgreSQL data layer.

## What Is Merged

| Domain | Included capabilities |
| --- | --- |
| People | Employee directory, profiles, onboarding, offboarding, attendance, leave, payroll, payslips, recruitment, careers, training, performance, compliance, and HR reports |
| Workplace | Assets, employee asset assignment, QR scanning, maintenance, facilities, visitors, room booking, desk booking, procurement, vendors, fleet, scanner, security, telemetry, and lifecycle tracking |
| Operations | Existing projects, work items, helpdesk, tickets, knowledge base, notifications, analytics, reports, integrations, and AI insights |
| Governance | Role-based access, audit records, source migration metadata, sync conflict records, and validation reporting |

## Product Structure

```text
apps/
  web-app/                         # Main Nexora Next.js application
  customer-portal/                 # Nexora Workspace portal
  gateway/                         # API gateway routing to domain services
  database/                        # Shared PostgreSQL schema and migrations

services/
  auth-service/                    # Authentication and authorization
  asset-service/                   # Asset inventory and lifecycle management
  helpdesk-service/                # Core ticket and support workflows
  work-item-service/               # Project and task tracking
  workplace-service/               # People, HRMS, facilities, procurement, maintenance, compliance, training, and workplace APIs
  kb-service/                      # Knowledge base
  notification-service/            # Email and real-time alerts
  realtime-service/                # WebSocket events
  reporting-service/               # Reporting and analytics
  ai-orchestrator/                 # AI routing and insights
  integration-service/             # External integrations

packages/
  shared-types/                    # Shared Nexora TypeScript contracts
  ui-kit/                          # Shared UI utilities
  config/                          # Shared configuration

Office Management System/
  Office Management System/        # Legacy HRMS and office-management source kept for migration reference
```

## Current Nexora Screens

- `/dashboard` - unified operations overview
- `/people` - People Operations workspace with directory, attendance, leave, recruitment, and payroll areas
- `/workplace` - Workplace hub for assets, facilities, visitors, procurement, maintenance, scanner, security, and related modules
- `/workplace/[module]` - module workspace pages for workplace domains

The legacy HRMS and Office Management source remains in the repository during transition so business logic, reports, and feature-specific workflows can be migrated safely.

## API Direction

The gateway keeps the existing Nexora service routes and adds merged HRMS / workplace paths:

```text
/api/people
/api/attendance
/api/payroll
/api/recruitment
/api/facilities
/api/procurement
/api/maintenance
/api/compliance
/api/training
/api/performance
/api/workplace
```

The merged service stack should use Clerk bearer tokens in production, map Clerk users to Nexora employee profiles by email, and enforce `ADMIN`, `MANAGER`, and `USER` permissions consistently.

## Database And Migration

The consolidated schema starts with:

- Existing Nexora tables for helpdesk, assets, work items, knowledge base, reporting, and notifications
- New People tables for employees, attendance, leave, payroll, recruitment, training, performance, and compliance
- New Workplace tables for locations, rooms, desks, vendors, procurement, bookings, maintenance, audits, and sync metadata

Migration notes live in [services/workplace-service/MIGRATION.md](services/workplace-service/MIGRATION.md).

No HRMS connection strings, exports, payroll files, or employee data should be committed to this repository. The HRMS PostgreSQL source must be supplied through deployment secrets or an isolated dry-run environment.

## Local Development

Prerequisites:

- Node.js 20+
- Docker Desktop for PostgreSQL, Redis, and local backend services

Start the local stack from the repository root:

```bash
npm install
docker-compose up -d
npm run dev
```

Useful local URLs:

- Nexora Web App: `http://localhost:3000`
- Nexora Workspace Portal: `http://localhost:5173`
- People Operations: `http://localhost:3000/people`
- Workplace Operations: `http://localhost:3000/workplace`

## Verification

Use these checks while developing:

```bash
npm run build
npm run lint
npm run test
```

For the merge specifically, validate:

- People and Workplace screens render in the Next.js app
- Gateway routes forward to the correct domain service
- Database migrations apply cleanly to a restored development database
- HRMS import dry-runs match source record counts before any live sync is enabled
- Dual-sync conflicts are written to `sync_records` with Nexora treated as the authority

## Rollout Status

Nexora is now the product name and target architecture. The repository contains the merged UI direction, shared types, gateway route expansion, workplace service scaffold, and consolidated migration set.

The remaining production steps are to connect the real HRMS PostgreSQL source, run import dry-runs, implement the temporary dual-sync worker, validate feature parity, and then retire the separate HRMS frontend and backend.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit, and pull-request conventions.
