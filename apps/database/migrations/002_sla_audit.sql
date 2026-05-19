-- SLA Audit Logs Table
CREATE TYPE sla_event_type AS ENUM ('RESPONSE_DUE', 'RESOLVE_DUE', 'BREACH');

CREATE TABLE sla_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    event_type sla_event_type NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified_agent_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sla_logs_ticket_id ON sla_logs(ticket_id);
