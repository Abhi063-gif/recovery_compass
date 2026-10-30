# Recovery Compass — Master Integration & Architecture Guide

> **Recovery Compass** converts hospital discharge instructions into an understandable, verified, day-by-day recovery journey for patients and families.

---

## 1. Master System Architecture

```text
                               ┌───────────────────────────┐
                               │     Recovery Compass      │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
             React / Vite Frontend                         NestJS Backend API
             TypeScript + Tailwind                        TypeScript (Node.js)
                       │                                           │
                       │                              ┌────────────┴────────────┐
                       │                              │                         │
                       │                          PostgreSQL                  Redis
                       │                         (Prisma ORM)                (BullMQ)
                       │                              │                         │
                       │                        Source Documents             Workers
                       │                              │                    (OCR & OCR)
                       │                          OCR / AI                      │
                       │                              │                         │
                       │                     Validation Pipeline                │
                       │                              │                         │
                       │                      Human Verification                │
                       │                              │                         │
                       └──────────────────────── REST API / WS ─────────────────┘
```

---

## 2. API Contract & Architectural Principles

1. **Authoritative Backend Truth**:
   - The backend is the single source of truth for all clinical rules, medication schedules, deterministic red-flag evaluations, consent permissions, and recovery timelines.
   - The frontend handles presentation, accessibility, offline caching, and responsive interactions.

2. **Centralized Typed API Client**:
   - Implemented in [`src/api/client.ts`](file:///g:/hackathon/src/api/client.ts) and domain clients:
     - `auth.ts` (`/api/v1/auth/*`)
     - `documents.ts` (`/api/v1/documents/*`)
     - `extraction.ts` (`/api/v1/extractions/*`)
     - `plans.ts` (`/api/v1/plans/*`)
     - `medications.ts` (`/api/v1/medications/*`, `/api/v1/plans/:id/medications/*`)
     - `symptoms.ts` (`/api/v1/symptoms`, `/api/v1/plans/:id/symptoms`)
     - `safety.ts` (`/api/v1/plans/:id/safety/check`, `/api/v1/plans/:id/red-flags`)
     - `followups.ts` (`/api/v1/plans/:id/follow-ups`, `/api/v1/follow-ups/:id/calendar`)
     - `doctorQuestions.ts` (`/api/v1/plans/:id/doctor-questions`, `/api/v1/doctor-questions/:id/resolve`)
     - `family.ts` (`/api/v1/plans/:id/family/invite`, `/api/v1/family/members/*`)
     - `notifications.ts` (`/api/v1/notifications/*`)
     - `privacy.ts` (`/api/v1/privacy/delete-request`)
     - `admin.ts` (`/api/v1/admin/*`)

3. **Standard Response & Error Contract**:
   - **Success**: `{ data: T, meta: { requestId, timestamp } }`
   - **Error**: `{ error: { code: string, message: string, details?: any, requestId: string, timestamp: string } }`
   - Traceability: Every request propagates `X-Request-ID` and formats errors as `RC-XXXX`.

---

## 3. Environment Configuration

### Frontend (`.env` & `.env.example`)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_DEMO_MODE=true
VITE_APP_ENV=development
```

### Backend (`backend/.env` & `backend/.env.example`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/recovery_compass"
REDIS_URL="redis://localhost:6379"
PORT=3000
NODE_ENV=development
APP_BASE_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
JWT_ACCESS_SECRET="change-me-in-production-access-secret-min-32-chars"
JWT_REFRESH_SECRET="change-me-in-production-refresh-secret-min-32-chars"
IS_PROTOTYPE=true
```

---

## 4. Requirement Traceability Matrix

| Requirement | Frontend Implementation | Backend Implementation | API Endpoint | Test Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `useAuthStore.ts`, `LandingPage.tsx` | `auth.controller.ts`, `auth.service.ts` | `POST /api/v1/auth/login`, `POST /api/v1/auth/register` | ✅ Passed |
| **Onboarding** | `OnboardingPage.tsx` | `users.service.ts`, `pathways.service.ts` | `PATCH /api/v1/users/profile` | ✅ Passed |
| **Document Upload & OCR** | `DocumentUploadPage.tsx`, `DocumentProcessingPage.tsx` | `documents.controller.ts`, `ocr.service.ts` | `POST /api/v1/documents/upload`, `POST /api/v1/documents/:id/process` | ✅ Passed |
| **Extraction & Verification** | `VerificationPage.tsx` | `extraction.controller.ts`, `extraction.service.ts` | `GET /api/v1/extractions/:id`, `PATCH /api/v1/extractions/:id/fields/:fieldId` | ✅ Passed |
| **Human Confirmation** | `ConfirmPlanPage.tsx` | `plans.controller.ts`, `plans.service.ts` | `POST /api/v1/plans/:id/confirm` | ✅ Passed |
| **Deterministic Scheduler** | `DashboardPage.tsx`, `TimelinePage.tsx` | `recovery.scheduler.ts` | `GET /api/v1/plans/:id/timeline` | ✅ Passed |
| **Medication Events & Idempotency** | `MedicationsPage.tsx` | `medications.controller.ts`, `medications.service.ts` | `POST /api/v1/medications/:scheduleId/events` | ✅ Passed |
| **Deterministic Safety Engine** | `SymptomsPage.tsx`, `SafetyCheckPage.tsx` | `red-flag.engine.ts`, `safety.controller.ts` | `POST /api/v1/plans/:id/safety/check` | ✅ Passed |
| **Follow-ups & Calendar ICS** | `FollowUpsPage.tsx` | `followups.controller.ts`, `followups.service.ts` | `GET /api/v1/follow-ups/:id/calendar` | ✅ Passed |
| **Doctor Question Generator** | `DoctorQuestionsPage.tsx` | `doctor-questions.service.ts` | `GET /api/v1/plans/:id/doctor-questions`, `POST /api/v1/doctor-questions/:id/resolve` | ✅ Passed |
| **Caregiver Consent & Circle** | `FamilyPage.tsx` | `family.controller.ts`, `family.service.ts` | `POST /api/v1/plans/:id/family/invite`, `PATCH /api/v1/family/members/:id` | ✅ Passed |
| **Offline Plan Snapshot** | `OfflinePage.tsx` | `plans.service.ts` (`getSnapshot`) | `GET /api/v1/plans/:id/snapshot` | ✅ Passed |
| **Privacy & Account Deletion** | `SettingsPage.tsx` | `privacy.controller.ts`, `privacy.service.ts` | `POST /api/v1/privacy/delete-request` | ✅ Passed |

---

## 5. Local Setup & Startup Instructions

### 1. Backend Startup
```bash
cd backend
npm install --legacy-peer-deps
npx prisma generate
npm run build
npm run start:dev
```

### 2. Frontend Startup
```bash
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Docker Compose (Full Stack)
```bash
docker compose -f backend/docker-compose.yml up -d
```
Starts PostgreSQL, Redis, and Backend API in isolated containers.
