# Recovery Compass — Comprehensive Web Tester Quality Audit & Action Plan
**Project:** Rural Health Recovery & Care Navigation Platform (Smart India Hackathon SIH26133)  
**Standard:** PRD v3.0 & Architecture Specifications  
**Tester Role:** Principal Web QA Engineer & Full-Stack Systems Tester  
**Date:** 2026-10-30  

---

## 1. Executive Summary & Audit Overview

A comprehensive, end-to-end web testing audit was performed across the entire Recovery Compass codebase—testing every page, store, API contract, offline data flow, database schema, role-based access rule, and clinical pathway.

### The Disconnect Between `PROJECT_AUDIT.md` and Reality
The previous audit report (`PROJECT_AUDIT.md`) contained an executive summary pointing out that the frontend is largely disconnected from the backend. However, in its Feature Status Matrix, it prematurely marked 30+ items as `WORKING` and `[COMPLETED]`. 

Our code-level and dynamic testing reveals that while both TypeScript projects compile cleanly (`tsc && vite build` and `nest build` succeed), **major core workflows are disconnected, using mock stubs, or crippled by contract typos and RBAC blocks**:
1. **Critical Safety Engine Typo:** Red-flag alerts never fire in the UI because the frontend checks `result.hasRedFlag` while the backend returns `result.hasRedFlags` (plural).
2. **Medication Schedule 404 Bug:** `recordMedicationAction` passes medication ID instead of schedule ID to the backend, failing with 404 for every dose recorded.
3. **ASHA and ANM Portals Are Completely Isolated:** `AshaDashboardPage` and `AnmDashboardPage` have zero API calls; they operate strictly on static mock state. Furthermore, the backend `CommunityController` lacks URI versioning (`@Controller('community')`), so it does not match `/api/v1/community`.
4. **Document Ingestion Bypassed:** Document upload navigates to a hardcoded ID (`/documents/processing/doc-90284`) without uploading the file, and `VerificationPage` displays hardcoded mock data from Zustand rather than fetching extracted fields from the backend.
5. **Onboarding Data Is Discarded:** The 5-step onboarding flow collects patient profile, care pathway, and dates, but discards them completely upon clicking "Proceed to Upload".
6. **Offline IndexedDB Storage Engine Disconnected:** `offlineStorage` (the IndexedDB engine with outbox) is defined in `offlineSync.ts` but is never imported or called by any store or page.
7. **Multilingual Localization Inactive:** 100% of the UI remains in English because `TRANSLATIONS` in `i18n.ts` is never referenced in any page or component, and Marathi was omitted from Onboarding.
8. **US Emergency Numbers Instead of Indian Public Health:** UI references 911 and US sample phone numbers instead of 108 (Ambulance), 104 (Health Helpline), and 112.

---

## 2. Feature & Functionality Verification Matrix

