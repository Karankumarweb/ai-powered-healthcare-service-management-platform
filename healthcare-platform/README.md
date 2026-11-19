# CareFlow AI — Healthcare Service Management Platform

A production-style microservices healthcare platform built with **Java 17**, **Spring Boot 3.4.5**, **Spring Cloud Gateway**, **Spring Security + JWT**, **PostgreSQL 16**, **Spring AI 1.1.8 (OpenAI)**, **React + Vite + Tailwind CSS**, and **Docker Compose**.

## Features
- **Authentication & RBAC**: BCrypt password hashing, stateless JWT access tokens, rotating PostgreSQL refresh tokens, logout revocation, and `ROLE_ADMIN`, `ROLE_DOCTOR`, `ROLE_PATIENT` guards.
- **Patient & Doctor Services**: Full CRUD, keyword search, sorting, pagination, specialization filtering, and weekly availability windows.
- **Appointment Scheduling**: Synchronous `RestClient` verification against Patient & Doctor services, transactional overlap check, and PostgreSQL partial unique index (`uq_doctor_active_slot`) to prevent double booking.
- **Notification Center**: Automatic in-app booking and cancellation alerts with unread tracking.
- **Safe AI Healthcare Assistant**: Spring AI + OpenAI integration with regex PII redaction, non-diagnostic system prompts, structured service-request summaries, and medical disclaimers.
- **16-Page React Healthcare SaaS UI**: Role-based dashboards, appointment booking, directory, notifications, service requests, and AI assistant chat.

## Running with Docker Compose (PostgreSQL 16)
1. Copy `.env.example` to `.env` and populate `POSTGRES_PASSWORD`, `JWT_SECRET`, and `OPENAI_API_KEY` (leave `SPRING_PROFILES_ACTIVE` unset or `default` for Docker PostgreSQL).
2. Start all containers:
   ```bash
   docker compose up --build -d
   ```
3. Access:
   - Frontend UI: `http://localhost:3000`
   - API Gateway: `http://localhost:8080/api/v1`

## Running Locally with MySQL 9.0 (MySQL Workbench)
1. Open **MySQL Workbench** and connect to `Local instance MySQL90` (`root@localhost:3306`).
2. Run `database/mysql-schema.sql` followed by `database/mysql-sample-data.sql` to create the five service databases (`auth_schema`, `patient_schema`, `doctor_schema`, `appointment_schema`, `notification_schema`) and seed sample records.
3. Copy `.env.example` to `.env` and set:
   - `SPRING_PROFILES_ACTIVE=mysql`
   - `MYSQL_HOST=localhost`
   - `MYSQL_PORT=3306`
   - `MYSQL_USER=root`
   - `MYSQL_PASSWORD=<your_local_mysql_password>`
   - `JWT_SECRET=<your_base64_256bit_secret>`
4. Load `.env` into your shell environment and start each microservice with the `mysql` Spring profile (`-Dspring-boot.run.profiles=mysql` or `SPRING_PROFILES_ACTIVE=mysql`).

## Running Backend Unit & Integration Tests
```bash
for svc in api-gateway auth-service patient-service doctor-service appointment-service notification-service ai-assistant-service; do
  (cd backend/$svc && mvn test)
done
```
