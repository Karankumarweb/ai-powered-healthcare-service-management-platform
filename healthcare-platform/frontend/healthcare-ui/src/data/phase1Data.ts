export interface PhaseItem {
  phase: number;
  title: string;
  status: 'Completed' | 'Awaiting Approval' | 'Planned';
  summary: string;
  deliverables: string[];
}

export interface MicroserviceSpec {
  id: string;
  name: string;
  port: number;
  schema: string;
  phase: number;
  role: string;
  responsibilities: string[];
  outboundCalls: string[];
  sampleEndpoints: { method: string; path: string; auth: string }[];
}

export interface WorkflowTrace {
  id: string;
  title: string;
  subtitle: string;
  steps: {
    stepNumber: number;
    actor: string;
    target: string;
    action: string;
    detail: string;
  }[];
}

export interface TableColumn {
  name: string;
  type: string;
  key?: 'PK' | 'FK' | 'UK' | 'LOGICAL_FK';
  nullable: boolean;
  notes: string;
}

export interface TableSpec {
  schema: string;
  name: string;
  ownerService: string;
  description: string;
  columns: TableColumn[];
  indexes: string[];
  relationships: string[];
}

export interface FolderNode {
  name: string;
  type: 'dir' | 'file';
  phase: string;
  description: string;
  children?: FolderNode[];
}

export const STACK_MATRIX = [
  { layer: 'Runtime', technology: 'Java 17 LTS', version: '17', note: 'Long-term support baseline' },
  { layer: 'Backend Framework', technology: 'Spring Boot', version: '3.4.5', note: 'Spring MVC, Data JPA, Security, Validation' },
  { layer: 'Gateway & Routing', technology: 'Spring Cloud', version: '2024.0.1', note: 'Moorgate release train for Boot 3.4.x' },
  { layer: 'AI Integration', technology: 'Spring AI (OpenAI)', version: '1.1.8', note: '1.x stream compatible with Boot 3 + Java 17' },
  { layer: 'Authentication', technology: 'JJWT (io.jsonwebtoken)', version: '0.12.6', note: 'HMAC-SHA256 stateless access + DB refresh tokens' },
  { layer: 'Database', technology: 'PostgreSQL', version: '16', note: 'Isolated schema-per-service ownership' },
  { layer: 'API Docs', technology: 'Springdoc OpenAPI', version: '2.8.5', note: 'Swagger UI per microservice' },
  { layer: 'Frontend', technology: 'React + Vite + Tailwind', version: '19 / 6 / 4', note: 'Axios, React Router, Lucide React' },
];