| Functionality Area | Reported Status | Verified QA Status | Root Cause & Bottleneck |
| :--- | :--- | :--- | :--- |
| **Frontend Compilation** | WORKING | ✅ **VERIFIED** | Clean build via Vite (1,888 modules, 950 kB bundle). |
| **Backend Compilation** | WORKING | ✅ **VERIFIED** | Clean build via NestJS CLI. |
| **Authentication Flow** | WORKING | ⚠️ **PARTIAL** | Email/password works, but lacks Phone + PIN support mandated by PRD v3.0 for rural low-literacy users. Demo personas use US names. |
| **Onboarding Flow** | WORKING | ❌ **CRITICAL BUG** | Collects pathway & dates across 5 steps but discards them on submit without saving to store, DB, or localStorage. Marathi omitted from language options. |
| **Document Upload UI** | WORKING | ❌ **CRITICAL BUG** | Hardcodes navigation to `/documents/processing/doc-90284` without uploading the selected file to `POST /api/v1/documents/upload`. |
| **OCR Progress & Polling** | WORKING | ⚠️ **PARTIAL** | Polling logic exists, but because upload was skipped, `doc-90284` 404s and triggers a fake timeout fallback. |
| **Verification Page** | WORKING | ❌ **DISCONNECTED** | Reads static extractions from Zustand store rather than calling `extractionApi.getById()`. Back button hardcoded to `plan-chole-90284`. |
| **Human Plan Confirmation** | WORKING | ⚠️ **PARTIAL** | `ConfirmPlanPage` sets local state, but calls `plansApi.confirm(plan.id)` without ensuring a valid backend plan ID. |
| **15-Day Recovery Timeline** | WORKING | ⚠️ **PARTIAL** | Shows days 1-15, but day selector content indicators check `currentDay` instead of each item's day. Never calls `plansApi.getTimeline()`. |
| **Today Dashboard View** | WORKING | ⚠️ **PARTIAL** | Renders tasks from store, but task checkbox toggles do not persist to `plansApi.updateTask()`. Displays "Call 911 / ER". |
| **Medication Tracking** | WORKING | ❌ **BROKEN CONTRACT** | Passes `medId` to `/medications/:scheduleId/events`, returning 404. "Calendars" tab click does nothing. Hardcodes "Today, 16 Apr 2026". |
| **Symptom Logging** | WORKING | ⚠️ **PARTIAL** | Logs pain and temp, but lacks pathway vitals (Blood Sugar for Diabetes, BP for Hypertension, Fetal Movement for Pregnancy). Chart uses hardcoded values. |
| **Safety Red-Flag Engine** | WORKING | ❌ **CRITICAL BUG** | Typo: Frontend checks `result.hasRedFlag` while backend returns `hasRedFlags`. Alerts never trigger. Emergency number defaults to 911. |
| **Follow-up Appointments** | WORKING | ⚠️ **PARTIAL** | Falls back to hardcoded `app-1` with 2026 date in calendar download fallback. |
| **Doctor Questions** | WORKING | ✅ **WORKING** | Resolves and adds questions; optimistic UI with backend sync. |
| **Family Caregiver Circle** | WORKING | ✅ **WORKING** | Invitations, OTP generation, and permissions work as designed. |
| **ASHA Worker Caseload** | WORKING | ❌ **DISCONNECTED** | Uses hardcoded `INITIAL_CASELOAD` array. Zero API calls to `CommunityController`. Backend route missing URI version prefix. |
| **ANM Supervisory Portal** | WORKING | ❌ **DISCONNECTED** | Uses hardcoded local state. Never calls `/api/v1/community/escalations`. |
| **ASHA RBAC Document Upload** | WORKING | ❌ **BLOCKED** | `DocumentsController` and `ExtractionController` restrict to `@Roles(UserRole.PATIENT)`, blocking ASHA workers from assisted document entry. |
| **Offline IndexedDB & Outbox** | WORKING | ❌ **DISCONNECTED** | `offlineStorage` in `offlineSync.ts` is never imported or called in any store or page. Sync endpoint missing URI version prefix. |
| **Calendar (.ics) Alarms** | WORKING | ✅ **WORKING** | Client-side RFC 5545 generator with VALARM alarms functions offline. |
| **Multilingual (i18n) & TTS** | WORKING | ❌ **NOT INTEGRATED** | TopBar language selector changes store variable, but zero pages call `TRANSLATIONS` or `getTranslation`. 100% of UI remains in English. |
| **Government Schemes Checker** | WORKING | ⚠️ **ISOLATED** | Questionnaire functions client-side, but is not linked to active patient profile or care pathway. |
| **Nearby Facilities Finder** | WORKING | ✅ **WORKING** | Offline Haversine formula and GPS coordinate distance calculation works. |

---

## 3. Detailed Breakdown of Bottlenecks & Solutions

