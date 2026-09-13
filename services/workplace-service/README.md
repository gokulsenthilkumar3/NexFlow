# Nexora Workplace Service

The Workplace Service is the merged domain service for HRMS and Office Management capabilities that now belong inside Nexora.

## Domains

- People and employee profiles
- Attendance and leave
- Payroll and payslips
- Recruitment and careers
- Training and performance
- Facilities and locations
- Room and desk booking
- Procurement and vendors
- Maintenance and asset service records
- Compliance audits
- Workplace analytics and sync metadata

## Gateway Routes

The API gateway exposes this service through:

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

## Migration

The shared database migration is:

```text
apps/database/migrations/008_nexora_people_workplace.sql
```

See [MIGRATION.md](MIGRATION.md) for the HRMS import and temporary dual-sync rollout notes.

## Local Development

From the repository root:

```bash
npm run dev --workspace=workplace-service
```

Or start the complete stack:

```bash
npm run dev
```

The Docker Compose stack runs this service on port `3009`.
