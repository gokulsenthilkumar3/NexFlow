# NexFlow Implementation Phase: Scaffolding & Core Services

Following the architecture blueprint, we will now initialize the project structure and define the core domain services.

## 1. Unified Dashboard Vision

To ground our development, here is the architectural vision for the "Unified Workspace". It merges the DevOps Kanban flow with the real-time Ticket Queue.

![Unified Dashboard Mockup](C:\Users\gokul\.gemini\antigravity\brain\06ae5be9-2064-4902-bfe4-9caf4450d1c8\unified_dashboard_mockup_1777998630940.png)

## 2. Project Structure (Monorepo Approach)

We recommend a monorepo using **Nx** or **Turborepo** to share types, design systems, and utility functions across the frontend and microservices.

```text
/unified-platform
├── apps/
│   ├── web-app/            # Next.js (Admin/Agent Dashboard)
│   ├── customer-portal/    # React/Vite (Public Ticketing)
│   └── mobile-app/         # React Native (Future)
├── services/
│   ├── auth-service/       # Node.js/NestJS
│   ├── work-item-service/  # Node.js/NestJS (Core Domain)
│   ├── helpdesk-service/   # Node.js/NestJS (Core Domain)
│   ├── ai-orchestrator/    # Python/FastAPI (LLM handling)
│   └── integration-svc/    # Go (High-throughput webhooks)
├── packages/
│   ├── ui-kit/             # Shared CSS/React Components
│   ├── shared-types/       # Common TypeScript Interfaces
│   └── config/             # ESLint, Prettier, TSConfig
└── docker-compose.yml      # Local dev environment (Postgres, Kafka, Redis)
```

---

## 2. Core Service Scaffolding (Work Item Service)

The **Work Item Service** is the backbone of the DevOps functionality. Below is the refined entity model and internal logic.

### Refined Entity Model (TypeScript)
```typescript
// packages/shared-types/src/work-item.ts
export enum WorkItemType {
  EPIC = 'EPIC',
  STORY = 'STORY',
  TASK = 'TASK',
  BUG = 'BUG'
}

export enum WorkItemStatus {
  NEW = 'NEW',
  APPROVED = 'APPROVED',
  COMMITTED = 'COMMITTED',
  DONE = 'DONE',
  REMOVED = 'REMOVED'
}

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority: number; // 1-4
  projectId: string;
  parentItemId?: string;
  assignedTo?: string;
  tags: string[];
  metadata: {
    githubPrUrl?: string;
    linkedTicketId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. SLA Engine Logic (Helpdesk Service)

The **SLA (Service Level Agreement)** engine is what differentiates a premium helpdesk. It must run as a background worker monitoring ticket ages.

### SLA Logic Flow
1. **Ticket Ingestion**: On creation, the service calculates `response_deadline` and `resolution_deadline` based on priority and customer tier.
2. **Monitoring**: A worker (e.g., BullMQ or Celery) checks for tickets approaching deadlines.
3. **Escalation**:
   - **T-minus 2 hours**: Send notification to Assigned Agent.
   - **T-minus 15 mins**: Notify Team Lead.
   - **Breach**: Re-assign to "Urgent" queue and log CSAT risk.

---

## 4. Advanced Innovation: Deploy-to-Incident Correlation

NexFlow's signature feature is the ability to automatically link a failing deployment to customer support tickets.

### Correlation Logic
- **Trigger**: A CI/CD pipeline fails or health metrics drop in **TimescaleDB**.
- **Action**: The **AI Orchestrator** searches for open tickets with related keywords (e.g., "login", "checkout").
- **Output**: Automatically creates a "Linked Incident" in the Support Portal, estimates the "Blast Radius", and suggests a rollback.

---

## 5. Database Initialization (NexFlow Schema)

I'll create the `init.sql` for the core domains to get the data layer ready.

-- Incidents Table (NexFlow Specialization)
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    severity VARCHAR(10),
    pipeline_run_id UUID, -- Link to the failing deploy
    blast_radius_estimate JSONB,
    ai_resolution_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```sql
-- apps/database/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL, -- e.g., 'PLAT' for Platform project
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Items (Azure DevOps style)
CREATE TABLE work_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    title TEXT NOT NULL,
    description TEXT,
    item_type VARCHAR(20) CHECK (item_type IN ('Epic', 'Story', 'Task', 'Bug')),
    item_status VARCHAR(20) DEFAULT 'New',
    priority INTEGER DEFAULT 3, -- 1: Highest, 4: Lowest
    parent_id UUID REFERENCES work_items(id),
    assigned_to UUID,
    github_metadata JSONB, -- Stores PR links, commit hashes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpdesk Tickets (Zoho style)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    description TEXT,
    contact_email TEXT NOT NULL,
    priority VARCHAR(10) DEFAULT 'Medium',
    status VARCHAR(20) DEFAULT 'Open',
    assigned_agent_id UUID,
    linked_work_item_id UUID REFERENCES work_items(id), -- The crucial bridge
    sla_response_at TIMESTAMP WITH TIME ZONE,
    sla_resolve_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. Next Steps

1. **Frontend Prototype**: Create a high-fidelity dashboard layout in Next.js.
2. **Auth Integration**: Set up Clerk or Auth0 for multi-tenant authentication.
3. **Event Bus Setup**: Deploy a local Kafka instance for cross-service events.

Would you like me to generate a **UI Mockup** for the Unified Dashboard or proceed with the **Service Implementation** (backend code)?