The identified issues have been decomposed into 12 atomic, self-contained problems arranged in strict dependency order.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EXECUTION ROADMAP                               │
└────────────────────────────────────────────────────────────────────────┘
 [Prompt 01] Fix Backend Routing & Versioning (Sync & Community Controllers)
      │
 [Prompt 02] Fix RBAC Permissions for ASHA Assisted Registration & Upload
      │
 [Prompt 03] Fix Critical Safety Engine Contract Typo (hasRedFlags) & Indian Hotlines
      │
 [Prompt 04] Fix Medication Event Schedule ID & Tab View Inaction
      │
 [Prompt 05] Fix Document Upload & Real Processing Navigation Flow
      │
 [Prompt 06] Fix Verification Page to Load Real Extracted Fields from API
      │
 [Prompt 07] Fix Onboarding Flow to Persist Patient Data & Care Pathway
      │
 [Prompt 08] Connect ASHA & ANM Dashboards to Real Community API Endpoints
      │
 [Prompt 09] Connect Offline IndexedDB Engine & Outbox Pattern to Stores
      │
 [Prompt 10] Implement Pathway-Specific Vitals & Dynamic Charts in Symptoms
      │
 [Prompt 11] Connect Multilingual Translations & Marathi Across All Pages
      │
 [Prompt 12] Add Phone + PIN Authentication for Rural Low-Literacy Patients
```

---

## 4. Sequential Ready-to-Copy-Paste Prompts

Below are the exact, copy-paste prompts designed to resolve each bottleneck sequentially. Run them one after another.

---

### PROMPT 1 of 12: Fix Backend Routing & URI Versioning for Sync & Community Controllers

**Goal:** Ensure `SyncController` and `CommunityController` adhere to the global NestJS URI versioning (`/api/v1/...`).

```text
Please fix the URI versioning for SyncController and CommunityController in the backend.

1. In file `backend/src/sync/sync.controller.ts`:
   - Change `@Controller('sync')` to `@Controller({ path: 'sync', version: '1' })`.
   - Ensure the endpoints are accessible at `/api/v1/sync/push` and `/api/v1/sync/pull`.

2. In file `backend/src/community/community.controller.ts`:
   - Change `@Controller('community')` to `@Controller({ path: 'community', version: '1' })`.
   - Ensure endpoints are accessible at `/api/v1/community/caseload`, `/api/v1/community/visits`, `/api/v1/community/escalate`, and `/api/v1/community/escalations`.

3. In file `src/services/offlineSync.ts`:
   - Update line 134 from `fetch('/api/sync/push', ...)` to use the configured API client base URL or `(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1') + '/sync/push'`.
   - Add proper Authorization bearer header from localStorage if available.

Run `npm run build` in `backend` to verify compilation.
```

---

### PROMPT 2 of 12: Allow ASHA & ANM Roles for Document Upload & Extraction Verification

**Goal:** Enable ASHA workers to perform assisted patient registration and prescription uploads (PRD v3.0 C6).

```text
Please update the backend Role-Based Access Control (RBAC) on document upload and extraction verification endpoints so that ASHA workers can assist low-literacy rural patients.

1. In file `backend/src/documents/documents.controller.ts`:
   - On `@Post('upload')`, change `@Roles(UserRole.PATIENT)` to `@Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)`.
   - Update the method to check if the user is an ASHA worker; if so, accept an optional `patientProfileId` from the form data or query parameter. If the user is a patient, use their own profile ID as before.
   - On `@Post(':id/process')`, change `@Roles(UserRole.PATIENT)` to `@Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)`.

2. In file `backend/src/extraction/extraction.controller.ts`:
   - On `@Patch(':id/fields/:fieldId')`, change `@Roles(UserRole.PATIENT)` to `@Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)`.
   - On `@Post(':id/confirm')`, change `@Roles(UserRole.PATIENT)` to `@Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)`.
   - On `@Post(':id/mark-unclear')`, change `@Roles(UserRole.PATIENT)` to `@Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)`.

3. In file `backend/src/plans/plans.controller.ts`:
   - On `@Post(':id/confirm')`, change `@Roles(UserRole.PATIENT)` to `@Roles(UserRole.PATIENT, UserRole.ASHA, UserRole.ADMIN)`.