export const PHASE_CHECKLIST: PhaseItem[] = [
  {
    phase: 1,
    title: 'Architecture, Database Design & Folder Structure',
    status: 'Completed',
    summary: 'System blueprint, 7-service topology, PostgreSQL schemas, ER model, and local env configuration.',
    deliverables: ['docs/architecture.md', 'docs/database-design.md', 'database/schema.sql', 'database/sample-data.sql', '.env.example'],
  },
  {
    phase: 2,
    title: 'API Gateway & Auth Service',
    status: 'Completed',
    summary: 'Spring Cloud Gateway routing, user registration, BCrypt login, JWT issuance, refresh rotation, and RBAC.',
    deliverables: ['api-gateway', 'auth-service', 'JWT filter & role guards'],
  },
  {
    phase: 3,
    title: 'Patient Service & Doctor Service',
    status: 'Completed',
    summary: 'Full CRUD, search, pagination, sorting, specialization filters, and weekly doctor availability slots.',
    deliverables: ['patient-service', 'doctor-service', 'ServiceRequest entity'],
  },
  {
    phase: 4,
    title: 'Appointment Service',
    status: 'Completed',
    summary: 'Booking, cancellation, rescheduling, RestClient checks, and double-booking prevention.',
    deliverables: ['appointment-service', 'Overlap JPQL & unique index'],
  },
  {
    phase: 5,
    title: 'Notification Service',
    status: 'Completed',
    summary: 'In-app notifications, booking confirmations, cancellations, reminders, and unread counters.',
    deliverables: ['notification-service', 'Appointment event hooks'],
  },
  {
    phase: 6,
    title: 'AI Assistant Service',
    status: 'Completed',
    summary: 'Spring AI + OpenAI integration, FAQ prompt engineering, structured summaries, and medical safety guardrails.',
    deliverables: ['ai-assistant-service', 'PII redaction & disclaimers'],
  },
  {
    phase: 7,
    title: 'React Healthcare SaaS Frontend',
    status: 'Completed',
    summary: 'All 16 pages, protected role routes, Axios interceptors, reusable components, and AI chat UI.',
    deliverables: ['frontend/healthcare-ui', 'Auth context & role dashboards'],
  },
  {
    phase: 8,
    title: 'Testing, Docker & Docker Compose',
    status: 'Completed',
    summary: 'JUnit 5, Mockito, MockMvc, React component tests, multi-stage Dockerfiles, and full compose stack.',
    deliverables: ['Backend & UI tests', 'Dockerfiles', 'docker-compose.yml'],
  },
  {
    phase: 9,
    title: 'Documentation, Postman & Interview Prep',
    status: 'Completed',
    summary: 'Complete README, Postman collection JSON, OpenAPI specs, and architectural interview walkthrough.',
    deliverables: ['README.md', 'postman-collection.json', 'API docs'],
  },
];

