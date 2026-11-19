-- ==============================================================================
-- AI-Powered Healthcare Service Management Platform
-- MySQL 8.0 / 9.0 Relational Schema Script (Compatible with MySQL Workbench)
-- Strategy: Database-per-Service (matches JPA @Table(schema = "...") names)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS auth_schema
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS patient_schema
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS doctor_schema
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS appointment_schema
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS notification_schema
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==============================================================================
-- 1. AUTH SERVICE DATABASE (auth_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS auth_schema.roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT chk_role_name CHECK (name IN ('ROLE_ADMIN', 'ROLE_DOCTOR', 'ROLE_PATIENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_schema.users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    locked        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_schema.user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES auth_schema.roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_schema.refresh_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  DATETIME(6) NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_refresh_tokens_token (token),
    INDEX idx_refresh_tokens_user_id (user_id),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES auth_schema.users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. PATIENT SERVICE DATABASE (patient_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS patient_schema.patients (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
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
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_patients_user_id (user_id),
    INDEX idx_patients_last_name (last_name),
    INDEX idx_patients_email (email),
    CONSTRAINT chk_patient_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_schema.service_requests (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id      BIGINT NOT NULL,
    category        VARCHAR(60) NOT NULL,
    subject         VARCHAR(160) NOT NULL,
    description     TEXT NOT NULL,
    ai_summary      TEXT,
    priority        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status          VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    assigned_to     BIGINT,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_service_requests_patient_id (patient_id),
    INDEX idx_service_requests_status (status),
    CONSTRAINT fk_service_request_patient FOREIGN KEY (patient_id) REFERENCES patient_schema.patients(id) ON DELETE CASCADE,
    CONSTRAINT chk_sr_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_sr_status CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. DOCTOR SERVICE DATABASE (doctor_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS doctor_schema.doctors (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    first_name          VARCHAR(80) NOT NULL,
    last_name           VARCHAR(80) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    phone               VARCHAR(30) NOT NULL,
    specialization      VARCHAR(100) NOT NULL,
    license_number      VARCHAR(60) NOT NULL UNIQUE,
    years_experience    INT NOT NULL DEFAULT 0,
    consultation_fee    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    department          VARCHAR(100) NOT NULL,
    bio                 TEXT,
    accepting_patients  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_doctors_specialization (specialization),
    INDEX idx_doctors_user_id (user_id),
    CONSTRAINT chk_doctor_experience CHECK (years_experience >= 0),
    CONSTRAINT chk_doctor_fee CHECK (consultation_fee >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctor_schema.doctor_availabilities (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       BIGINT NOT NULL,
    day_of_week     VARCHAR(15) NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    slot_duration_m INT NOT NULL DEFAULT 30,
    available       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_doctor_avail_doctor_day (doctor_id, day_of_week),
    CONSTRAINT fk_availability_doctor FOREIGN KEY (doctor_id) REFERENCES doctor_schema.doctors(id) ON DELETE CASCADE,
    CONSTRAINT chk_day_of_week CHECK (day_of_week IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')),
    CONSTRAINT chk_time_window CHECK (end_time > start_time),
    CONSTRAINT chk_slot_duration CHECK (slot_duration_m BETWEEN 15 AND 120)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 4. APPOINTMENT SERVICE DATABASE (appointment_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS appointment_schema.appointments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id          BIGINT NOT NULL,
    doctor_id           BIGINT NOT NULL,
    appointment_date    DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    visit_type          VARCHAR(30) NOT NULL DEFAULT 'IN_PERSON',
    reason              VARCHAR(255) NOT NULL,
    notes               TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    cancellation_reason VARCHAR(255),
    created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_appt_doctor_slot_status (doctor_id, appointment_date, start_time, status),
    INDEX idx_appt_patient_date (patient_id, appointment_date),
    INDEX idx_appt_doctor_date (doctor_id, appointment_date),
    INDEX idx_appt_status (status),
    CONSTRAINT chk_appt_time_range CHECK (end_time > start_time),
    CONSTRAINT chk_appt_visit_type CHECK (visit_type IN ('IN_PERSON', 'VIDEO_TELEHEALTH')),
    CONSTRAINT chk_appt_status CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. NOTIFICATION SERVICE DATABASE (notification_schema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notification_schema.notifications (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id    BIGINT NOT NULL,
    recipient_email VARCHAR(150) NOT NULL,
    appointment_id  BIGINT,
    channel         VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    event_type      VARCHAR(50) NOT NULL,
    title           VARCHAR(160) NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    sent_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_notif_recipient_read (recipient_id, is_read),
    INDEX idx_notif_created_at (created_at),
    CONSTRAINT chk_notif_channel CHECK (channel IN ('IN_APP', 'EMAIL', 'BOTH')),
    CONSTRAINT chk_notif_event CHECK (event_type IN ('APPOINTMENT_BOOKED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_REMINDER', 'SERVICE_REQUEST_UPDATED')),
    CONSTRAINT chk_notif_delivery CHECK (delivery_status IN ('PENDING', 'SENT', 'FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