Run `npm run build` in `backend` to verify that all RBAC guards compile cleanly.
```

---

### PROMPT 3 of 12: Fix Critical Safety Red-Flag Contract Typo & Indian Emergency Hotlines

**Goal:** Fix the safety alert contract mismatch (`hasRedFlags` vs `hasRedFlag`) and replace US 911 with Indian emergency numbers (108/104/112).

```text
Please fix the critical contract mismatch between the backend RedFlagEngine and the frontend useSafetyStore, and localize emergency hotlines for India (SIH26133).

1. In file `src/stores/useSafetyStore.ts`:
   - In `evaluateSafety`, inspect the returned object from `safetyApi.check(planId, ...)`.
   - Check both `result.hasRedFlags` AND `result.hasRedFlag` AND `result.triggered`.
   - If `result.matches` exists and has items, use `result.matches[0]` as the primary triggered red flag.
   - Replace the emergency phone number from '911' to '108' (Ambulance), with backup '104' (Medical Helpline) or '112' (National Emergency).
   - In `triggerManualEmergency`, set `emergencyPhone: '108'`, `doctorPhone: '104'`, and `actionRequired: 'Call 108 for Emergency Ambulance immediately or visit the nearest Rural Hospital / Sub-District Hospital.'`.

2. In file `src/pages/DashboardPage.tsx`:
   - Change the button text from "Call 911 / ER" to "Call 108 Ambulance".
   - Set the button `tel:` link to `tel:108`.

3. In file `src/pages/SafetyCheckPage.tsx`:
   - Read the actual active alert from `useSafetyStore((s) => s.activeAlert)` instead of displaying hardcoded fever text.
   - Change "seek emergency help now (911)" to "seek emergency help now: Call 108 (Ambulance) or 104 (Health Helpline)".
   - Update the "View Source Instructions" button to use the real plan ID rather than hardcoding `/verification/plan-chole-90284`.

Run `npm run build` to verify the frontend build.
```

---

### PROMPT 4 of 12: Fix Medication Logging Contract (Schedule ID) & Calendars Tab

**Goal:** Ensure medication adherence logging correctly references `MedicationSchedule.id` and activate the "Calendars" export view.

```text
Please fix the medication dose logging contract and the inactive Calendars tab in MedicationsPage.

1. In file `src/stores/usePlanStore.ts`:
   - In `recordMedicationAction(medId, status, notes)`:
     - Check if `medId` is a schedule ID or a medication ID.
     - Look up the medication in `state.plan.medications`. If it has a `schedules` array with a schedule ID, pass that schedule ID to `medicationsApi.logEvent(scheduleId, ...)`.
     - If no schedule ID is found or if offline, queue the mutation to offlineStorage with entity 'medication_log' and payload `{ medicationId: medId, status, notes, actedAt: now }`.
     - Catch errors gracefully without crashing the optimistic UI.

2. In file `src/pages/MedicationsPage.tsx`:
   - Replace the static date string `<span>Today, 16 Apr 2026</span>` with dynamically formatted current date: `format(new Date(), 'EEEE, d MMM yyyy')`.
   - Calculate adherence rate dynamically from `medications` (percentage of medications marked 'taken' vs total).
   - In the JSX, implement the `tabView === 'calendars'` view:
     - When `tabView === 'calendars'` is active, render an export card offering:
       1. "Export All 15-Day Reminders to Phone Calendar (.ics with alarms)" calling `downloadRecoveryCalendar(plan)`.
       2. A visual calendar showing days 1 through 15 with scheduled dose count per day.

Run `npm run build` to ensure the frontend compiles.
```

---

### PROMPT 5 of 12: Fix Document Upload Flow to Upload Real Files & Pass Generated Document ID

**Goal:** Connect `DocumentUploadPage` to `documentsApi.upload()` and pass the real document ID to `DocumentProcessingPage`.

```text
Please connect the document upload page to the real backend upload API.

