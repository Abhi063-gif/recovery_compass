# RecoveryCompass — Comprehensive Systemic Audit, Root Cause Analysis & Remediation Action Plan

**Document Version:** 4.0  
**Target Environment:** Production Healthcare SaaS / Punjab Public Health Integration  
**Date:** October 31, 2026  

---

## Executive Summary of Identified Problems

Following a thorough forensic audit of the frontend and backend codebase, four critical systemic issues have been identified and organized systematically:

| Issue # | System Domain | User-Reported Symptom | Severity | Exact Code Root Cause |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Global Navigation** | "15-day plan, ASHA caseload and ANM options are vanished / completely removed" | **CRITICAL** | `TopBar.tsx` wrapped the entire desktop navigation in `hidden xl:flex` (1280px). Displays under 1280px (standard laptops, split-screen, zoom) hid all 10 links. |
| **2** | **Document Processing & OCR** | "Uploading empty PDF with zero data still shows dummy data instead of showing PDF is empty" | **CRITICAL** | `DocumentProcessingPage.tsx` fell back to simulating success for any local file and hardcoded navigation to `/verification/plan-chole-90284`; `VerificationPage.tsx` fell back to `SYNTHETIC_DISCHARGE_TEXT` on blank content. |
| **3** | **Multilingual Engine (i18n)** | "Universal language apply still issues persist; only header and some specific screens convert" | **HIGH** | `MedicationsPage`, `SymptomsPage`, `SafetyCheckPage`, `DashboardPage`, `TimelinePage`, and modals contained dozens of hardcoded English strings without calling `t(...)`. |
| **4** | **Offline Sync & Outbox Engine** | "Synced functionality is not working; outbox does not persist to server" | **HIGH** | `backend/src/sync/sync.service.ts` only handled `symptom_log`, `medication_log`, and `task_event` with `action === 'CREATE'`. Task updates (`action: 'UPDATE'`), `asha_visit`, and `escalation` were completely ignored. |

---

## Module 1: Global Navigation & Persistent Access

### 1.1 Problem Description
The user reported that the **15-Day Plan**, **ASHA Caseload**, and **ANM Review** navigation options vanished from the top bar.

### 1.2 Exact Root Cause
In `src/components/common/TopBar.tsx`:
```tsx
// Line 205
<nav className="hidden xl:flex items-center gap-1 bg-[#F5F7FA] border border-[#E2E8F0] p-1 rounded-xl">
  {navLinks.map((link) => ...)}
</nav>

// Line 473
<button onClick={() => setShowMobileNav(!showMobileNav)} className="xl:hidden ...">
```
* The Tailwind breakpoint `xl` is `min-width: 1280px`.
* On any device with screen width $\le 1279$px (standard 1366×768 laptops, 1024×768 tablets, or split windows), the entire `<nav>` was hidden by `hidden xl:flex`.
* The fallback mobile menu button was an icon without a label, making the primary clinical navigation appear completely gone.

### 1.3 Architectural Remediation
Implement a **2-Tier Navigation Architecture**:
1. **Tier 1 (Top Header - 56px):** Brand identity, Emergency 108 shortcut, Outbox Sync status, Global Language Selector, Try Demo button, and User Avatar.
2. **Tier 2 (Clinical Navigation Bar - 44px):** A dedicated, permanently visible sub-bar containing all 10 links (`Today`, `15-Day Plan`, `Medications`, `Symptoms`, `Red Flags & Safety`, `Govt Schemes`, `Nearby PHCs`, `ASHA Caseload`, `ANM Review`, `Family Circle`) with smooth horizontal scrolling (`overflow-x-auto no-scrollbar`).
3. **Zero Breakpoint Hiding:** The clinical links are **never** hidden behind a breakpoint on any screen size.

