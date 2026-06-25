-- ============================================================
-- PLACEMENT PORTAL - FINAL COMPLETE SETUP (NO ERRORS)
-- FIXED: renamed current_role -> job_role (reserved word fix)
-- HOW TO RUN:
--   1. Go to neon.tech -> your project -> SQL Editor
--   2. Paste ALL of this -> click RUN
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CLEAN SLATE (safe to re-run anytime)
DROP TABLE IF EXISTS announcements     CASCADE;
DROP TABLE IF EXISTS audit_logs        CASCADE;
DROP TABLE IF EXISTS feedbacks         CASCADE;
DROP TABLE IF EXISTS interview_rounds  CASCADE;
DROP TABLE IF EXISTS interviews        CASCADE;
DROP TABLE IF EXISTS time_slots        CASCADE;
DROP TABLE IF EXISTS cabins            CASCADE;
DROP TABLE IF EXISTS interviewers      CASCADE;
DROP TABLE IF EXISTS technologies      CASCADE;
DROP TABLE IF EXISTS admins            CASCADE;
DROP TABLE IF EXISTS students          CASCADE;
DROP TABLE IF EXISTS system_settings   CASCADE;
DROP TABLE IF EXISTS users             CASCADE;
DROP TYPE IF EXISTS announcement_status CASCADE;
DROP TYPE IF EXISTS cabin_status        CASCADE;
DROP TYPE IF EXISTS round_status        CASCADE;
DROP TYPE IF EXISTS round_type          CASCADE;
DROP TYPE IF EXISTS interview_status    CASCADE;
DROP TYPE IF EXISTS user_status         CASCADE;
DROP TYPE IF EXISTS user_role           CASCADE;
DROP FUNCTION IF EXISTS trg_set_updated_at CASCADE;

-- ENUM TYPES
CREATE TYPE user_role AS ENUM (
    'student', 'admin', 'super_admin'
);
CREATE TYPE user_status AS ENUM (
    'active', 'inactive', 'suspended'
);
CREATE TYPE interview_status AS ENUM (
    'pending', 'scheduled', 'in_progress',
    'completed', 'selected', 'rejected', 'cancelled'
);
CREATE TYPE round_type AS ENUM (
    'L1_Technical', 'L2_Technical', 'L3_Technical',
    'Manager', 'Assessment', 'HR'
);
CREATE TYPE round_status AS ENUM (
    'pending', 'scheduled', 'in_progress', 'completed', 'skipped'
);
CREATE TYPE cabin_status AS ENUM (
    'active', 'inactive', 'maintenance'
);
CREATE TYPE announcement_status AS ENUM (
    'active', 'inactive'
);

-- TABLE: users
CREATE TABLE users (
    id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       TEXT         NOT NULL,
    role                user_role    NOT NULL DEFAULT 'student',
    status              user_status  NOT NULL DEFAULT 'active',
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(20),
    profile_picture     TEXT,
    reset_token         TEXT,
    reset_token_expires TIMESTAMP,
    last_login          TIMESTAMP,
    created_at          TIMESTAMP    DEFAULT NOW(),
    updated_at          TIMESTAMP    DEFAULT NOW()
);

-- TABLE: students
-- NOTE: used job_role instead of current_role (reserved word in PostgreSQL)
CREATE TABLE students (
    id                 UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id            UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id         VARCHAR(50)  UNIQUE,
    college            VARCHAR(255),
    degree             VARCHAR(100),
    branch             VARCHAR(100),
    graduation_year    INTEGER,
    cgpa               DECIMAL(4,2),
    skills             TEXT[],
    resume_url         TEXT,
    resume_filename    VARCHAR(255),
    linkedin_url       TEXT,
    github_url         TEXT,
    portfolio_url      TEXT,
    address            TEXT,
    city               VARCHAR(100),
    state              VARCHAR(100),
    pincode            VARCHAR(10),
    date_of_birth      DATE,
    gender             VARCHAR(20),
    experience_months  INTEGER      DEFAULT 0,
    current_company    VARCHAR(255),
    job_role           VARCHAR(255),
    expected_ctc       DECIMAL(12,2),
    notice_period_days INTEGER      DEFAULT 0,
    is_fresher         BOOLEAN      DEFAULT TRUE,
    created_at         TIMESTAMP    DEFAULT NOW(),
    updated_at         TIMESTAMP    DEFAULT NOW()
);

-- TABLE: admins
CREATE TABLE admins (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department  VARCHAR(100),
    designation VARCHAR(100),
    added_by    UUID         REFERENCES users(id),
    created_at  TIMESTAMP    DEFAULT NOW(),
    updated_at  TIMESTAMP    DEFAULT NOW()
);