export const MICROSERVICES: MicroserviceSpec[] = [
  {
    id: 'api-gateway',
    name: 'API Gateway',
    port: 8080,
    schema: 'Stateless',
    phase: 2,
    role: 'Single HTTP entry point for the React SPA and external API clients.',
    responsibilities: [
      'Routes /api/v1/** traffic to downstream Spring Boot services',
      'Enforces centralized CORS policy for frontend origin',
      'Performs early JWT signature verification before forwarding',
      'Attaches X-User-Id and X-User-Roles headers for downstream auditing',
    ],
    outboundCalls: ['auth-service', 'patient-service', 'doctor-service', 'appointment-service', 'notification-service', 'ai-assistant-service'],
    sampleEndpoints: [
      { method: 'ANY', path: '/api/v1/auth/**', auth: 'Public (login/register/refresh)' },
      { method: 'ANY', path: '/api/v1/appointments/**', auth: 'Bearer JWT' },
    ],
  },
  {
    id: 'auth-service',
    name: 'Auth Service',
    port: 8081,
    schema: 'auth_schema',
    phase: 2,
    role: 'Identity provider managing credentials, roles, JWTs, and token revocation.',
    responsibilities: [
      'User registration and login with BCrypt password hashing',
      'Generates short-lived JWT access tokens (15 min) signed with HMAC-SHA256',
      'Issues and rotates persistent refresh tokens in PostgreSQL',
      'Supports explicit logout and refresh token revocation',
    ],
    outboundCalls: [],
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/auth/register', auth: 'Public' },
      { method: 'POST', path: '/api/v1/auth/login', auth: 'Public' },
      { method: 'POST', path: '/api/v1/auth/refresh', auth: 'Refresh Token' },
      { method: 'POST', path: '/api/v1/auth/logout', auth: 'Bearer JWT' },
    ],
  },
  {
    id: 'patient-service',
    name: 'Patient Service',
    port: 8082,
    schema: 'patient_schema',
    phase: 3,
    role: 'Owns patient demographic records and non-emergency healthcare service requests.',
    responsibilities: [
      'Full patient profile CRUD with Bean Validation',
      'Paginated, sorted, and keyword-searchable patient directory',
      'Manages patient healthcare service requests (records, billing, scheduling help)',
      'Stores AI-generated structured summaries alongside requests',
    ],
    outboundCalls: ['ai-assistant-service (optional summary)'],
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/patients', auth: 'ADMIN / PATIENT' },
      { method: 'GET', path: '/api/v1/patients?page=0&size=10', auth: 'ADMIN / DOCTOR' },
      { method: 'POST', path: '/api/v1/service-requests', auth: 'PATIENT' },
    ],
  },
  {
    id: 'doctor-service',
    name: 'Doctor Service',
    port: 8083,
    schema: 'doctor_schema',
    phase: 3,
    role: 'Manages clinician profiles, medical specializations, and weekly availability slots.',
    responsibilities: [
      'Doctor onboarding, license validation, and profile updates',
      'Search doctors by specialization, department, or accepting status',
      'Configures recurring weekly availability windows and slot durations',
      'Exposes availability verification endpoint for Appointment Service',
    ],
    outboundCalls: [],
    sampleEndpoints: [
      { method: 'GET', path: '/api/v1/doctors?specialization=Cardiology', auth: 'Authenticated' },
      { method: 'PUT', path: '/api/v1/doctors/{id}/availability', auth: 'ADMIN / DOCTOR' },
      { method: 'GET', path: '/api/v1/doctors/{id}/availability', auth: 'Internal / Auth' },
    ],
  },
  {
    id: 'appointment-service',
    name: 'Appointment Service',
    port: 8084,
    schema: 'appointment_schema',
    phase: 4,
    role: 'Coordinates scheduling lifecycle while guaranteeing zero overlapping double-bookings.',
    responsibilities: [
      'Validates patient and doctor existence via RestClient before booking',
      'Checks doctor availability window for the requested weekday and time',
      'Runs transactional overlap query + DB partial unique index to block double booking',
      'Handles reschedule and cancellation transitions with audit reasons',
    ],
    outboundCalls: ['patient-service', 'doctor-service', 'notification-service'],
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/appointments', auth: 'PATIENT / ADMIN' },
      { method: 'PATCH', path: '/api/v1/appointments/{id}/reschedule', auth: 'PATIENT / DOCTOR' },
      { method: 'PATCH', path: '/api/v1/appointments/{id}/cancel', auth: 'PATIENT / DOCTOR / ADMIN' },
    ],
  },
  {
    id: 'notification-service',
    name: 'Notification Service',
    port: 8085,
    schema: 'notification_schema',
    phase: 5,
    role: 'Persists and delivers appointment confirmations, cancellations, and reminders.',
    responsibilities: [
      'Stores in-app notification inbox per user with read/unread tracking',
      'Receives booking, cancellation, and reschedule events from Appointment Service',
      'Supports scheduled reminder generation for upcoming visits',
      'Tracks delivery status (PENDING, SENT, FAILED) for auditability',
    ],
    outboundCalls: [],
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/notifications', auth: 'Internal / Service' },
      { method: 'GET', path: '/api/v1/notifications/my', auth: 'Authenticated' },
      { method: 'PATCH', path: '/api/v1/notifications/{id}/read', auth: 'Authenticated' },
    ],
  },
  {
    id: 'ai-assistant-service',
    name: 'AI Assistant Service',
    port: 8086,
    schema: 'Stateless',
    phase: 6,
    role: 'Provides Spring AI + OpenAI conversational guidance with strict clinical safety guardrails.',
    responsibilities: [
      'Answers platform FAQs (booking, cancellations, documents to bring)',
      'Generates structured JSON summaries of de-identified service requests',
      'Enforces system prompts banning medical diagnosis or prescriptions',
      'Handles OpenAI rate limits, timeouts, and fallback disclaimers gracefully',
    ],
    outboundCalls: ['OpenAI API (via Spring AI ChatClient)'],
    sampleEndpoints: [
      { method: 'POST', path: '/api/v1/ai/chat', auth: 'Authenticated' },
      { method: 'POST', path: '/api/v1/ai/summarize-request', auth: 'Authenticated' },
    ],
  },
];

