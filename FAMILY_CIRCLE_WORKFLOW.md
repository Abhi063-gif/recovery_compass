# RecoveryCompass — Family Circle & Caregiver Oversight Workflow

> **Production-Grade Implementation Guide**: Closing the loop between Patients, Family Caregivers, and the Frontline Health Network.

---

## 1. Executive Summary

In post-discharge rural and suburban healthcare (piloted across Punjab's Ludhiana, Sahnewal, Dehlon, and SAS Nagar blocks), family caregivers are the primary bedside support system. 

Previously, when a patient entered a family member's email on the **Family Circle** screen:
1. No email dispatch logic was wired to the invitation service.
2. The UI dismissed the modal without showing the generated token, OTP, or direct link.
3. Caregivers lacked a dedicated portal to view patient recovery progress, today's schedule, or verify taken doses.

This release implements a **smooth, soothing, end-to-end caregiver workflow** with full backward compatibility:
- **Automatic Email Dispatch**: Branded HTML email delivered via `EmailProvider` with consent permissions, direct acceptance link, and a 6-digit OTP code.
- **Immediate Handover Modal**: Displays a WhatsApp/SMS-ready deep link and large copyable 6-digit OTP.
- **Deep-Link Auto-Population**: When a family member opens `http://localhost:5173/family?token=...&otp=...`, the verification modal automatically opens with pre-filled credentials.
- **Caregiver Recovery Oversight Portal**: Caregivers can view patient adherence (92%), vital trends (pain score, temperature), confirm scheduled medications, call 108 Ambulance, or contact the assigned village ASHA worker.

---

## 2. System Architecture & Modules

```
                    ┌────────────────────────┐
                    │ Patient (Family Circle)│
                    └───────────┬────────────┘
                                │
                    Enters Email & Consent
                                │
                                ▼
            ┌────────────────────────────────────────┐
            │ POST /plans/:planId/family/invite       │
            └───────────────────┬────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────────────┐               ┌──────────────────────────────┐
│ NotificationsService          │               │ Family Handover Modal (UI)   │
│ - Branded HTML Email Template │               │ - 6-Digit OTP Box            │
│ - 6-Digit Secure OTP Code     │               │ - Copyable WhatsApp Link     │
│ - Direct Deep-Link Generation │               │ - Offline/Degraded Fallback  │
└───────────────┬───────────────┘               └──────────────────────────────┘
                ▼
      Delivered via SMTP /
      Local Console Fallback
                │
                ▼
┌────────────────────────────────────────────────────────┐
│ Caregiver Experience:                                  │
│ 1. One-Click Acceptance via URL Query Parameters       │
│ 2. Real-Time Patient Recovery Monitor                  │
│ 3. Confirm Scheduled Doses ("Confirm Dose Taken")      │
│ 4. Instant Emergency 108 & ASHA Contact Shortcuts      │
└────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Breakdown

### Module 1: Backend Email & Invitation Dispatch
- **File**: `backend/src/notifications/notifications.service.ts`
  - Added `sendCaregiverInvitationEmail(toEmail, data)`:
    - Generates branded HTML email with Punjab Public Health headers.
    - Outlines patient-granted consent permissions (View Plan, Receive Alerts, Log Symptoms, Mark Medications).
    - Features large, legible 6-digit OTP code and a prominent "Accept Caregiver Invitation" CTA button.
    - Gracefully handles offline and development environments.
- **File**: `backend/src/family/family.service.ts`
  - Integrated `NotificationsService.sendCaregiverInvitationEmail(...)` directly into `invite()`.
  - Added `getCaregiverPatientOverview(caregiverUserId)` providing active recovery metrics, today's scheduled medicines, and ASHA contact info.
- **File**: `backend/src/family/family.controller.ts`
  - Updated `InviteDto` to accept optional `name` and `relationship`.
  - Added `GET /family/patient-overview` endpoint accessible to Caregivers and Patients.

### Module 2: Frontend Family API & Store
- **File**: `src/api/family.ts`
  - Added `CaregiverPatientOverview` interface.
  - Added `getPatientOverview()` endpoint.
  - Enhanced `invite()` payload with `name` and `relationship`.
- **File**: `src/stores/useFamilyStore.ts`
  - Added `caregiverPatientOverview` state and `fetchPatientOverview()` action.
  - Enhanced `inviteMember` to return `{ token, otp, emailSent }`.

### Module 3: Frontend UI/UX Refactor (`src/pages/FamilyPage.tsx`)
- **Direct Link Pre-Fill**: Reads `token` and `otp` from `useSearchParams()`. When present, automatically pre-fills the verification modal.
- **Invitation Handover Modal**: Immediately presents the patient with:
  - Email dispatch confirmation.
  - High-visibility 6-digit OTP code with 1-click copy.
  - WhatsApp/SMS-ready direct link with copy button.
- **Caregiver Oversight Mode**:
  - Segmented toggle between **Manage Circle** (Patient View) and **Caregiver Oversight** (Caregiver View).
  - Displays patient recovery status, adherence rate (92%), pain score, and temperature.
  - Interactive medication checklist with **"Confirm Dose Taken"** button linked to `recordMedicationAction`.
  - Emergency shortcuts: **Call 108 Ambulance** and **Call ASHA Harjit Kaur**.

---

## 4. Verification & Testing Instructions

1. **Verify Patient Invitation**:
   - Navigate to `/family`.
   - Click **Send Invitation**.
   - Enter name (e.g., `Gurminder Singh`), relationship (e.g., `Spouse`), and email (`caregiver@gmail.com`).
   - Click **Send Invitation**.
   - Notice the soothing **"Caregiver Invitation Dispatched!"** modal showing the generated 6-digit OTP and direct WhatsApp link.

2. **Verify Direct Link Acceptance**:
   - Copy the direct link or open:
     `http://localhost:5173/family?token=inv-demo123&otp=849201`
   - Notice the **Accept Family Invitation** dialog opens with token and OTP pre-filled.
   - Click **Verify & Accept Access**.

3. **Verify Caregiver Recovery Monitor**:
   - Switch to **Caregiver Oversight** tab.
   - Observe patient details (`Gurpreet Kaur`, `Post-Cholecystectomy - Day 4 of 15`).
   - Click **Confirm Dose Taken** on *Pantoprazole 40mg*.
   - Confirm status updates immediately to `Confirmed Taken`.

---

## 5. Ready-to-Copy-Paste AI Prompts

### Prompt A: Review & Validate Family Circle Workflow
```text
Review the Family Circle and Caregiver Oversight module in RecoveryCompass.
Verify that:
1. POST /plans/:planId/family/invite triggers sendCaregiverInvitationEmail in NotificationsService and returns token and otp.
2. The frontend FamilyPage.tsx renders the invitation handover modal with copyable OTP and WhatsApp direct link.
3. Query parameters (?token=...&otp=...) auto-populate the invitation acceptance dialog.
4. The Caregiver Oversight tab renders today's medication schedule with working "Confirm Dose Taken" actions and emergency 108 shortcuts.
5. All tests pass with zero TypeScript build errors.
```

### Prompt B: Extend Caregiver Notification Webhooks
```text
Extend the RecoveryCompass Family Circle notification engine:
1. When a patient logs a pain score >= 7 or fever >= 101.5°F, trigger an automatic SMS and push notification to all family members with RECEIVE_ALERTS permission.
2. In backend/src/safety/safety.service.ts, query active familyMemberships for the patient and queue urgent notifications via NotificationsService.sendSafetyAlert().
3. Maintain zero-downtime offline compatibility via outbox synchronization.
```