1. In file `src/pages/DocumentUploadPage.tsx`:
   - In `handleFileSelect`, store the actual `File` object in state and in `usePlanStore.setUploadedFile()`.
   - In `handleStartProcessing`:
     - Show an inline loading spinner on the button ("Uploading document...").
     - If `uploadedFile?.fileObj` is present, call `await documentsApi.upload(uploadedFile.fileObj)`.
     - Extract `res.documentId` from the response.
     - Call `await documentsApi.triggerProcessing(res.documentId)` to initiate OCR.
     - Navigate to `/documents/processing/${res.documentId}`.
     - If the backend is unreachable or offline, generate a client UUID (`doc-local-${Date.now()}`), save it, and navigate to `/documents/processing/${localId}`.

2. In file `src/pages/DocumentProcessingPage.tsx`:
   - If `documentId` starts with `doc-local-` or backend returns 404, smoothly display the simulated progress steps and then navigate to `/verification/${documentId}` without hanging or getting stuck in an error loop.
   - When real OCR finishes (`doc.status === 'EXTRACTION_DONE'` or `'NEEDS_REVIEW'`), navigate to `/verification/${doc.extractionId || documentId}`.

Run `npm run build` to verify frontend compilation.
```

---

### PROMPT 6 of 12: Connect VerificationPage to Real Extracted Fields from the API

**Goal:** Ensure `VerificationPage` fetches extracted fields for the current document from `extractionApi.getById()` and updates the plan store.

```text
Please update VerificationPage so that it loads and displays real extracted fields from the backend API.

1. In file `src/pages/VerificationPage.tsx`:
   - Read `planId` from `useParams<{ planId: string }>()`.
   - In a `useEffect`, if `planId` is present and not a demo placeholder:
     - Call `extractionApi.getById(planId)` (or `documentsApi.getById(planId)` to find its extraction).
     - Map the returned extraction fields (`category`, `fieldKey`, `value`, `confidence`, `status`, `sourceReference`) into `ExtractionField[]`.
     - Update the store extractions so the patient sees the actual fields extracted from their uploaded document.
     - Call `documentsApi.getPages(planId)` to load real OCR recognized text in the left-hand document viewer.
   - Fix the "Back" button: instead of navigating to `/verification/plan-chole-90284`, navigate to `/documents/upload`.

2. In file `src/pages/ConfirmPlanPage.tsx`:
   - Fix the "Back" button on line 116: navigate back to `/verification/${plan.id || 'current'}` instead of hardcoded `plan-chole-90284`.
   - In `handleActivate`, ensure `confirmAndActivatePlan()` passes the real `plan.id` to `plansApi.confirm()`.

Run `npm run build` to verify that verification and plan confirmation compile cleanly.
```

---

### PROMPT 7 of 12: Persist Onboarding Data, Care Pathway & Emergency Contacts

**Goal:** Ensure all 5 onboarding steps persist patient data to `usePlanStore`, `useAuthStore`, and `PATCH /api/v1/users/profile`.

```text
Please fix the Onboarding flow so user input across all 5 steps is preserved and applied.

1. In file `src/pages/OnboardingPage.tsx`:
   - In Step 3 (Language Selection), replace the list of languages with:
     - English (`en`)
     - हिन्दी (`hi`)
     - मराठी (`mr`)
     - ਪੰਜਾਬੀ (`pa` - Tier 2)
     - বাংলা (`bn` - Tier 2)
     - தமிழ் (`ta` - Tier 2)
   - Ensure the 5 PRD v3.0 pathways are clearly selectable in Step 1:
     1. Post-Surgery (`POST_SURGERY`)
     2. Pregnancy / Maternal (`PREGNANCY`)
     3. Diabetes Management (`DIABETES`)
     4. Tuberculosis DOTS (`TUBERCULOSIS`)
     5. Hypertension Care (`HYPERTENSION`)
   - In `handleNext` when `currentStep === 5`:
     - Update `usePlanStore` with `patientProfile`: `{ name: formData.patientName, pathway: formData.pathwayId, surgeryDate: formData.surgeryDate, dischargeDate: formData.dischargeDate, language: formData.language }`.
     - Update `useAppPreferencesStore.setLanguage(formData.language)`.
     - Call `usersApi.updateProfile({ firstName: formData.patientName, pathway: formData.pathwayId, language: formData.language })` if authenticated.
     - Persist the onboarding state in `localStorage.setItem('rc_onboarding_profile', JSON.stringify(formData))`.
     - Then navigate to `/documents/upload`.