export const WORKFLOW_TRACES: WorkflowTrace[] = [
  {
    id: 'booking',
    title: 'Appointment Booking & Double-Booking Prevention',
    subtitle: 'How 4 microservices coordinate to validate availability and guarantee no overlapping slots.',
    steps: [
      { stepNumber: 1, actor: 'React UI', target: 'API Gateway (:8080)', action: 'POST /api/v1/appointments', detail: 'Sends doctorId, patientId, date, startTime, endTime with Bearer JWT.' },
      { stepNumber: 2, actor: 'API Gateway', target: 'Appointment Service (:8084)', action: 'Verify JWT & Forward', detail: 'Validates JWT signature and ROLE_PATIENT/ROLE_ADMIN permission.' },
      { stepNumber: 3, actor: 'Appointment Service', target: 'Patient Service (:8082)', action: 'GET /api/v1/patients/{id}', detail: 'Confirms the patient profile exists and is active.' },
      { stepNumber: 4, actor: 'Appointment Service', target: 'Doctor Service (:8083)', action: 'GET /api/v1/doctors/{id}/availability', detail: 'Confirms the requested time fits inside the doctor’s weekly working hours.' },
      { stepNumber: 5, actor: 'Appointment Service', target: 'appointment_schema', action: 'Transactional Overlap Check', detail: 'Executes JPQL overlap query + relies on partial unique index uq_doctor_active_slot.' },
      { stepNumber: 6, actor: 'Appointment Service', target: 'Notification Service (:8085)', action: 'POST /api/v1/notifications', detail: 'Persists in-app booking confirmation for both patient and clinician.' },
    ],
  },
  {
    id: 'auth',
    title: 'Stateless JWT Auth & Refresh Token Rotation',
    subtitle: 'Secure authentication lifecycle with BCrypt hashing and instant logout revocation.',
    steps: [
      { stepNumber: 1, actor: 'React UI', target: 'API Gateway (:8080)', action: 'POST /api/v1/auth/login', detail: 'Submits email and password over HTTPS.' },
      { stepNumber: 2, actor: 'Auth Service (:8081)', target: 'auth_schema.users', action: 'Verify BCrypt Hash', detail: 'Loads user & roles via user_roles join table and validates password.' },
      { stepNumber: 3, actor: 'Auth Service (:8081)', target: 'auth_schema.refresh_tokens', action: 'Issue Token Pair', detail: 'Generates 15-min signed JWT access token + stores 7-day refresh token in DB.' },
      { stepNumber: 4, actor: 'React UI', target: 'Protected Endpoints', action: 'Attach Bearer Token', detail: 'Axios interceptor attaches Authorization header; refreshes automatically on 401.' },
      { stepNumber: 5, actor: 'Auth Service (:8081)', target: 'auth_schema.refresh_tokens', action: 'POST /api/v1/auth/logout', detail: 'Marks refresh token revoked=true so sessions cannot be renewed.' },
    ],
  },
  {
    id: 'ai',
    title: 'Safe AI Healthcare Assistant & Privacy Guardrails',
    subtitle: 'Backend-only OpenAI calls with PII stripping and non-diagnostic disclaimers.',
    steps: [
      { stepNumber: 1, actor: 'Patient', target: 'React AI Chat UI', action: 'Submits Question', detail: 'E.g. "What documents should I bring to my cardiology visit?"' },
      { stepNumber: 2, actor: 'API Gateway (:8080)', target: 'AI Assistant Service (:8086)', action: 'POST /api/v1/ai/chat', detail: 'OpenAI API key never leaves backend environment variables.' },
      { stepNumber: 3, actor: 'AI Assistant Service', target: 'PII Redaction Guard', action: 'Sanitize Input', detail: 'Strips emails, phone numbers, and identifiers before external API call.' },
      { stepNumber: 4, actor: 'Spring AI ChatClient', target: 'OpenAI API', action: 'System Prompt + User Prompt', detail: 'System prompt strictly forbids diagnosing illness or prescribing medication.' },
      { stepNumber: 5, actor: 'AI Assistant Service', target: 'React AI Chat UI', action: 'Structured Response + Disclaimer', detail: 'Returns helpful guidance, next workflow steps, and clear medical disclaimer.' },
    ],
  },
];

