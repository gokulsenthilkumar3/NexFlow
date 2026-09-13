# HRMS to Nexora migration

The shared Nexora migration is [`apps/database/migrations/008_nexora_people_workplace.sql`](../../apps/database/migrations/008_nexora_people_workplace.sql).

## Safe rollout

1. Restore a copy of the HRMS PostgreSQL database to an isolated environment.
2. Apply Nexora migrations, then run an idempotent importer against the restored copy.
3. Compare source and target counts for employees, assets, assignments, attendance, leave, payroll, jobs, applicants, rooms, bookings, vendors, purchases, maintenance, and audits.
4. Configure the dual-sync worker with the HRMS connection string and a least-privilege database user.
5. Route new writes through Nexora. HRMS updates are accepted only when they do not supersede a newer Nexora update; conflicts are recorded in `sync_records`.

No connection strings, exports, or HR data belong in this repository. Supply them through the deployment secret store when the dry-run environment is ready.
