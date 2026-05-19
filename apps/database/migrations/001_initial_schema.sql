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

-- Indexes for performance
CREATE INDEX idx_work_items_project_id ON work_items(project_id);
CREATE INDEX idx_work_items_assigned_to ON work_items(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
