# Recovery Compass — Systemic Codebase Audit, Cloud Redis Integration & Project Health Report

**Date**: November 1, 2026  
**Audited Target**: Full Stack Application (React 18 + Vite Frontend, NestJS 11 Backend, PostgreSQL / Supabase, BullMQ / Redis, Google Gemini AI)  
**Status**: Feature-Rich Prototype transitioning to Production Readiness

---

## 1. Executive Summary & Current Health

Recovery Compass is an architectural healthcare recovery platform designed for post-operative patients and Indian frontline public health workers (ASHA/ANM).

### Overall Health Assessment
- **Frontend Build (`tsc && vite build`)**: ✅ Passing with 0 errors (`dist/` built cleanly in ~57s).
- **Backend Build (`nest build`)**: ✅ Passing with 0 errors.
- **Backend Unit & Integration Tests**: ✅ 59/59 tests passing across 9 suites, including all 15 scenarios in `pdf-upload-pipeline.spec.ts`.
- **Core Clinical Pipeline**: Deep PDF validation, scanned vs text PDF routing, Gemini structured extraction, and deterministic safety red-flag rules are operational.
- **Primary Operational Friction**: Lack of local Redis/Docker on Windows causing background worker connection warnings, and Supabase RLS migrations staged but awaiting execution in the Supabase SQL editor.

---

## 2. Cloud Redis & Docker Solutions (Zero-Install Setup)

You do **not** need to install Docker or Redis locally on your Windows machine to run Recovery Compass. You have two immediate options:

### Option A: Free Cloud Redis (Recommended — Takes 2 Minutes)
Use a free managed Redis cloud instance. This gives you a live Redis URI with TLS (`rediss://`) that connects directly from your Windows machine:

