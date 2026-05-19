-- User Roles Table
CREATE TYPE rbac_role AS ENUM ('SUPER_ADMIN', 'PROJECT_ADMIN', 'AGENT', 'VIEWER');

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Clerk User ID
    project_id UUID REFERENCES projects(id), -- Nullable if SUPER_ADMIN globally
    role rbac_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
