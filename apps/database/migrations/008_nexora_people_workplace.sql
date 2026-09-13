-- Nexora people and workplace domains.  Existing NexFlow project, ticket and asset tables remain unchanged.
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), clerk_user_id TEXT UNIQUE, source_hrms_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, employee_code TEXT UNIQUE,
  department TEXT, designation TEXT, manager_id UUID REFERENCES employees(id), role TEXT NOT NULL DEFAULT 'USER'
    CHECK (role IN ('ADMIN','MANAGER','USER')), employment_type TEXT DEFAULT 'FULL_TIME',
  hire_date DATE, is_active BOOLEAN NOT NULL DEFAULT TRUE, source_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), employee_id UUID NOT NULL REFERENCES employees(id),
  work_date DATE NOT NULL, clock_in TIMESTAMPTZ, clock_out TIMESTAMPTZ, status TEXT NOT NULL DEFAULT 'PRESENT', notes TEXT,
  UNIQUE(employee_id, work_date)
);
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), employee_id UUID NOT NULL REFERENCES employees(id), leave_type TEXT NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL, reason TEXT, status TEXT NOT NULL DEFAULT 'PENDING', reviewed_by UUID REFERENCES employees(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE payroll_runs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), period TEXT UNIQUE NOT NULL, status TEXT NOT NULL DEFAULT 'DRAFT', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE payslips (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), employee_id UUID NOT NULL REFERENCES employees(id), payroll_run_id UUID REFERENCES payroll_runs(id), basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0, allowances NUMERIC(12,2) NOT NULL DEFAULT 0, deductions NUMERIC(12,2) NOT NULL DEFAULT 0, net_amount NUMERIC(12,2) NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'DRAFT');
CREATE TABLE job_postings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, department TEXT, location TEXT, employment_type TEXT DEFAULT 'FULL_TIME', description TEXT, status TEXT NOT NULL DEFAULT 'OPEN', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE applicants (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, stage TEXT NOT NULL DEFAULT 'SCREENING', notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE training_courses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, description TEXT, category TEXT, duration_hours INTEGER NOT NULL DEFAULT 1);
CREATE TABLE course_enrollments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), course_id UUID NOT NULL REFERENCES training_courses(id), employee_id UUID NOT NULL REFERENCES employees(id), status TEXT NOT NULL DEFAULT 'ENROLLED', progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100), UNIQUE(course_id, employee_id));
CREATE TABLE performance_goals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), employee_id UUID NOT NULL REFERENCES employees(id), title TEXT NOT NULL, description TEXT, target_date DATE, progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100), status TEXT NOT NULL DEFAULT 'IN_PROGRESS');
CREATE TABLE locations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, address TEXT);
CREATE TABLE meeting_rooms (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), location_id UUID REFERENCES locations(id), name TEXT UNIQUE NOT NULL, capacity INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'AVAILABLE');
CREATE TABLE room_bookings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id UUID NOT NULL REFERENCES meeting_rooms(id), employee_id UUID NOT NULL REFERENCES employees(id), start_time TIMESTAMPTZ NOT NULL, end_time TIMESTAMPTZ NOT NULL, purpose TEXT);
CREATE TABLE desks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), location_id UUID REFERENCES locations(id), label TEXT UNIQUE NOT NULL, is_hot_desk BOOLEAN NOT NULL DEFAULT TRUE, status TEXT NOT NULL DEFAULT 'AVAILABLE');
CREATE TABLE desk_bookings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), desk_id UUID NOT NULL REFERENCES desks(id), employee_id UUID NOT NULL REFERENCES employees(id), booking_date DATE NOT NULL, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ);
CREATE TABLE vendors (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, contact_email TEXT, contact_phone TEXT);
CREATE TABLE purchase_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), requested_by UUID REFERENCES employees(id), vendor_id UUID REFERENCES vendors(id), title TEXT NOT NULL, description TEXT, expected_cost NUMERIC(12,2), status TEXT NOT NULL DEFAULT 'PENDING', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE maintenance_records (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), asset_id UUID REFERENCES assets(id), issue_type TEXT NOT NULL, description TEXT, priority TEXT NOT NULL DEFAULT 'MEDIUM', status TEXT NOT NULL DEFAULT 'OPEN', scheduled_date TIMESTAMPTZ, completed_at TIMESTAMPTZ, technician_notes TEXT);
CREATE TABLE compliance_audits (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), audit_type TEXT NOT NULL, target_id TEXT, conducted_by UUID REFERENCES employees(id), findings TEXT, status TEXT NOT NULL DEFAULT 'SCHEDULED', audit_date DATE);
CREATE TABLE sync_records (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), entity_type TEXT NOT NULL, nexora_id UUID, source_hrms_id TEXT NOT NULL, source_updated_at TIMESTAMPTZ, nexora_updated_at TIMESTAMPTZ, sync_status TEXT NOT NULL DEFAULT 'PENDING', conflict_payload JSONB, UNIQUE(entity_type, source_hrms_id));
CREATE INDEX idx_employees_department ON employees(department); CREATE INDEX idx_attendance_employee_date ON attendance_logs(employee_id, work_date); CREATE INDEX idx_sync_status ON sync_records(sync_status);