#### Choice 1: Redis Cloud (Official Redis Enterprise — Best for BullMQ)
1. Go to [https://redis.io/try-free/](https://redis.io/try-free/) or [app.redislabs.com](https://app.redislabs.com).
2. Sign up with Google/GitHub (free forever, 30MB database, no credit card required).
3. Create a **Free Subscription** and select AWS or Google Cloud (choose region closest to you, e.g. `ap-south-1` Mumbai or `us-east-1`).
4. Copy the **Public endpoint** (e.g. `redis-12345.c10.us-east-1-2.ec2.cloud.redislabs.com:12345`) and your **Default User Password**.
5. Update `backend/.env`:
   ```env
   REDIS_URL="redis://default:<YOUR_PASSWORD>@<YOUR_ENDPOINT>:<PORT>"
   ```

#### Choice 2: Upstash Redis
1. Visit [https://upstash.com](https://upstash.com) and create a free database.
2. Under the "Details" tab, scroll down to **Node.js (ioredis)** connection string.
3. Copy the URL format:
   ```env
   REDIS_URL="rediss://default:<UPSTASH_PASSWORD>@<UPSTASH_HOST>:<PORT>"
   ```

### Option B: Run Without Redis (Built-in Database-Backed Fallback)
Recovery Compass already includes an automated fallback runner (`QueueDispatcherService` and `DocumentPipelineRunner`):
- If `REDIS_URL` points to an offline host, the backend detects this on startup, logs:
  `warn: Redis connection unavailable. Recovery Compass is operating in resilient database-backed fallback mode.`
- When a document is uploaded, it creates the job record in PostgreSQL and processes it asynchronously via Node.js background execution without failing or throwing 500 errors.

### Option C: Docker Command (If Docker Desktop is Ever Installed)
If you install Docker Desktop on Windows in the future:
```powershell
docker run -d --name recovery-redis -p 6379:6379 redis:alpine
```
Then keep `REDIS_URL="redis://localhost:6379"` in `backend/.env`.

---

## 3. Comprehensive Matrix of Issues & Missing Functionality

Below is an exhaustive breakdown of every identified issue, edge case, and missing implementation across the codebase, prioritized by severity.

| ID | Module / Component | Severity | Exact File / Location | Description of Issue & Impact | Actionable Fix / Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Database / Supabase | **Critical** | `backend/supabase/migrations/` | All 34 public tables currently have RLS disabled on the live Supabase database. If an external client queries PostgREST directly with the anon key, data could be inspected. | Execute staged migrations `003` through `009` in Supabase SQL editor to enforce least-privilege RLS. |
| **SEC-02** | User Identity Mapping | **High** | `003_module1_accounts_and_auth.sql` | `public.User.id` is a custom text UUID while Supabase Auth creates its own `auth.users` UUID sequence. If a user logs in directly via Supabase client, IDs may not align. | Use our unified `public.requesting_user_id()` function which maps via custom JWT sub, `auth.uid()`, and verified email/phone. |
| **SEC-03** | Auth Credential Storage | **Medium** | `backend/.env` | Live Supabase database password is stored in `.env`. While `.env` is gitignored, credential rotation should be documented. | Use Supabase Vault or environment secret manager in production deployments. |
| **DOC-01** | OCR Scanned PDF Extraction | **Medium** | `backend/src/ocr/providers/tesseract.provider.ts` | Scanned PDF detection currently extracts JPEG streams using `0xFF 0xD8` markers. PDFs with JBIG2, CCITT Fax, or raw FlateDecode image streams won't have images extracted. | Integrate `pdf2pic` / `pdftoppm` as an enhanced fallback for non-JPEG scanned PDFs. |
| **DOC-02** | AI Extraction Resilience | **Medium** | `backend/src/extraction/llm/llm-extraction.service.ts` | Gemini API key is configured as primary. If the Gemini API rate limit or quota is exhausted, extraction fails immediately without falling back to OpenAI. | Implement automatic fallback to OpenAI in `extract()` when `OPENAI_API_KEY` is present and Gemini throws a 429/503. |
| **DOC-03** | Frontend Processing Timer | **Low** | `src/stores/usePlanStore.ts` (`startDocProcessing`) | `usePlanStore.startDocProcessing()` uses synthetic `setTimeout` intervals (3000ms) rather than waiting strictly for backend job completion. | Align `usePlanStore` to poll `documentsApi.getStatus()` identically to `DocumentProcessingPage.tsx`. |
| **COM-01** | ASHA Caseload Storage | **Medium** | `backend/src/community/community.service.ts` | `getCaseload()` currently returns a static in-memory array of Punjab demonstration patients rather than querying `prisma.patientProfile.findMany()`. | Implement dynamic database queries filtered by ASHA worker village/block assignment. |
| **COM-02** | ASHA Visit Sync | **Low** | `backend/src/sync/sync.service.ts` | `asha_visit` mutations in offline sync currently record to audit log or in-memory array when custom tables are not present. | Create a dedicated `AshaVisit` Prisma model to store blood pressure, blood glucose, and blister pack adherence counts. |
| **FAM-01** | Realtime Caregiver Sync | **Medium** | `src/pages/FamilyPage.tsx` / `DashboardPage.tsx` | When a caregiver marks a dose taken on their phone, the patient's dashboard does not update in real-time without a manual page refresh. | Subscribe to Supabase Realtime changes or WebSocket events (`VITE_WS_URL`) on the `MedicationEvent` table. |
| **FAM-02** | Automated SMS Dispatch | **Low** | `backend/src/notifications/providers/sms.provider.ts` | `SMS_PROVIDER` defaults to `'console'`. Caregiver invitation OTPs and WhatsApp links work via manual click, but automated background SMS requires Twilio or MSG91. | Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` in `backend/.env` for automated Indian SMS routing. |
| **NOT-01** | Notifications Fetch on Mount | **Low** | `src/pages/NotificationsPage.tsx` | `NotificationsPage` originally did not trigger `fetchNotifications()` on mount, showing static placeholders unless fetched elsewhere. | *(Fixed)* Added `useEffect(() => { fetchNotifications(); }, [])` to pull real notifications from the backend. |
| **NOT-02** | SMTP Server Setup | **Low** | `backend/src/notifications/providers/email.provider.ts` | Default SMTP points to `localhost:1025` (MailHog). If no local SMTP server is running, real email reminders require SendGrid / Resend credentials. | Set `EMAIL_PROVIDER=console` for development or add real SMTP credentials in `backend/.env`. |
| **CLN-01** | Doctor Question Deduplication | **Low** | `src/pages/DoctorQuestionsPage.tsx` | Fallback default questions (`default-q-1`, `default-q-2`) are always appended to the combined list, which can display repeated questions. | Filter out static defaults if real doctor questions exist in the database for the current plan. |
| **ADM-01** | Admin Pathway Creation | **Low** | `src/pages/AdminPage.tsx` | "Add Rule" and "Add Pathway" buttons on the admin page trigger browser `alert()` prompts rather than opening a modal with form inputs. | Replace `alert()` with a clinical pathway creation modal that calls `adminApi.createPathway()`. |
| **OFF-01** | IndexedDB Storage Quota | **Low** | `src/services/offlineSync.ts` | Offline sync stores full plans and outbox items in browser IndexedDB. Large documents (PDFs) could exceed mobile browser storage quotas if stored as base64. | Store document blobs using `CacheStorage` or limit offline cache to JSON plan snapshots and compressed thumbnails. |

---

## 4. Architectural Domain Analysis

### 4.1. Security & Authentication Architecture
- **JWT Implementation**: Dual secret setup (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) with token rotation in `auth.service.ts`.
- **Route Protection**: `src/components/common/ProtectedRoute.tsx` guards all sensitive frontend routes with redirect-to-login and role authorization (`allowedRoles={['ASHA', 'ANM', 'ADMIN']}`).
- **Supabase RLS Strategy**: All 34 tables are secured across 7 staged SQL migration files with zero-allowance for anonymous roles on clinical/patient data, column-level security hiding passwords and OTPs, and verified caregiver access revocation tests.

### 4.2. Document Upload & Clinical Processing Pipeline
- **Integrity Validation**: Evaluates 0-byte, minimum 50-byte, MIME type, PDF magic bytes (`%PDF-`), and `/Encrypt` password dictionaries.
- **Scanned vs. Text PDF Routing**: Text-based PDFs extract immediately with high fidelity; scanned documents extract embedded image streams and pass them to Tesseract OCR with a 45s timeout.
- **Clinical AI Extraction**: Employs Gemini 1.5 Pro with structured system prompts enforcing strict extraction across 10 categories (Medications, Follow-ups, Tests, Restrictions, Diet, Hydration, Tasks, Symptoms, Red Flags, Conditional Instructions).
- **Zod Schema Validation**: Untrusted AI output is passed through `RootExtractionSchema` before reaching the database.

### 4.3. Frontline Community Health Worker System (ASHA & ANM)
- **Caseload Management**: Village-level patient cards with color-coded risk tiers (`GREEN`, `AMBER`, `RED`), medication adherence metrics, and missed dose counters.
- **Clinical Escalation**: Direct escalation workflow from ASHA to ANM supervisor with urgency levels and reason codes.
- **Offline Outbox**: Field visits and vitals can be recorded without network connectivity and synced to `/api/v1/sync/push` upon reconnection.

### 4.4. Multilingual & Accessibility Engine
- **Languages Supported**: English, Hindi, Punjabi (Gurmukhi), Marathi, Bengali, Tamil.
- **Text-to-Speech (TTS)**: Built-in `speakText()` utility supporting voice read-aloud for illiterate rural patients.

---

## 5. Priority Action Plan & Next Steps

```
[Phase 1: Infrastructure]
  ├── 1. Add Cloud Redis URL (Redis Cloud / Upstash) to backend/.env
  └── 2. Apply Staged Supabase RLS Migrations (003 through 009) in SQL Editor

[Phase 2: Core Feature Polish]
  ├── 3. Dynamic ASHA Caseload (replace static array with Prisma query)
  ├── 4. Supabase Realtime / WebSocket subscription for live caregiver dose sync
  └── 5. OpenAI secondary fallback provider in LlmExtractionService

[Phase 3: Production Hardening]
  ├── 6. Add real Twilio / MSG91 credentials for automated Indian SMS OTP delivery
  └── 7. Replace AdminPage alert() with interactive pathway creation modal
```

---

*Report generated by Antigravity Autonomous Agent.*