### 1.4 Execution Prompt for Module 1
```text
Refactor `src/components/common/TopBar.tsx`:
1. Remove `hidden xl:flex` from navigation.
2. Create a dedicated secondary horizontal navigation sub-bar directly below the main brand header that is visible on ALL devices (mobile, tablet, laptop, desktop).
3. Ensure all 10 links are permanently rendered:
   - Today (/dashboard)
   - 15-Day Plan (/timeline)
   - Medications (/medications)
   - Symptoms (/symptoms/log)
   - Red Flags & Safety (/safety)
   - Govt Schemes (/schemes)
   - Nearby PHCs (/facilities)
   - ASHA Caseload (/asha)
   - ANM Review (/anm)
   - Family Circle (/family)
4. Add `overflow-x-auto no-scrollbar scroll-smooth` so links scroll cleanly on narrower screens without clipping or line wrapping.
5. Apply active tab indicator using brand colors: active tab has `#17243A` navy background with bold text; inactive tabs have `#F5F7FA` with slate text.
```

---

## Module 2: Empty PDF & Zero-Data Document Upload Validation

### 2.1 Problem Description
When uploading an empty PDF (0 bytes or blank paper without printed/written clinical text), the platform proceeded through fake processing stages and displayed dummy post-surgery data (`Gurpreet Kaur`, Laparoscopic Cholecystectomy, synthetic prescriptions) instead of indicating that the document was blank.

### 2.2 Exact Root Causes
1. **No Client-side Zero-byte Validation:** `DocumentUploadPage.tsx` accepted 0-byte or blank files without pre-flight validation.
2. **Forced Simulation on Local Uploads:** In `DocumentProcessingPage.tsx` (lines 77–88):
   ```ts
   if (!documentId || documentId.startsWith('doc-local-') || documentId.includes('demo')) {
     // Simulates 6 stages then navigates to `/verification/plan-chole-90284`
   }
   ```
   Any upload that didn't immediately have an active backend session was assigned `doc-local-` and directed to `/verification/plan-chole-90284`.
3. **Bypass of Real Data in Verification:** In `VerificationPage.tsx` (line 50):
   ```ts
   if (planId && !planId.includes('demo') && !planId.includes('chole'))
   ```
   Because the URL contained `chole`, the page skipped fetching real extraction fields and loaded initial mock store extractions.
4. **Fallback to Synthetic Text on Empty OCR:** In `VerificationPage.tsx` (line 321):
   ```ts
   {(realDocumentText || SYNTHETIC_DISCHARGE_TEXT).trim()}
   ```
   When the uploaded document had no OCR text, it displayed `SYNTHETIC_DISCHARGE_TEXT` on the paper view.

### 2.3 Architectural Remediation
1. **Client-side Size & Content Gate:** Check `file.size === 0` in `DocumentUploadPage.tsx`. If empty, reject upload immediately with an alert.
2. **Empty Text Detection in Processing:** If processing a local file, inspect file content. If blank or 0 extracted entities, halt and show an explicit error screen:
   * **Title:** "Empty or Unreadable Document"
   * **Message:** "No readable clinical instructions, medications, or discharge summaries were detected in this document. The document appears blank or unreadable."
   * **Action:** "Upload Another Document" (clears file and returns to upload screen).
3. **Strict Verification Guard:** In `VerificationPage.tsx`, do not fall back to `SYNTHETIC_DISCHARGE_TEXT` unless `isDemoMode` is explicitly active. If extractions are empty, display an empty state banner: "No clinical entities extracted from this document."

### 2.4 Execution Prompt for Module 2
```text
Refactor Document Upload & Verification Pipeline:
1. In `src/pages/DocumentUploadPage.tsx`:
   - Validate `file.size > 0`. If 0 bytes, display: "The selected file is empty (0 bytes). Please upload a valid document." and prevent upload.
2. In `src/pages/DocumentProcessingPage.tsx`:
   - If processing a local document, check if the file has readable text.
   - If the document is blank or backend returns 0 extracted fields, DO NOT navigate to `/verification/plan-chole-90284`.
   - Render an explicit error state:
     - Icon: AlertCircle / FileX
     - Heading: "Empty or Unreadable Document"
     - Subtitle: "No clinical instructions, prescriptions, or follow-up dates could be detected in this document. Please ensure the document has legible printed or written text."
     - CTA: "Upload Valid Document" -> resets uploaded file and redirects to `/documents/upload`.
3. In `src/pages/VerificationPage.tsx`:
   - Remove fallback to `SYNTHETIC_DISCHARGE_TEXT` for user uploads. If `realDocumentText` is empty and `!isDemoMode`, display "No text extracted from document."
   - If `plan.extractions.length === 0`, render an empty extraction state banner with a button to re-upload.
```

---

## Module 3: Universal Multilingual Transformation Engine

### 3.1 Problem Description
Switching languages to **ਪੰਜਾਬੀ (Punjabi Gurmukhi)** or **हिन्दी (Hindi)** only translated the top header nav links and select screens; the majority of pages (`Medications`, `Symptoms`, `Timeline`, `Dashboard`, `Safety`) retained hardcoded English strings.

### 3.2 Exact Root Cause
* `src/services/i18n.ts` was initially written with an incomplete set of translation keys (limited to ~40 high-level terms).
* Several major views had not been refactored to consume `useTranslation()`. Text such as "Upcoming", "Prescribed schedule", "Take Medicine", "Adherence Rate", "Log Symptoms", "Emergency Help", etc., was hardcoded in JSX.

### 3.3 Architectural Remediation
1. Expand `TRANSLATIONS` in `src/services/i18n.ts` with comprehensive dictionaries covering every page domain:
   * **Navigation & Common Controls:** Save, Cancel, Close, Submit, Syncing, Synced, Offline.
   * **Medications Page:** Upcoming, Calendar View, Take Medicine, Skip Medicine, Adherence Rate, Taken, Skipped.
   * **Symptoms Page:** How are you feeling today, Pain Score, Temperature, Notes, Save Log, Recent Logs.
   * **Safety & Red Flags Page:** Red Flag Warning, Emergency Call 108, Danger Signs, Active Alerts.
   * **Timeline Page:** Day N of Recovery, Tasks, Appointments, Diet & Restrictions.
2. Wire `useTranslation()` into `MedicationsPage.tsx`, `SymptomsPage.tsx`, `SafetyCheckPage.tsx`, `TimelinePage.tsx`, and `DashboardPage.tsx`.

### 3.4 Execution Prompt for Module 3
```text
Systematically Localize All Subpages:
1. In `src/services/i18n.ts`:
   - Expand `Translations` interface and dictionaries for `en`, `pa` (Gurmukhi), and `hi` with all UI strings for Medications, Symptoms, Safety, Timeline, and Dashboard pages.
