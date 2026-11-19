# System Architecture — AI-Powered Healthcare Service Management Platform

## 1. Architectural Overview

The platform uses a **Spring Boot 3.4 + Java 17 Microservices Architecture** behind a single **Spring Cloud Gateway** entry point, paired with a **React + Vite** single-page application and a **PostgreSQL 16** database organized using the **Schema-per-Service** pattern.

### Verified Compatible Stack
- **Java**: 17 LTS
- **Spring Boot**: 3.4.5
- **Spring Cloud**: 2024.0.1 (Moorgate)
- **Spring AI**: 1.1.8 (Spring AI 1.x stream for Spring Boot 3.x + Java 17)
- **PostgreSQL**: 16
- **JJWT**: 0.12.6
- **Springdoc OpenAPI**: 2.8.5
- **Frontend**: React 18+, Vite, Tailwind CSS, Axios, React Router, Lucide React

## 2. Microservices & Responsibilities

| Service | Port | Schema Ownership | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| **api-gateway** | `8080` | None (stateless) | Single entry point, CORS, rate limiting, JWT signature pre-validation, routing `/api/v1/**` |
| **auth-service** | `8081` | `auth_schema` | User registration, BCrypt password hashing, JWT access + refresh token issuance, RBAC, logout/revocation |
| **patient-service** | `8082` | `patient_schema` | Patient profiles CRUD, search/pagination/sorting, healthcare service request intake |
| **doctor-service** | `8083` | `doctor_schema` | Doctor profiles CRUD, specialization search, weekly availability slot management |
| **appointment-service** | `8084` | `appointment_schema` | Booking, rescheduling, cancellation, doctor availability verification, overlap/double-booking prevention |
| **notification-service** | `8085` | `notification_schema` | In-app notification inbox, appointment confirmations, cancellations, reminders, delivery audit log |
| **ai-assistant-service** | `8086` | None (stateless) | Spring AI + OpenAI conversational assistant, FAQ guidance, structured service-request summaries, strict medical guardrails |

## 3. Inter-Service Communication Flow

All external client traffic goes strictly through the **API Gateway (`:8080`)**:

```
React SPA (:5173 / :3000)
        │  HTTPS + Authorization: Bearer <JWT>
        ▼
API Gateway (:8080)
  ├── /api/v1/auth/**          ──► auth-service (:8081)
  ├── /api/v1/patients/**      ──► patient-service (:8082)
  ├── /api/v1/service-requests/** ► patient-service (:8082)
  ├── /api/v1/doctors/**       ──► doctor-service (:8083)
  ├── /api/v1/appointments/**  ──► appointment-service (:8084)
  ├── /api/v1/notifications/** ──► notification-service (:8085)
  └── /api/v1/ai/**            ──► ai-assistant-service (:8086)
```

### Synchronous REST Service-to-Service Calls (`RestClient`)
1. **Booking an Appointment**:
   - `appointment-service` verifies the patient exists via `GET patient-service/api/v1/patients/{id}`.
   - `appointment-service` verifies doctor & working hours via `GET doctor-service/api/v1/doctors/{id}/availability`.
   - `appointment-service` checks local DB for overlapping slots (`SCHEDULED`/`CONFIRMED`/`RESCHEDULED`) using pessimistic/transactional checks + PostgreSQL partial unique index.
   - Upon commit, `appointment-service` calls `POST notification-service/api/v1/notifications` to create confirmation records.
2. **AI Service Request Summarization**:
   - `ai-assistant-service` accepts de-identified text (no names, SSNs, DOBs, or raw PII), applies prompt templates + medical disclaimer guardrails via Spring AI `ChatClient`, and returns structured JSON summaries.

## 4. Security & Privacy Architecture

- **Stateless JWT Authentication**: `auth-service` signs access tokens (15 min TTL) with HMAC-SHA256 (`JWT_SECRET` from env) and stores rotating `refresh_tokens` in `auth_schema.refresh_tokens` so logout immediately revokes refresh capability.
- **Role-Based Access Control (RBAC)**: `ROLE_ADMIN`, `ROLE_DOCTOR`, `ROLE_PATIENT` enforced both at gateway/filter level and via `@PreAuthorize` on controller methods.
- **AI Privacy & Clinical Safety**:
  - OpenAI API key lives exclusively inside `ai-assistant-service` environment variables—never in React.
  - System prompts explicitly prohibit diagnosing conditions, prescribing medications, or replacing licensed clinicians.
  - Patient PII is stripped before outbound LLM calls; responses always carry a visible medical disclaimer.