Run `npm run build` to verify compilation.
```

---

### PROMPT 8 of 12: Connect ASHA & ANM Dashboards to Real Community Endpoints

**Goal:** Connect `AshaDashboardPage` and `AnmDashboardPage` to `GET /api/v1/community/caseload`, `POST /api/v1/community/visits`, and `POST /api/v1/community/escalate`.

```text
Please connect the ASHA Worker and ANM Supervisor dashboards to the real backend Community API.

1. In file `src/api/community.ts` (create if missing):
   - `getCaseload: () => apiClient.get<CaseloadPatient[]>('/community/caseload')`
   - `logVisit: (dto: LogAshaVisitDto) => apiClient.post('/community/visits', dto)`
   - `escalate: (dto: EscalateRiskDto) => apiClient.post('/community/escalate', dto)`
   - `getEscalations: (role?: string) => apiClient.get<Escalation[]>('/community/escalations', { params: { role } })`
   - `resolveEscalation: (id: string, dto: ResolveEscalationDto) => apiClient.put(`/community/escalations/${id}/resolve`, dto)`

2. In file `src/pages/AshaDashboardPage.tsx`:
   - In `useEffect`, call `communityApi.getCaseload()`. If successful, set `caseload`. If offline, load from `offlineStorage`.
   - In `handleSaveVisit`:
     - Send the visit log to `communityApi.logVisit(...)`.
     - If offline, queue the mutation to `offlineStorage.queueMutation({ entity: 'asha_visit', ... })`.
   - In `handleEscalate`:
     - Send to `communityApi.escalate(...)`.
     - If offline, queue to `offlineStorage`. Provide the prefilled `sms:` link to the ANM over the phone's native cellular network as specified in PRD v3.0 C5.

3. In file `src/pages/AnmDashboardPage.tsx`:
   - In `useEffect`, fetch active escalations from `communityApi.getEscalations('ANM')`.
   - In `handleResolveEscalation`, call `communityApi.resolveEscalation(...)` to update status.

Run `npm run build` to verify frontend compilation.
```

---

### PROMPT 9 of 12: Wire the Offline IndexedDB Engine & Outbox Pattern to Stores

**Goal:** Connect `offlineStorage` (IndexedDB) and the outbox sync worker across `usePlanStore`, `useSymptomStore`, and `TopBar`.

```text
Please wire the local-first IndexedDB engine and outbox sync engine across the application so that all offline operations are durable and synced upon reconnecting.

1. In file `src/stores/usePlanStore.ts`:
   - Import `offlineStorage` from `@/services/offlineSync`.
   - In `saveOfflineSnapshot`, write the full plan to `offlineStorage.savePlanSnapshot(get().plan)`.
   - In `recordMedicationAction`, if offline or API fails, call `offlineStorage.queueMutation(...)`.
   - In `toggleTaskStatus`:
     - Optimistically update task status.
     - Call `plansApi.updateTask(taskId, newStatus)`.
     - If offline, call `offlineStorage.queueMutation({ id: `task-${Date.now()}`, entity: 'task_event', action: 'UPDATE', payload: { taskId, status: newStatus }, clientTimestamp: new Date().toISOString() })`.

2. In file `src/stores/useSymptomStore.ts`:
   - Import `offlineStorage` from `@/services/offlineSync`.
   - In `addLog`, if `symptomsApi.log(...)` throws due to network error, call `offlineStorage.queueMutation({ id: tempId, entity: 'symptom_log', action: 'CREATE', payload: localLog, clientTimestamp: timestamp })`.

