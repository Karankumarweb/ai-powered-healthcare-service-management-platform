# REST API Documentation (18 Endpoints)

Base URL via API Gateway: `http://localhost:8080/api/v1`

## Auth Service (`/auth`)

1. **POST `/api/v1/auth/register`** (Public) — `201 Created`
   - Request: `{ "fullName": "Maya Lin", "email": "maya@careflow.local", "password": "Password123!", "role": "PATIENT" }`
   - Response: `{ "accessToken": "...", "refreshToken": "...", "tokenType": "Bearer", "expiresInMs": 900000, "user": { ... } }`
2. **POST `/api/v1/auth/login`** (Public) — `200 OK`
   - Request: `{ "email": "patient.miller@careflow.local", "password": "..." }`
3. **POST `/api/v1/auth/refresh`** (Public with Refresh Token) — `200 OK`
4. **POST `/api/v1/auth/logout`** (`Bearer JWT`) — `200 OK`
5. **GET `/api/v1/auth/me`** (`Bearer JWT`) — `200 OK`
6. **PUT `/api/v1/auth/me`** (`Bearer JWT`) — `200 OK`

## Patient & Service Request Service (`/patients`, `/service-requests`)

7. **POST `/api/v1/patients`** (`ADMIN`, `PATIENT`) — `201 Created`
8. **GET `/api/v1/patients?query=&page=0&size=10&sortBy=lastName&sortDir=asc`** (`ADMIN`, `DOCTOR`) — `200 OK`
9. **GET `/api/v1/patients/{id}`** (`ADMIN`, `DOCTOR`, `PATIENT`) — `200 OK`
10. **PUT `/api/v1/patients/{id}`** (`ADMIN`, `PATIENT`) — `200 OK`
11. **DELETE `/api/v1/patients/{id}`** (`ADMIN`) — `204 No Content`
12. **POST `/api/v1/service-requests`** (`PATIENT`, `ADMIN`) — `201 Created`
13. **GET `/api/v1/service-requests`** (`ADMIN`, `DOCTOR`) — `200 OK`
14. **PATCH `/api/v1/service-requests/{id}/status`** (`ADMIN`, `DOCTOR`) — `200 OK`

## Doctor Service (`/doctors`)

15. **GET `/api/v1/doctors?specialization=Cardiology&query=&page=0&size=12`** (Public) — `200 OK`
16. **POST `/api/v1/doctors`** (`ADMIN`, `DOCTOR`) — `201 Created`
17. **PUT `/api/v1/doctors/{id}/availability`** (`ADMIN`, `DOCTOR`) — `200 OK`

## Appointment Service (`/appointments`)

18. **POST `/api/v1/appointments`** (`PATIENT`, `ADMIN`) — `201 Created` / `409 Conflict` on double booking
19. **GET `/api/v1/appointments/patient/{patientId}`** (`PATIENT`, `DOCTOR`, `ADMIN`) — `200 OK`
20. **GET `/api/v1/appointments/doctor/{doctorId}`** (`DOCTOR`, `ADMIN`) — `200 OK`
21. **PATCH `/api/v1/appointments/{id}/reschedule`** (`PATIENT`, `DOCTOR`, `ADMIN`) — `200 OK`
22. **PATCH `/api/v1/appointments/{id}/cancel`** (`PATIENT`, `DOCTOR`, `ADMIN`) — `200 OK`

## Notification Service (`/notifications`)

23. **GET `/api/v1/notifications/my`** (`Bearer JWT`) — `200 OK`
24. **PATCH `/api/v1/notifications/{id}/read`** (`Bearer JWT`) — `200 OK`

## AI Assistant Service (`/ai`)

25. **POST `/api/v1/ai/chat`** (`Bearer JWT`) — `200 OK`
26. **POST `/api/v1/ai/summarize-request`** (`Bearer JWT`) — `200 OK`