2. In `src/pages/MedicationsPage.tsx`:
   - Replace hardcoded text with `t('upcoming')`, `t('calendarView')`, `t('takeMedicine')`, `t('adherenceRate')`, etc.
3. In `src/pages/SymptomsPage.tsx`:
   - Replace hardcoded text with `t('symptomTracker')`, `t('painScore')`, `t('temperature')`, `t('saveSymptomLog')`, etc.
4. In `src/pages/SafetyCheckPage.tsx`:
   - Replace hardcoded text with `t('redFlagSafety')`, `t('call108')`, `t('emergencyHelp')`, etc.
5. In `src/pages/TimelinePage.tsx` and `src/pages/DashboardPage.tsx`:
   - Ensure all section headings, task badges, and buttons consume `t(...)`.
```

---

## Module 4: Offline Outbox Synchronization Engine

### 4.1 Problem Description
The "Sync Now" button did not successfully persist queued offline mutations to the backend database.

### 4.2 Exact Root Causes
1. **Action Mismatch in Task Events:** In `src/stores/usePlanStore.ts` (line 273), task updates were queued with `action: 'UPDATE'`. In `backend/src/sync/sync.service.ts` (line 86), the handler only checked:
   ```ts
   else if (entity === 'task_event' && action === 'CREATE')
   ```
   All task event updates were silently discarded.
2. **Missing Entity Handlers in Backend Sync:** `backend/src/sync/sync.service.ts` only implemented handlers for `symptom_log`, `medication_log`, and `task_event`. It had **no implementation** for:
   * `entity === 'asha_visit'`
   * `entity === 'escalation'`
   When an ASHA worker logged a visit or escalated an emergency while offline, the backend sync push ignored the mutations.
3. **Outbox Clearing Mechanism:** `offlineStorage.syncOutbox()` needed robust response-based mutation clearing so that only successfully applied mutations are dequeued.

### 4.3 Architectural Remediation
1. Update `backend/src/sync/sync.service.ts`:
   * Support `action === 'UPDATE'` for `task_event`.
   * Add dedicated handlers for `entity === 'asha_visit'` and `entity === 'escalation'`.
   * Ensure database insertions handle client-generated UUIDs idempotently (catch `P2002` duplicate key).
2. Update `src/services/offlineSync.ts`:
   * Verify server response status and mutate outbox accurately.

### 4.4 Execution Prompt for Module 4
```text
Fix Offline Sync Engine across Frontend and Backend:
1. In `backend/src/sync/sync.service.ts`:
   - In `applyMutation()`:
     - Handle `entity === 'task_event'` for both `action === 'CREATE'` and `action === 'UPDATE'`.
     - Implement handler for `entity === 'asha_visit'`: parse vitals and blister checks, save to DB or audit log.
     - Implement handler for `entity === 'escalation'`: create escalation record with severity and target role.
     - Add idempotent error handling (P2002 unique constraint).
2. In `src/services/offlineSync.ts`:
   - Ensure `syncOutbox()` sends correct authorization header from `recovery_compass_access_token`.
   - On successful server response, remove processed mutations from IndexedDB outbox.
```

---

## Implementation Verification Checklist

- [x] **TopBar Navigation Restored:** 2-Tier header implemented. All 10 navigation links (`Today`, `15-Day Plan`, `Medications`, `Symptoms`, `Red Flags & Safety`, `Govt Schemes`, `Nearby PHCs`, `ASHA Caseload`, `ANM Review`, and `Family`) are permanently visible across all screen sizes (mobile, tablet, laptop, desktop) without disappearing.
- [x] **Empty / Blank Document Gate:** Uploading an empty, 0-byte, or blank PDF triggers pre-flight validation and an explicit "Empty or Unreadable Document Detected" error screen in `DocumentProcessingPage.tsx` and `VerificationPage.tsx`. Zero dummy or cholecystectomy data is leaked in production/non-demo mode.
- [x] **Universal Multilingual Transformation:** `src/services/i18n.ts` extended with first-class translations for Gurmukhi Punjabi (`pa`), Hindi (`hi`), and English (`en`). Wired directly into `MedicationsPage`, `SymptomsPage`, `SafetyCheckPage`, `VerificationPage`, `DashboardPage`, and `TimelinePage`. All headings, action buttons (`takeMedicine`, `saveSymptomLog`, `callClinician`, `exportCalendar`), vital inputs, and badges consume localized `t(...)` keys.
- [x] **Offline Outbox Backend Sync:** `backend/src/sync/sync.service.ts` updated to process `task_event` for both `CREATE` and `UPDATE`, as well as `asha_visit` and `escalation`. Mutations sync cleanly with `/sync/push`, decrementing the outbox counter.
- [x] **Production Builds Verified:** Both frontend (`tsc && vite build`) and backend (`nest build`) compile with **0 errors**.
