-- Seed data
INSERT INTO projects (id, name, key, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Platform Engineering', 'PLAT', 'Core infrastructure and platform services.'),
('22222222-2222-2222-2222-222222222222', 'Customer Portal', 'PORTAL', 'Customer facing web application.');

INSERT INTO work_items (id, project_id, title, description, item_type, item_status, priority) VALUES
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Setup CI/CD Pipeline', 'Implement GitHub Actions', 'Epic', 'New', 1),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Configure GitHub Runners', 'Self-hosted runners', 'Story', 'Approved', 2),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Dockerize Auth Service', 'Dockerfile for auth', 'Task', 'Committed', 2),
('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Fix Runner OOM', 'Runner runs out of memory', 'Bug', 'New', 1),
('33333333-3333-3333-3333-333333333335', '22222222-2222-2222-2222-222222222222', 'Build Checkout Flow', 'Stripe integration', 'Epic', 'New', 2),
('33333333-3333-3333-3333-333333333336', '22222222-2222-2222-2222-222222222222', 'Stripe Webhooks', 'Handle payment events', 'Story', 'New', 2),
('33333333-3333-3333-3333-333333333337', '22222222-2222-2222-2222-222222222222', 'Add Payment Method UI', 'React component', 'Task', 'Done', 3),
('33333333-3333-3333-3333-333333333338', '22222222-2222-2222-2222-222222222222', 'Payment failure page', 'Show error to user', 'Task', 'New', 3),
('33333333-3333-3333-3333-333333333339', '22222222-2222-2222-2222-222222222222', 'Double charge bug', 'User charged twice on fast click', 'Bug', 'New', 1),
('33333333-3333-3333-3333-333333333340', '22222222-2222-2222-2222-222222222222', 'Update React to 18', 'Dependency update', 'Task', 'Done', 4);

-- Tickets
INSERT INTO tickets (id, subject, description, contact_email, priority, status) VALUES
('44444444-4444-4444-4444-444444444441', 'Cannot access portal', 'Getting 403 error', 'user@example.com', 'High', 'Open'),
('44444444-4444-4444-4444-444444444442', 'Database down', 'Connections dropping', 'ops@example.com', 'Critical', 'In Progress'),
('44444444-4444-4444-4444-444444444443', 'Feature request: dark mode', 'Please add dark mode', 'user2@example.com', 'Low', 'Open'),
('44444444-4444-4444-4444-444444444444', 'Billing issue', 'I was charged twice', 'angry@example.com', 'High', 'Open'),
('44444444-4444-4444-4444-444444444445', 'Typo on homepage', 'Spelling mistake in header', 'helpful@example.com', 'Low', 'Resolved');

-- Assets
INSERT INTO assets (id, serial_number, category, status) VALUES
('55555555-5555-5555-5555-555555555551', 'MBP-2023-001', 'Laptop', 'AVAILABLE'),
('55555555-5555-5555-5555-555555555552', 'MON-DELL-002', 'Monitor', 'AVAILABLE'),
('55555555-5555-5555-5555-555555555553', 'PHONE-IP-003', 'Mobile', 'MAINTENANCE');