export const DATABASE_TABLES: TableSpec[] = [
  {
    schema: 'auth_schema',
    name: 'users',
    ownerService: 'auth-service',
    description: 'Core identity table storing login credentials and account status.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Auto-increment primary key' },
      { name: 'email', type: 'VARCHAR(150)', key: 'UK', nullable: false, notes: 'Unique login identifier' },
      { name: 'password_hash', type: 'VARCHAR(255)', nullable: false, notes: 'BCrypt encoded password' },
      { name: 'full_name', type: 'VARCHAR(120)', nullable: false, notes: 'Display name' },
      { name: 'enabled', type: 'BOOLEAN', nullable: false, notes: 'Default TRUE' },
      { name: 'locked', type: 'BOOLEAN', nullable: false, notes: 'Default FALSE' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, notes: 'Audit creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, notes: 'Maintained by trigger' },
    ],
    indexes: ['idx_users_email (email)'],
    relationships: ['1:N with refresh_tokens', 'M:N with roles via user_roles', '1:1 logical with patients & doctors'],
  },
  {
    schema: 'auth_schema',
    name: 'roles',
    ownerService: 'auth-service',
    description: 'System authorization roles enforced by Spring Security.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Primary key' },
      { name: 'name', type: 'VARCHAR(30)', key: 'UK', nullable: false, notes: 'ROLE_ADMIN | ROLE_DOCTOR | ROLE_PATIENT' },
      { name: 'description', type: 'VARCHAR(255)', nullable: true, notes: 'Human-readable role description' },
    ],
    indexes: ['Unique constraint on name'],
    relationships: ['M:N with users via user_roles'],
  },
  {
    schema: 'auth_schema',
    name: 'user_roles',
    ownerService: 'auth-service',
    description: 'Many-to-Many join table mapping users to assigned security roles.',
    columns: [
      { name: 'user_id', type: 'BIGINT', key: 'PK', nullable: false, notes: 'FK -> auth_schema.users(id)' },
      { name: 'role_id', type: 'BIGINT', key: 'PK', nullable: false, notes: 'FK -> auth_schema.roles(id)' },
    ],
    indexes: ['Composite PK (user_id, role_id)'],
    relationships: ['Joins users and roles'],
  },
  {
    schema: 'auth_schema',
    name: 'refresh_tokens',
    ownerService: 'auth-service',
    description: 'Stores refresh tokens for rotation and immediate logout revocation.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Primary key' },
      { name: 'user_id', type: 'BIGINT', key: 'FK', nullable: false, notes: 'FK -> auth_schema.users(id)' },
      { name: 'token', type: 'VARCHAR(512)', key: 'UK', nullable: false, notes: 'Opaque refresh token string' },
      { name: 'expires_at', type: 'TIMESTAMPTZ', nullable: false, notes: 'Expiration timestamp' },
      { name: 'revoked', type: 'BOOLEAN', nullable: false, notes: 'Set TRUE on logout or rotation' },
    ],
    indexes: ['idx_refresh_tokens_token (token)', 'idx_refresh_tokens_user_id (user_id)'],
    relationships: ['N:1 with auth_schema.users'],
  },
  {
    schema: 'patient_schema',
    name: 'patients',
    ownerService: 'patient-service',
    description: 'Patient demographic, contact, and insurance profile records.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Primary key' },
      { name: 'user_id', type: 'BIGINT', key: 'LOGICAL_FK', nullable: false, notes: 'Unique logical 1:1 link to users(id)' },
      { name: 'first_name', type: 'VARCHAR(80)', nullable: false, notes: 'Given name' },
      { name: 'last_name', type: 'VARCHAR(80)', nullable: false, notes: 'Family name' },
      { name: 'date_of_birth', type: 'DATE', nullable: false, notes: 'Patient DOB' },
      { name: 'gender', type: 'VARCHAR(20)', nullable: false, notes: 'Checked enum constraint' },
      { name: 'phone', type: 'VARCHAR(30)', nullable: false, notes: 'Contact number' },
      { name: 'email', type: 'VARCHAR(150)', key: 'UK', nullable: false, notes: 'Unique patient email' },
      { name: 'blood_group', type: 'VARCHAR(10)', nullable: true, notes: 'Optional blood type' },
      { name: 'insurance_provider', type: 'VARCHAR(120)', nullable: true, notes: 'Coverage carrier' },
    ],
    indexes: ['idx_patients_user_id', 'idx_patients_last_name', 'idx_patients_email'],
    relationships: ['1:N with service_requests', '1:N logical with appointments'],
  },
  {
    schema: 'patient_schema',
    name: 'service_requests',
    ownerService: 'patient-service',
    description: 'Patient administrative/support requests enriched with safe AI summaries.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Primary key' },
      { name: 'patient_id', type: 'BIGINT', key: 'FK', nullable: false, notes: 'FK -> patient_schema.patients(id)' },
      { name: 'category', type: 'VARCHAR(60)', nullable: false, notes: 'Records, Billing, Scheduling, etc.' },
      { name: 'subject', type: 'VARCHAR(160)', nullable: false, notes: 'Short request title' },
      { name: 'description', type: 'TEXT', nullable: false, notes: 'Patient-submitted details' },
      { name: 'ai_summary', type: 'TEXT', nullable: true, notes: 'Structured summary from Spring AI' },
      { name: 'priority', type: 'VARCHAR(20)', nullable: false, notes: 'LOW | MEDIUM | HIGH | URGENT' },
      { name: 'status', type: 'VARCHAR(30)', nullable: false, notes: 'OPEN | IN_REVIEW | RESOLVED | CLOSED' },
    ],
    indexes: ['idx_service_requests_patient_id', 'idx_service_requests_status'],
    relationships: ['N:1 with patient_schema.patients'],
  },
  {
    schema: 'doctor_schema',
    name: 'doctors',
    ownerService: 'doctor-service',
    description: 'Clinician directory profile, medical license, specialization, and fee metadata.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Primary key' },
      { name: 'user_id', type: 'BIGINT', key: 'LOGICAL_FK', nullable: false, notes: 'Unique logical 1:1 link to users(id)' },
      { name: 'first_name', type: 'VARCHAR(80)', nullable: false, notes: 'First name' },
      { name: 'last_name', type: 'VARCHAR(80)', nullable: false, notes: 'Last name' },
      { name: 'specialization', type: 'VARCHAR(100)', nullable: false, notes: 'Cardiology, Family Medicine, etc.' },
      { name: 'license_number', type: 'VARCHAR(60)', key: 'UK', nullable: false, notes: 'Unique medical license ID' },
      { name: 'consultation_fee', type: 'NUMERIC(10,2)', nullable: false, notes: 'Non-negative check constraint' },
      { name: 'accepting_patients', type: 'BOOLEAN', nullable: false, notes: 'Default TRUE' },
    ],
    indexes: ['idx_doctors_specialization', 'idx_doctors_user_id'],
    relationships: ['1:N with doctor_availabilities', '1:N logical with appointments'],
  },
  {
    schema: 'doctor_schema',
    name: 'doctor_availabilities',
    ownerService: 'doctor-service',
    description: 'Weekly recurring availability blocks and slot length for each clinician.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Primary key' },
      { name: 'doctor_id', type: 'BIGINT', key: 'FK', nullable: false, notes: 'FK -> doctor_schema.doctors(id)' },
      { name: 'day_of_week', type: 'VARCHAR(15)', nullable: false, notes: 'MONDAY .. SUNDAY' },
      { name: 'start_time', type: 'TIME', nullable: false, notes: 'Window open time' },
      { name: 'end_time', type: 'TIME', nullable: false, notes: 'Must be > start_time' },
      { name: 'slot_duration_m', type: 'INTEGER', nullable: false, notes: '15 to 120 minutes' },
    ],
    indexes: ['idx_doctor_avail_doctor_day (doctor_id, day_of_week)'],
    relationships: ['N:1 with doctor_schema.doctors'],
  },
  {
    schema: 'appointment_schema',
    name: 'appointments',
    ownerService: 'appointment-service',
    description: 'Scheduled patient-doctor visits protected against double booking.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Primary key' },
      { name: 'patient_id', type: 'BIGINT', key: 'LOGICAL_FK', nullable: false, notes: 'Logical FK to patients(id)' },
      { name: 'doctor_id', type: 'BIGINT', key: 'LOGICAL_FK', nullable: false, notes: 'Logical FK to doctors(id)' },
      { name: 'appointment_date', type: 'DATE', nullable: false, notes: 'Calendar visit date' },
      { name: 'start_time', type: 'TIME', nullable: false, notes: 'Slot start' },
      { name: 'end_time', type: 'TIME', nullable: false, notes: 'Must be > start_time' },
      { name: 'visit_type', type: 'VARCHAR(30)', nullable: false, notes: 'IN_PERSON | VIDEO_TELEHEALTH' },
      { name: 'status', type: 'VARCHAR(30)', nullable: false, notes: 'SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | RESCHEDULED | NO_SHOW' },
    ],
    indexes: ['uq_doctor_active_slot (partial unique index)', 'idx_appt_patient_date', 'idx_appt_doctor_date', 'idx_appt_status'],
    relationships: ['Logical N:1 with patients & doctors', 'Logical 1:N with notifications'],
  },
  {
    schema: 'notification_schema',
    name: 'notifications',
    ownerService: 'notification-service',
    description: 'In-app and email notification history for appointment & request events.',
    columns: [
      { name: 'id', type: 'BIGSERIAL', key: 'PK', nullable: false, notes: 'Primary key' },
      { name: 'recipient_id', type: 'BIGINT', key: 'LOGICAL_FK', nullable: false, notes: 'Logical FK to users(id)' },
      { name: 'appointment_id', type: 'BIGINT', key: 'LOGICAL_FK', nullable: true, notes: 'Optional logical FK to appointments(id)' },
      { name: 'channel', type: 'VARCHAR(20)', nullable: false, notes: 'IN_APP | EMAIL | BOTH' },
      { name: 'event_type', type: 'VARCHAR(50)', nullable: false, notes: 'BOOKED | CANCELLED | RESCHEDULED | REMINDER' },
      { name: 'title', type: 'VARCHAR(160)', nullable: false, notes: 'Notification headline' },
      { name: 'is_read', type: 'BOOLEAN', nullable: false, notes: 'Unread indicator state' },
      { name: 'delivery_status', type: 'VARCHAR(20)', nullable: false, notes: 'PENDING | SENT | FAILED' },
    ],
    indexes: ['idx_notif_recipient_read (recipient_id, is_read)', 'idx_notif_created_at (created_at DESC)'],
    relationships: ['Logical N:1 with users & appointments'],
  },
];

