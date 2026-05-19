-- Asset Assignments Table
CREATE TYPE asset_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED');

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    assigned_to_user_id UUID,
    assigned_at TIMESTAMP WITH TIME ZONE,
    status asset_status DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assets_assigned_to_user_id ON assets(assigned_to_user_id);
