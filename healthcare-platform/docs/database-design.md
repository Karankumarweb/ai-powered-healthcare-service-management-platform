# Database Design — AI-Powered Healthcare Service Management Platform

## 1. Schema-per-Service Strategy

In a microservices architecture, services must not couple directly via cross-service foreign keys at the database table level. Instead, we use **one PostgreSQL 16 instance** (`healthcare_platform`) with **5 isolated schemas**:

- `auth_schema` (owned by `auth-service`)
- `patient_schema` (owned by `patient_schema` / `patient-service`)
- `doctor_schema` (owned by `doctor-service`)
- `appointment_schema` (owned by `appointment-service`)
- `notification_schema` (owned by `notification-service`)

Cross-service relationships (such as `appointments.patient_id` or `patients.user_id`) are stored as **logical IDs** validated via REST API calls rather than hard SQL foreign keys across schemas, keeping each service independently deployable.

## 2. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    USERS ||--o{ REFRESH_TOKENS : owns
    USERS ||--|| PATIENTS : "1:1 logical (user_id)"
    USERS ||--|| DOCTORS : "1:1 logical (user_id)"
    PATIENTS ||--o{ SERVICE_REQUESTS : submits
    DOCTORS ||--o{ DOCTOR_AVAILABILITIES : defines
    PATIENTS ||--o{ APPOINTMENTS : "books (logical)"
    DOCTORS ||--o{ APPOINTMENTS : "attends (logical)"
    APPOINTMENTS ||--o{ NOTIFICATIONS : "triggers (logical)"

    USERS {
        bigint id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        boolean enabled
        boolean locked
        timestamptz created_at
        timestamptz updated_at
    }

    ROLES {
        bigint id PK
        varchar name UK
        varchar description
    }

    REFRESH_TOKENS {
        bigint id PK
        bigint user_id FK
        varchar token UK
        timestamptz expires_at
        boolean revoked
    }

    PATIENTS {
        bigint id PK
        bigint user_id UK
        varchar first_name
        varchar last_name
        date date_of_birth
        varchar gender
        varchar phone
        varchar email UK
        varchar blood_group
    }

    SERVICE_REQUESTS {
        bigint id PK
        bigint patient_id FK
        varchar category
        varchar subject
        text description
        text ai_summary
        varchar priority
        varchar status
    }

    DOCTORS {
        bigint id PK
        bigint user_id UK
        varchar first_name
        varchar last_name
        varchar email UK
        varchar specialization
        varchar license_number UK
        numeric consultation_fee
    }

    DOCTOR_AVAILABILITIES {
        bigint id PK
        bigint doctor_id FK
        varchar day_of_week
        time start_time
        time end_time
        int slot_duration_m
    }

    APPOINTMENTS {
        bigint id PK
        bigint patient_id
        bigint doctor_id
        date appointment_date
        time start_time
        time end_time
        varchar visit_type
        varchar status
    }

    NOTIFICATIONS {
        bigint id PK
        bigint recipient_id
        bigint appointment_id
        varchar channel
        varchar event_type
        varchar title
        boolean is_read
    }
```

## 3. Double-Booking Prevention Design

1. **Application-level Overlap Query (JPQL)**: Before saving an appointment, `appointment-service` queries any existing active appointment for the same `doctor_id` and `appointment_date` where `(existing.start_time < newEndTime AND existing.end_time > newStartTime)`.
2. **Database-level Partial Unique Index**:
   ```sql
   CREATE UNIQUE INDEX uq_doctor_active_slot
   ON appointment_schema.appointments (doctor_id, appointment_date, start_time)
   WHERE status IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULED');
   ```
   This guarantees race conditions cannot insert two active bookings for the same start slot even under concurrent requests.
