-- ============================================================
-- PLACEMENT PORTAL - SEED DATA ONLY
-- Run this AFTER FINAL_SETUP.sql has been run successfully
-- ============================================================

-- Clear old seed data first (safe re-run)
DELETE FROM announcements;
DELETE FROM system_settings;
DELETE FROM time_slots;
DELETE FROM cabins;
DELETE FROM technologies;
DELETE FROM admins;
DELETE FROM students;
DELETE FROM users;

-- ============================================================
-- USERS (Super Admin + Admin)
-- SuperAdmin password : SuperAdmin@123
-- Admin password      : Admin@123
-- ============================================================

INSERT INTO users (email, password_hash, role, status, first_name, last_name, phone)
VALUES (
    'superadmin@placementportal.com',
    '$2b$12$wcY7nrAbSxfR08DLVRZLleRhaPNTw1jROLhUFkIN/dNE9CbBpiasm',
    'super_admin', 'active', 'Super', 'Admin', '9999999999'
);

INSERT INTO users (email, password_hash, role, status, first_name, last_name, phone)
VALUES (
    'admin@placementportal.com',
    '$2b$12$ET4w3CUDOro60dtqS38FmucxqEQSOsiZTQSZk5RTwxN3cXU.DsQoy',
    'admin', 'active', 'Admin', 'User', '8888888888'
);

-- ============================================================
-- TECHNOLOGIES (12 tech stacks)
-- ============================================================

INSERT INTO technologies (name, description, is_active) VALUES
    ('Python',           'Python programming language',          true),
    ('Java',             'Java programming language',            true),
    ('Selenium',         'Web automation testing framework',     true),
    ('Playwright',       'Modern web testing framework',         true),
    ('AWS',              'Amazon Web Services cloud platform',   true),
    ('Azure',            'Microsoft Azure cloud platform',       true),
    ('DevOps',           'Development and operations practices', true),
    ('Data Engineering', 'Data pipeline and ETL processes',      true),
    ('Testing',          'Software quality assurance',           true),
    ('React',            'JavaScript UI library',                true),
    ('Node.js',          'JavaScript runtime environment',       true),
    ('Data Science',     'Data analysis and machine learning',   true);

-- ============================================================
-- CABINS (2 interview rooms)
-- ============================================================

INSERT INTO cabins (name, location, capacity, status) VALUES
    ('Cabin 1', 'Ground Floor, Block A', 2, 'active'),
    ('Cabin 2', 'Ground Floor, Block A', 2, 'active');

-- ============================================================
-- TIME SLOTS (6 slots - 8am to 11am)
-- ============================================================

INSERT INTO time_slots (start_time, end_time, label, is_active) VALUES
    ('08:00', '08:30', '08:00 AM - 08:30 AM', true),
    ('08:30', '09:00', '08:30 AM - 09:00 AM', true),
    ('09:00', '09:30', '09:00 AM - 09:30 AM', true),
    ('09:30', '10:00', '09:30 AM - 10:00 AM', true),
    ('10:00', '10:30', '10:00 AM - 10:30 AM', true),
    ('10:30', '11:00', '10:30 AM - 11:00 AM', true);

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (key, value, description) VALUES
    ('portal_name',             'Placement Assistance Portal', 'Name of the portal'),
    ('max_interview_rounds',    '6',                           'Maximum interview rounds'),
    ('allow_self_booking',      'true',                        'Students can self book'),
    ('booking_advance_days',    '7',                           'Days in advance to book'),
    ('session_timeout_minutes', '60',                          'Session timeout in minutes');

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

INSERT INTO announcements (title, content, priority, status, created_by)
SELECT
    'Welcome to the Placement Portal',
    'The portal is now live! Please complete your profile to get started with interview booking.',
    'high',
    'active',
    id
FROM users WHERE role = 'admin' LIMIT 1;

INSERT INTO announcements (title, content, priority, status, created_by)
SELECT
    'Interview Schedule for This Week',
    'Interviews for Python and Java are scheduled this week. Book your slots before they fill up.',
    'normal',
    'active',
    id
FROM users WHERE role = 'admin' LIMIT 1;

-- ============================================================
-- VERIFY - run this after to confirm:
-- SELECT 'users' as tbl, COUNT(*) FROM users
-- UNION ALL SELECT 'technologies', COUNT(*) FROM technologies
-- UNION ALL SELECT 'cabins', COUNT(*) FROM cabins
-- UNION ALL SELECT 'time_slots', COUNT(*) FROM time_slots
-- UNION ALL SELECT 'system_settings', COUNT(*) FROM system_settings
-- UNION ALL SELECT 'announcements', COUNT(*) FROM announcements;
-- ============================================================
