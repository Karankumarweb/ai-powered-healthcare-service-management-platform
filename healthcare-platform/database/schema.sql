-- ==============================================================================
-- AI-Powered Healthcare Service Management Platform
-- PostgreSQL 16 Relational Schema Script
-- Strategy: Schema-per-Service inside a dedicated PostgreSQL database
-- ==============================================================================

-- Create isolated schemas per microservice for clear data ownership
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS patient_schema;
CREATE SCHEMA IF NOT EXISTS doctor_schema;
CREATE SCHEMA IF NOT EXISTS appointment_schema;
CREATE SCHEMA IF NOT EXISTS notification_schema;

-- Shared trigger function to automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. AUTH SERVICE SCHEMA (auth_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS auth_schema.roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role_name CHECK (name IN ('ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT'))
);

CREATE TABLE IF NOT EXISTS auth_schema.users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    locked        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-Many join table between Users and Roles
CREATE TABLE IF NOT EXISTS auth_schema.user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES auth_schema.roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS auth_schema.refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON auth_schema.users(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON auth_schema.refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON auth_schema.refresh_tokens(user_id);

-- ==============================================================================
-- 2. PATIENT SERVICE SCHEMA (patient_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS patient_schema.patients (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE, -- Logical 1:1 reference to auth_schema.users(id)
    first_name          VARCHAR(80) NOT NULL,
    last_name           VARCHAR(80) NOT NULL,
    date_of_birth       DATE NOT NULL,
    gender              VARCHAR(20) NOT NULL,
    phone               VARCHAR(30) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    address             VARCHAR(255),
    blood_group         VARCHAR(10),
    emergency_contact   VARCHAR(120),
    insurance_provider  VARCHAR(120),
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_patient_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'))
);

-- Service Requests submitted by Patients (summarized safely by AI Assistant Service)
CREATE TABLE IF NOT EXISTS patient_schema.service_requests (
    id              BIGSERIAL PRIMARY KEY,
    patient_id      BIGINT NOT NULL,
    category        VARCHAR(60) NOT NULL,
    subject         VARCHAR(160) NOT NULL,
    description     TEXT NOT NULL,
    ai_summary      TEXT,
    priority        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status          VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    assigned_to     BIGINT, -- Optional staff/doctor user_id
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_request_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patients(id) ON DELETE CASCADE,
    CONSTRAINT chk_sr_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_sr_status CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patient_schema.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_last_name ON patient_schema.patients(last_name);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patient_schema.patients(email);
CREATE INDEX IF NOT EXISTS idx_service_requests_patient_id ON patient_schema.service_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON patient_schema.service_requests(status);

-- ==============================================================================
-- 3. DOCTOR SERVICE SCHEMA (doctor_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS doctor_schema.doctors (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE, -- Logical 1:1 reference to auth_schema.users(id)
    first_name          VARCHAR(80) NOT NULL,
    last_name           VARCHAR(80) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    phone               VARCHAR(30) NOT NULL,
    specialization      VARCHAR(100) NOT NULL,
    license_number      VARCHAR(60) NOT NULL UNIQUE,
    years_experience    INTEGER NOT NULL DEFAULT 0,
    consultation_fee    NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    department          VARCHAR(100) NOT NULL,
    bio                 TEXT,
    accepting_patients  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_doctor_experience CHECK (years_experience >= 0),
    CONSTRAINT chk_doctor_fee CHECK (consultation_fee >= 0)
);

-- One-to-Many: A doctor has multiple weekly availability windows
CREATE TABLE IF NOT EXISTS doctor_schema.doctor_availabilities (
    id              BIGSERIAL PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    day_of_week     VARCHAR(15) NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_duration_m INTEGER NOT NULL DEFAULT 30,
    available       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_availability_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_schema.doctors(id) ON DELETE CASCADE,
    CONSTRAINT chk_day_of_week CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    CONSTRAINT chk_time_window CHECK (end_time > start_time),
    CONSTRAINT chk_slot_duration CHECK (slot_duration_m BETWEEN 15 AND 120)
);

CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctor_schema.doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON doctor_schema.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_avail_doctor_day ON doctor_schema.doctor_availabilities(doctor_id, day_of_week);

-- ==============================================================================
-- 4. APPOINTMENT SERVICE SCHEMA (appointment_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS appointment_schema.appointments (
    id                  BIGSERIAL PRIMARY KEY,
    patient_id          BIGINT NOT NULL, -- Logical FK to patient_schema.patients(id)
    doctor_id           BIGINT NOT NULL, -- Logical FK to doctor_schema.doctors(id)
    appointment_date    DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    visit_type          VARCHAR(30) NOT NULL DEFAULT 'IN_PERSON',
    reason              VARCHAR(255) NOT NULL,
    notes               TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    cancellation_reason VARCHAR(255),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_appt_time_range CHECK (end_time > start_time),
    CONSTRAINT chk_appt_visit_type CHECK (visit_type IN ('IN_PERSON', 'VIDEO_TELEHEALTH')),
    CONSTRAINT chk_appt_status CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'))
);

-- Prevent exact duplicate active slot bookings at database level as a safety net
CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_active_slot
    ON appointment_schema.appointments (doctor_id, appointment_date, start_time)
    WHERE status IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULED');

CREATE INDEX IF NOT EXISTS idx_appt_patient_date ON appointment_schema.appointments(patient_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date ON appointment_schema.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_status ON appointment_schema.appointments(status);

-- ==============================================================================
-- 5. NOTIFICATION SERVICE SCHEMA (notification_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notification_schema.notifications (
    id              BIGSERIAL PRIMARY KEY,
    recipient_id    BIGINT NOT NULL, -- Logical FK to auth_schema.users(id)
    recipient_email VARCHAR(150) NOT NULL,
    appointment_id  BIGINT,          -- Optional logical FK to appointment_schema.appointments(id)
    channel         VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    event_type      VARCHAR(50) NOT NULL,
    title           VARCHAR(160) NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    sent_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notif_channel CHECK (channel IN ('IN_APP', 'EMAIL', 'BOTH')),
    CONSTRAINT chk_notif_event CHECK (event_type IN ('APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_REMINDER', 'SERVICE_REQUEST_UPDATED')),
    CONSTRAINT chk_notif_delivery CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient_read ON notification_schema.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON notification_schema.notifications(created_at DESC);

-- ==============================================================================
-- 6. ATTACH updated_at TRIGGERS TO ALL TABLES
-- ==============================================================================

CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON auth_schema.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON auth_schema.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_refresh_tokens_updated_at BEFORE UPDATE ON auth_schema.refresh_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patient_schema.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_service_requests_updated_at BEFORE UPDATE ON patient_schema.service_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_doctors_updated_at BEFORE UPDATE ON doctor_schema.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_doctor_availabilities_updated_at BEFORE UPDATE ON doctor_schema.doctor_availabilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointment_schema.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON notification_schema.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
