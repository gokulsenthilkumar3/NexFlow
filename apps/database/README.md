# Nexora Database

This directory contains the shared PostgreSQL schema and migration scripts for the Nexora platform.

Nexora uses one database model for the merged product so People, Workplace, assets, helpdesk, reporting, notifications, and operations workflows can reference the same records.

## Responsibilities

- Preserve existing Nexora tables for helpdesk, assets, work items, reporting, notifications, and knowledge base data
- Add HRMS tables for employees, attendance, leave, payroll, recruitment, training, performance, and compliance
- Add workplace tables for locations, rooms, desks, vendors, procurement, bookings, maintenance, audits, and sync metadata
- Keep imported HRMS records traceable through source IDs, validation output, audit entries, and sync records

## Key Migration

```text
migrations/008_nexora_people_workplace.sql
```

This migration adds the first consolidated People and Workplace schema for the Nexora merge.

## Data Safety

Do not commit HRMS exports, production connection strings, payroll files, or employee personal data.

Run HRMS imports only against a restored dry-run database first. Compare source and target counts before enabling any temporary dual-sync worker.