3. In file `src/components/common/TopBar.tsx` and `AppShell.tsx`:
   - Listen to `window.addEventListener('online', () => offlineStorage.syncOutbox())`.
   - Add a visible sync status indicator:
     - "Saved on phone (Offline)" when offline or outbox has items.
     - "Synced ✓" when online and outbox is empty.
     - Provide a manual "Sync Now" button that calls `offlineStorage.syncOutbox()`.

Run `npm run build` to verify frontend compilation.
```

---

### PROMPT 10 of 12: Add Pathway-Specific Vitals & Dynamic Charts in Symptoms Page

**Goal:** Implement pathway-specific vitals logging (Blood Sugar, Blood Pressure, Fetal Movement, TB doses) per PRD v3.0 F6 & 6.4.

```text
Please update SymptomsPage to support pathway-specific vitals logging based on the patient's active care pathway.

1. In file `src/pages/SymptomsPage.tsx`:
   - Determine the active pathway from `plan.patientProfile.pathway` (defaulting to 'POST_SURGERY').
   - Render pathway-specific inputs:
     - If `DIABETES`: Add Fasting Blood Sugar & Post-Prandial Sugar inputs (in mg/dL) with normal target reference range (70–140 mg/dL).
     - If `HYPERTENSION`: Add Systolic and Diastolic Blood Pressure inputs (in mmHg) with normal reference (120/80 mmHg).
     - If `PREGNANCY`: Add Fetal Movement Kick Count (last 2 hours) and severe headache / swelling toggle.
     - If `TUBERCULOSIS`: Add Daily DOTS Dose Confirmation checkbox and side-effect screening (nausea, orange urine, rash, jaundice).
     - If `POST_SURGERY`: Keep incision pain score (0–10) and wound redness / discharge screening.
   - In the Adherence & Pain Trend graph on the right:
     - Replace the hardcoded `chartData` array with actual dynamic history from `useSymptomStore.history`.
     - Plot real pain scores and temperature readings recorded over the past 7 days.

Run `npm run build` to verify frontend compilation.
```

---

### PROMPT 11 of 12: Implement Multilingual Localization & Marathi Across All Pages

**Goal:** Make the UI actually render translated strings for English, Hindi, and Marathi when language is toggled.

```text
Please implement the translation system so that changing language in the TopBar translates the navigation, dashboard, emergency alerts, and task titles into Marathi, Hindi, or English.

1. In file `src/services/i18n.ts`:
   - Export a hook `useTranslation()` that reads `language` from `useAppPreferencesStore` and returns:
     - `t(key: keyof Translations): string`
     - `currentLanguage: LanguageCode`
     - `speak(text: string): void`
   - Expand the Marathi (`mr`) and Hindi (`hi`) translation dictionaries for all core UI headings, buttons, and emergency actions.

2. In file `src/components/common/TopBar.tsx`:
   - Use `t('today')`, `t('timeline')`, `t('medications')`, `t('symptoms')`, `t('schemes')`, `t('facilities')`, `t('ashaCaseload')` for the navigation links.

3. In file `src/pages/DashboardPage.tsx`:
   - Use `useTranslation()` to translate:
     - "Today's Progress"
     - "Today's Tasks"
     - "Emergency / Urgent Help"
     - "Call 108 Ambulance"
   - Add a "Tap to listen (आवाजात ऐका)" audio button on daily task cards calling `speakText(task.title, language)`.

4. In file `src/pages/TimelinePage.tsx`:
   - Fix the day strip content check on line 174: check whether the specific day in the loop has tasks or medications, rather than checking `currentDay`.
   - Localize timeline headers and verified badges.

Run `npm run build` to verify frontend compilation.
```

---

### PROMPT 12 of 12: Implement Phone Number + PIN Authentication for Rural Users

**Goal:** Enable rural patients and ASHA workers without email addresses to register and log in using Phone Number + 4-digit PIN (PRD v3.0 Section 10).

```text
Please implement Phone Number + PIN authentication alongside email auth in both backend and frontend.

