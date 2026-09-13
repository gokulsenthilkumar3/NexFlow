# Nexora API Gateway

The API Gateway is the central entry point for Nexora frontend requests. It routes traffic to the existing operations services and the merged HRMS / Workplace service.

## Route Groups

- Auth and identity
- Helpdesk and ticketing
- Assets and lifecycle management
- Work items and projects
- Knowledge base
- Notifications and realtime events
- Reporting and analytics
- People, attendance, payroll, recruitment, training, performance, compliance, facilities, procurement, maintenance, and workplace APIs

## Merged HRMS Routes

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

These routes are intended to use Clerk bearer tokens in production and shared role-based authorization across `ADMIN`, `MANAGER`, and `USER`.

## Local Development

Start the full stack from the repository root:

```bash
npm run dev
```