-- TABLE: system_settings
CREATE TABLE system_settings (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    key         VARCHAR(100) UNIQUE NOT NULL,
    value       TEXT,
    description TEXT,
    updated_by  UUID         REFERENCES users(id),
    updated_at  TIMESTAMP    DEFAULT NOW()
);

-- TABLE: technologies
CREATE TABLE technologies (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url    TEXT,
    is_active   BOOLEAN      DEFAULT TRUE,
    created_by  UUID         REFERENCES users(id),
    created_at  TIMESTAMP    DEFAULT NOW(),
    updated_at  TIMESTAMP    DEFAULT NOW()
);

-- TABLE: interviewers
CREATE TABLE interviewers (
    id                     UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                   VARCHAR(200) NOT NULL,
    email                  VARCHAR(255) UNIQUE NOT NULL,
    phone                  VARCHAR(20),
    technology_id          UUID         REFERENCES technologies(id),
    experience_years       INTEGER,
    designation            VARCHAR(100),
    company                VARCHAR(200),
    linkedin_url           TEXT,
    profile_picture        TEXT,
    bio                    TEXT,
    status                 user_status  DEFAULT 'active',
    max_interviews_per_day INTEGER      DEFAULT 5,
    created_by             UUID         REFERENCES users(id),
    created_at             TIMESTAMP    DEFAULT NOW(),
    updated_at             TIMESTAMP    DEFAULT NOW()
);

-- TABLE: cabins
CREATE TABLE cabins (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    location    VARCHAR(200),
    capacity    INTEGER      DEFAULT 2,
    amenities   TEXT[],
    status      cabin_status DEFAULT 'active',
    description TEXT,
    created_by  UUID         REFERENCES users(id),
    created_at  TIMESTAMP    DEFAULT NOW(),
    updated_at  TIMESTAMP    DEFAULT NOW()
);

-- TABLE: time_slots
CREATE TABLE time_slots (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIME         NOT NULL,
    end_time   TIME         NOT NULL,
    label      VARCHAR(50),
    is_active  BOOLEAN      DEFAULT TRUE,
    created_by UUID         REFERENCES users(id),
    created_at TIMESTAMP    DEFAULT NOW(),
    updated_at TIMESTAMP    DEFAULT NOW(),
    UNIQUE(start_time, end_time)
);

-- TABLE: interviews
CREATE TABLE interviews (
    id                  UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id          UUID             NOT NULL REFERENCES students(id)    ON DELETE CASCADE,
    technology_id       UUID             NOT NULL REFERENCES technologies(id),
    interviewer_id      UUID             NOT NULL REFERENCES interviewers(id),
    cabin_id            UUID             NOT NULL REFERENCES cabins(id),
    time_slot_id        UUID             NOT NULL REFERENCES time_slots(id),
    interview_date      DATE             NOT NULL,
    status              interview_status DEFAULT 'pending',
    current_round       round_type       DEFAULT 'L1_Technical',
    notes               TEXT,
    cancellation_reason TEXT,
    booked_by           UUID             REFERENCES users(id),
    scheduled_by        UUID             REFERENCES users(id),
    created_at          TIMESTAMP        DEFAULT NOW(),
    updated_at          TIMESTAMP        DEFAULT NOW()
);

-- Prevent double booking same cabin + slot + date
CREATE UNIQUE INDEX idx_no_double_booking
    ON interviews(cabin_id, time_slot_id, interview_date)
    WHERE status NOT IN ('cancelled', 'rejected');

-- TABLE: interview_rounds
CREATE TABLE interview_rounds (
    id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id     UUID         NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    round_type       round_type   NOT NULL,
    round_number     INTEGER      NOT NULL,
    status           round_status DEFAULT 'pending',
    interviewer_id   UUID         REFERENCES interviewers(id),
    scheduled_at     TIMESTAMP,
    started_at       TIMESTAMP,
    completed_at     TIMESTAMP,
    duration_minutes INTEGER,
    notes            TEXT,
    created_at       TIMESTAMP    DEFAULT NOW(),
    updated_at       TIMESTAMP    DEFAULT NOW()
);

-- TABLE: feedbacks
CREATE TABLE feedbacks (
    id                  UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_id        UUID    NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    round_id            UUID    REFERENCES interview_rounds(id),
    given_by            UUID    NOT NULL REFERENCES users(id),
    communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 10),
    technical_score     INTEGER CHECK (technical_score     BETWEEN 1 AND 10),
    confidence_score    INTEGER CHECK (confidence_score    BETWEEN 1 AND 10),
    overall_score       DECIMAL(4,2),
    remarks             TEXT,
    strengths           TEXT,
    improvements        TEXT,
    recommendation      VARCHAR(50),
    is_selected         BOOLEAN,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- TABLE: announcements