export const FOLDER_TREE: FolderNode[] = [
  {
    name: 'healthcare-platform/',
    type: 'dir',
    phase: 'Phase 1',
    description: 'Monorepo root containing all 7 Spring Boot microservices, React UI, SQL scripts, Docker, and docs.',
    children: [
      {
        name: 'backend/',
        type: 'dir',
        phase: 'Phases 2–6',
        description: 'Independent Maven Spring Boot 3.4.5 microservices',
        children: [
          { name: 'api-gateway/', type: 'dir', phase: 'Phase 2', description: 'Spring Cloud Gateway (:8080) — routing, CORS, JWT filter' },
          { name: 'auth-service/', type: 'dir', phase: 'Phase 2', description: 'Identity, BCrypt, JWT generation/validation, refresh tokens (:8081)' },
          { name: 'patient-service/', type: 'dir', phase: 'Phase 3', description: 'Patient CRUD, pagination/sorting, service requests (:8082)' },
          { name: 'doctor-service/', type: 'dir', phase: 'Phase 3', description: 'Doctor directory, specializations, availability slots (:8083)' },
          { name: 'appointment-service/', type: 'dir', phase: 'Phase 4', description: 'Booking, cancellation, reschedule, overlap guard (:8084)' },
          { name: 'notification-service/', type: 'dir', phase: 'Phase 5', description: 'In-app & appointment event notification inbox (:8085)' },
          { name: 'ai-assistant-service/', type: 'dir', phase: 'Phase 6', description: 'Spring AI 1.1.8 + OpenAI safe assistant & summarization (:8086)' },
        ],
      },
      {
        name: 'frontend/',
        type: 'dir',
        phase: 'Phase 7',
        description: 'React SPA client application',
        children: [
          { name: 'healthcare-ui/', type: 'dir', phase: 'Phase 7', description: 'Vite + React + Tailwind + Axios + React Router + 16 pages' },
        ],
      },
      {
        name: 'database/',
        type: 'dir',
        phase: 'Phase 1',
        description: 'PostgreSQL 16 schema and seed scripts',
        children: [
          { name: 'schema.sql', type: 'file', phase: 'Phase 1', description: '5 isolated schemas, 10 tables, constraints, indexes, triggers' },
          { name: 'sample-data.sql', type: 'file', phase: 'Phase 1', description: 'Development-only sample doctors, patients, appointments' },
        ],
      },
      {
        name: 'docker/',
        type: 'dir',
        phase: 'Phase 8',
        description: 'Container initialization and reverse-proxy assets',
        children: [
          { name: 'postgres-init/', type: 'dir', phase: 'Phase 8', description: 'Mounts schema.sql on initial container boot' },
          { name: 'nginx/', type: 'dir', phase: 'Phase 8', description: 'SPA routing config for production frontend container' },
        ],
      },
      {
        name: 'docs/',
        type: 'dir',
        phase: 'Phases 1 & 9',
        description: 'Architecture, database, and REST API guides',
        children: [
          { name: 'architecture.md', type: 'file', phase: 'Phase 1', description: 'Microservice topology, RestClient flows, security & AI rules' },
          { name: 'database-design.md', type: 'file', phase: 'Phase 1', description: 'ER diagram, schema ownership, double-booking prevention' },
          { name: 'api-documentation.md', type: 'file', phase: 'Phase 9', description: 'Complete 15+ REST endpoint reference with examples' },
        ],
      },
      { name: '.env.example', type: 'file', phase: 'Phase 1', description: 'Environment variable template (no secrets committed)' },
      { name: '.gitignore', type: 'file', phase: 'Phase 1', description: 'Ignores target/, node_modules/, .env, and IDE files' },
      { name: 'docker-compose.yml', type: 'file', phase: 'Phase 8', description: 'Orchestrates Postgres, 7 backend services, and React UI' },
      { name: 'README.md', type: 'file', phase: 'Phase 9', description: 'Portfolio documentation, setup, screenshots, and interview guide' },
    ],
  },
];

export const SCHEMA_SQL_PREVIEW = `-- ==============================================================================
-- AI-Powered Healthcare Service Management Platform — PostgreSQL 16 Schema
-- ==============================================================================
CREATE SCHEMA IF NOT EXISTS auth_schema;
CREATE SCHEMA IF NOT EXISTS patient_schema;
CREATE SCHEMA IF NOT EXISTS doctor_schema;
CREATE SCHEMA IF NOT EXISTS appointment_schema;
CREATE SCHEMA IF NOT EXISTS notification_schema;

-- Partial unique index preventing concurrent active double-bookings per doctor:
CREATE UNIQUE INDEX IF NOT EXISTS uq_doctor_active_slot
    ON appointment_schema.appointments (doctor_id, appointment_date, start_time)
    WHERE status IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULED');

-- Full script generated at: healthcare-platform/database/schema.sql`;