1. In file `backend/src/auth/dto/login.dto.ts` and `register.dto.ts`:
   - Allow login with either `email` OR `phone` + `password` (or 4-digit PIN).
   - In `auth.service.ts`:
     - Allow lookup by `phone` if `email` is not provided.
     - For rural patient registration, accept `phone`, `pin`, `firstName`, `lastName`, and `role`. If no email is provided, derive a synthetic identifier (e.g. `phone_number@rural.recoverycompass.org`).

2. In file `src/pages/LoginPage.tsx`:
   - Add a toggle: "Login with Mobile Number & PIN" (for patients/ASHA) vs "Login with Email & Password" (for staff/admin).
   - The Mobile & PIN form accepts a 10-digit Indian phone number (`[6-9][0-9]{9}`) and 4-digit numeric PIN with large touch-friendly buttons.
   - Update `useAuthStore.login` to handle `{ phone, pin }` and route to the patient dashboard or ASHA caseload based on role.

3. In file `src/stores/useAuthStore.ts`:
   - Update `DEMO_PERSONAS` to include realistic Indian public health personas:
     - `Sharda Patil` (Patient, Post-Cholecystectomy, Day 4, Shirur, Pune)
     - `Sunita Tai Gaikwad` (ASHA Worker, Shirur PHC Block, Pune)
     - `Rekha Sister Shinde` (ANM Supervisor, Koregaon Bhima PHC)
     - `Dr. Sanjay Deshmukh` (PHC Medical Officer, Shirur)

Run `npm run build` in both `backend` and root to verify that the entire full-stack system compiles and passes all checks.
```

---

## 5. Verification Checklist for Acceptance Testing

After executing the 12 prompts in order, perform this physical end-to-end verification checklist:

| Test Case | Procedure | Expected Pass Criteria |
| :--- | :--- | :--- |
| **TC-01: Rural Phone Login** | Open `/login`, select Mobile + PIN, enter `9823012345` and PIN `1234`. | Logs in successfully, sets JWT, and navigates to Dashboard. |
| **TC-02: Onboarding Persistence** | Complete 5-step onboarding with pathway "Post-Surgery" and discharge date. | Redirects to upload; dashboard reflects chosen pathway and calculates Day 1 from discharge date. |
| **TC-03: Real Document Upload** | Upload prescription image on `/documents/upload`. | Sends `POST /api/v1/documents/upload`, receives real document ID, and polls OCR status. |
| **TC-04: Extracted Fields Review** | Navigate to `/verification/:id`. | Displays original OCR text side-by-side with extracted meds and confidence badges. |
| **TC-05: Dose Event Logging** | On `/medications`, click "Take Dose" on a medicine. | Sends `POST /api/v1/medications/:scheduleId/events` with status `TAKEN`, returns 200/201. |
| **TC-06: Red Flag Safety Detection** | On `/symptoms/log`, record temperature 102.5°F (39.2°C) or select "Shortness of breath". | Red flag triggers immediately: modal displays "Call 108 Ambulance" button. |
| **TC-07: Offline Airplane Mode** | Disconnect network, mark task completed, log a symptom, export `.ics` alarms. | All operations succeed locally; `.ics` downloads; outbox shows 2 queued mutations. |
| **TC-08: Automatic Online Sync** | Reconnect network. | `window.ononline` fires; outbox syncs to `POST /api/v1/sync/push`; status badge shows "Synced ✓". |
| **TC-09: ASHA Caseload & Visit** | Open `/asha` as ASHA worker, open visit modal, complete medication verification. | Updates patient to "ASHA Verified" and logs visit via `POST /api/v1/community/visits`. |
| **TC-10: Language Switch to Marathi** | Select "मराठी" from top navigation bar. | Navigation, titles, and emergency buttons instantly switch to Marathi script; "आवाजात ऐका" reads Marathi text. |

---

*Report prepared and certified by Antigravity Senior Systems Quality Assurance.*