CREATE TABLE announcements (
    id          UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(255)        NOT NULL,
    content     TEXT                NOT NULL,
    priority    VARCHAR(20)         DEFAULT 'normal',
    target_role user_role,
    status      announcement_status DEFAULT 'active',
    expires_at  TIMESTAMP,
    created_by  UUID                NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP           DEFAULT NOW(),
    updated_at  TIMESTAMP           DEFAULT NOW()
);

-- TABLE: audit_logs
CREATE TABLE audit_logs (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id   UUID,
    description TEXT         NOT NULL,
    metadata    JSONB,
    ip_address  VARCHAR(45),
    user_agent  TEXT,
    created_at  TIMESTAMP    DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_users_email          ON users(email);
CREATE INDEX idx_users_role           ON users(role);
CREATE INDEX idx_students_user        ON students(user_id);
CREATE INDEX idx_interviews_student   ON interviews(student_id);
CREATE INDEX idx_interviews_date      ON interviews(interview_date);
CREATE INDEX idx_interviews_status    ON interviews(status);
CREATE INDEX idx_feedbacks_interview  ON feedbacks(interview_id);
CREATE INDEX idx_audit_user           ON audit_logs(user_id);
CREATE INDEX idx_audit_date           ON audit_logs(created_at);
CREATE INDEX idx_announcements_status ON announcements(status);

-- AUTO-UPDATE TRIGGER
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_students
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_interviews
    BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_technologies
    BEFORE UPDATE ON technologies
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_interviewers
    BEFORE UPDATE ON interviewers
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_cabins
    BEFORE UPDATE ON cabins
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================
-- SEED DATA
-- SuperAdmin@123  /  Admin@123
-- ============================================================

INSERT INTO users (email, password_hash, role, status, first_name, last_name, phone)
VALUES (
    'superadmin@placementportal.com',
    '$2b$12$nQ.mp9nIrGrKyYOhL2mcquEz9oMqFIxRA2Ira6pocd9pRSvgdZqpa',
    'super_admin', 'active', 'Super', 'Admin', '9999999999'
);

INSERT INTO users (email, password_hash, role, status, first_name, last_name, phone)
VALUES (
    'admin@placementportal.com',
    '$2b$12$z0fglmvy731w31XQNl079eI1dA9UUXDUWtKvt4HNOa8Wxu/sNY2D6',
    'admin', 'active', 'Admin', 'User', '8888888888'
);

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

INSERT INTO cabins (name, location, capacity, status) VALUES
    ('Cabin 1', 'Ground Floor, Block A', 2, 'active'),
    ('Cabin 2', 'Ground Floor, Block A', 2, 'active');

INSERT INTO time_slots (start_time, end_time, label, is_active) VALUES
    ('08:00', '08:30', '08:00 AM - 08:30 AM', true),
    ('08:30', '09:00', '08:30 AM - 09:00 AM', true),
    ('09:00', '09:30', '09:00 AM - 09:30 AM', true),
    ('09:30', '10:00', '09:30 AM - 10:00 AM', true),
    ('10:00', '10:30', '10:00 AM - 10:30 AM', true),
    ('10:30', '11:00', '10:30 AM - 11:00 AM', true);

INSERT INTO system_settings (key, value, description) VALUES
    ('portal_name',             'Placement Assistance Portal', 'Name of the portal'),
    ('max_interview_rounds',    '6',                           'Maximum interview rounds'),
    ('allow_self_booking',      'true',                        'Students can book themselves'),
    ('booking_advance_days',    '7',                           'Days in advance students can book'),
    ('session_timeout_minutes', '60',                          'Session timeout in minutes');

INSERT INTO announcements (title, content, priority, status, created_by)
SELECT
    'Welcome to the Placement Portal',
    'The portal is now live! Please complete your profile to get started.',
    'high', 'active', id
FROM users WHERE role = 'admin' LIMIT 1;

INSERT INTO announcements (title, content, priority, status, created_by)
SELECT
    'Interview Schedule for This Week',
    'Interviews for Python and Java are scheduled. Book your slots before they fill up.',
    'normal', 'active', id
FROM users WHERE role = 'admin' LIMIT 1;

-- ============================================================
-- CONFIRM IT WORKED - run this after:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- You should see 12 tables listed.
-- ============================================================
