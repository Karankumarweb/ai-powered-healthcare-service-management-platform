-- ==============================================================================
-- AI-Powered Healthcare Service Management Platform
-- Development Sample Data (FOR LOCAL DEVELOPMENT ONLY)
-- ==============================================================================

-- 1. Roles
INSERT INTO auth_schema.roles (name, description) VALUES
    ('ROLE_ADMIN', 'Platform administrator with full operational access'),
    ('ROLE_DOCTOR', 'Licensed clinician managing schedules and appointments'),
    ('ROLE_PATIENT', 'Registered patient booking care and submitting service requests')
ON CONFLICT (name) DO NOTHING;

-- 2. Sample Users (Password hashes represent BCrypt-encoded development credentials)
-- Note: Auth Service seeds live BCrypt passwords on startup in Phase 2.
INSERT INTO auth_schema.users (email, password_hash, full_name, enabled) VALUES
    ('admin@careflow.local', '$2a$10$DevSeedPlaceholderHashOnlyForLocalSchemaTesting000001', 'Elena Vance', TRUE),
    ('dr.patel@careflow.local', '$2a$10$DevSeedPlaceholderHashOnlyForLocalSchemaTesting000002', 'Dr. Aarav Patel', TRUE),
    ('dr.chen@careflow.local', '$2a$10$DevSeedPlaceholderHashOnlyForLocalSchemaTesting000003', 'Dr. Maya Chen', TRUE),
    ('patient.miller@careflow.local', '$2a$10$DevSeedPlaceholderHashOnlyForLocalSchemaTesting000004', 'Liam Miller', TRUE),
    ('patient.garcia@careflow.local', '$2a$10$DevSeedPlaceholderHashOnlyForLocalSchemaTesting000005', 'Sofia Garcia', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Assign Roles
INSERT INTO auth_schema.user_roles (user_id, role_id)
SELECT u.id, r.id FROM auth_schema.users u JOIN auth_schema.roles r ON r.name = 'ROLE_ADMIN' WHERE u.email = 'admin@careflow.local'
ON CONFLICT DO NOTHING;

INSERT INTO auth_schema.user_roles (user_id, role_id)
SELECT u.id, r.id FROM auth_schema.users u JOIN auth_schema.roles r ON r.name = 'ROLE_DOCTOR' WHERE u.email IN ('dr.patel@careflow.local', 'dr.chen@careflow.local')
ON CONFLICT DO NOTHING;

INSERT INTO auth_schema.user_roles (user_id, role_id)
SELECT u.id, r.id FROM auth_schema.users u JOIN auth_schema.roles r ON r.name = 'ROLE_PATIENT' WHERE u.email IN ('patient.miller@careflow.local', 'patient.garcia@careflow.local')
ON CONFLICT DO NOTHING;

-- 3. Sample Doctors
INSERT INTO doctor_schema.doctors (user_id, first_name, last_name, email, phone, specialization, license_number, years_experience, consultation_fee, department, bio)
VALUES
    (2, 'Aarav', 'Patel', 'dr.patel@careflow.local', '+1-555-0142', 'Cardiology', 'MED-CA-88421', 12, 180.00, 'Heart & Vascular Center', 'Board-certified cardiologist specializing in preventive cardiovascular care.'),
    (3, 'Maya', 'Chen', 'dr.chen@careflow.local', '+1-555-0198', 'Family Medicine', 'MED-CA-77319', 8, 120.00, 'Primary Care', 'Primary care physician focused on holistic family health and chronic care management.')
ON CONFLICT (email) DO NOTHING;

-- Doctor Availability Windows
INSERT INTO doctor_schema.doctor_availabilities (doctor_id, day_of_week, start_time, end_time, slot_duration_m)
SELECT d.id, 'MONDAY', '09:00', '13:00', 30 FROM doctor_schema.doctors d WHERE d.email = 'dr.patel@careflow.local';
INSERT INTO doctor_schema.doctor_availabilities (doctor_id, day_of_week, start_time, end_time, slot_duration_m)
SELECT d.id, 'WEDNESDAY', '10:00', '16:00', 30 FROM doctor_schema.doctors d WHERE d.email = 'dr.patel@careflow.local';
INSERT INTO doctor_schema.doctor_availabilities (doctor_id, day_of_week, start_time, end_time, slot_duration_m)
SELECT d.id, 'TUESDAY', '08:30', '15:30', 30 FROM doctor_schema.doctors d WHERE d.email = 'dr.chen@careflow.local';

-- 4. Sample Patients
INSERT INTO patient_schema.patients (user_id, first_name, last_name, date_of_birth, gender, phone, email, address, blood_group, emergency_contact, insurance_provider)
VALUES
    (4, 'Liam', 'Miller', '1991-04-18', 'MALE', '+1-555-0211', 'patient.miller@careflow.local', '742 Cedar Grove Ave, Seattle, WA', 'O+', 'Claire Miller (+1-555-0212)', 'BlueCross Health'),
    (5, 'Sofia', 'Garcia', '1987-09-25', 'FEMALE', '+1-555-0244', 'patient.garcia@careflow.local', '118 Harbor View Rd, Seattle, WA', 'A+', 'Mateo Garcia (+1-555-0245)', 'Aetna Care')
ON CONFLICT (email) DO NOTHING;

-- 5. Sample Appointments
INSERT INTO appointment_schema.appointments (patient_id, doctor_id, appointment_date, start_time, end_time, visit_type, reason, status)
VALUES
    (1, 1, CURRENT_DATE + INTERVAL '2 days', '09:30', '10:00', 'IN_PERSON', 'Annual cardiovascular screening and blood pressure follow-up', 'CONFIRMED'),
    (2, 2, CURRENT_DATE + INTERVAL '3 days', '10:00', '10:30', 'VIDEO_TELEHEALTH', 'Routine primary care check-in and immunization review', 'SCHEDULED');

-- 6. Sample Service Requests
INSERT INTO patient_schema.service_requests (patient_id, category, subject, description, ai_summary, priority, status)
VALUES
    (1, 'MEDICAL_RECORDS', 'Request copy of previous ECG summary', 'I need a digital PDF copy of my annual screening records before transferring insurance next month.', 'Patient requests digital copy of prior screening records for upcoming insurance transition.', 'MEDIUM', 'OPEN');

-- 7. Sample Notifications
INSERT INTO notification_schema.notifications (recipient_id, recipient_email, appointment_id, channel, event_type, title, message)
VALUES
    (4, 'patient.miller@careflow.local', 1, 'IN_APP', 'APPOINTMENT_BOOKED', 'Appointment Confirmed with Dr. Aarav Patel', 'Your cardiology appointment is confirmed for 09:30 AM. Please bring a photo ID and insurance card.');
