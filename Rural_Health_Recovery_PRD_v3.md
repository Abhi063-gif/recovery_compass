# Rural Health Recovery & Care Navigation Platform - PRD v3.0 (Web Application)

**Hackathon:** Smart India Hackathon, SIH26133 (Government of Maharashtra)
**Theme:** Accessibility and quality of public healthcare services, particularly in rural and underserved areas
**Previous name:** Recovery Compass - Post Surgery Recovery Assistant (v1.0)
**Platform type:** Responsive web application (installable from the browser as a PWA, no app store). **No native mobile app. No WhatsApp or other paid messaging API.**
**One-line idea:** An offline-first platform that turns hospital discharge and treatment instructions into a voice-guided, day-by-day care plan in the patient's own language, and connects patients, families and ASHA/ANM health workers so that no one falls through the gaps after leaving the hospital.

---

## 1. What Changed From v2

| Area | v2 | v3 |
|------|----|----|
| Delivery | PWA plus optional Android app (Capacitor) | **Web application only.** Responsive for phones (patients, ASHA) and laptops (ANM, PHC, Admin dashboards). Installable from the browser, no app store |
| Offline reminders | Android local notifications were the primary layer | **Phone-calendar alarms (.ics) are the primary offline layer**, plus in-app alarms, Web Push backup and ASHA visits (section 7.3) |
| WhatsApp | Listed as an optional nice-to-have in v1 | **Removed.** No WhatsApp Business API (Meta pricing), no paid SMS gateway, no IVR |
| Messaging | Mixed | Only free channels: in-app, Web Push, calendar, ASHA visits and calls, prefilled `sms:` link sent from the user's own phone plan |
| Browser storage | Assumed durable | Explicit durability plan: persistent storage request, install to home screen, frequent sync, backup indicator (7.9) |
| Browser support | Not specified | Chrome on Android primary; Safari iOS and desktop browsers secondary |
| Cost | Mostly free | **Zero recurring paid services** beyond free tiers of the required stack |

**Unchanged principles:** offline-first; the platform *extracts, organizes, schedules and escalates*; it never diagnoses or gives treatment advice. All v2 features, roles, pathways, languages and the scheme module remain.

---

## 2. Assumptions (edit these first)

| # | Assumption | Why |
|---|------------|-----|
| A1 | Hackathon demo language tier 1: English, Hindi, Marathi. Punjabi, Bengali, Tamil use the same architecture (string files + audio) and ship as tier 2 | Quality of translation matters more than count; all five are in scope |
| A2 | Target device is a low-cost Android phone (Chrome) shared within a household or carried by the ASHA | Most realistic rural device |
| A3 | Delivered only as a responsive web application (installable PWA, no native app, no app store) | Lower cost, one codebase, instant updates; reminder design adapts to browser limits (see 7.3) |
| A4 | Government scheme rules and PHC data are loaded from curated, source-linked datasets that must be verified before real use | Rules change; wrong eligibility info harms trust |
| A5 | Demo uses synthetic and anonymized patient data only | Privacy and free-tier AI terms |
| A6 | Red-flag rules and pathway thresholds are marked "prototype - clinician review pending" | Safety |
| A7 | Primary browser is current Chrome on Android; desktop browsers for ASHA, ANM and PHC dashboards; iOS Safari supported as secondary | Matches rural device reality |
| A8 | No paid messaging or telephony services (no WhatsApp Business API, no SMS gateway, no IVR) | Keep the product free to run; these services are paid |

---

## 3. Problem Statement and SIH Fit

Patients in rural and underserved areas leave hospital with instructions they cannot easily read, understand or follow. Distance, poor connectivity, low literacy and fragmented care compound the problem.

| Problem (from the SIH theme) | Platform response |
|------------------------------|-------------------|
| Patients do not understand discharge instructions | Document-to-plan extraction, plain language, voice and pictograms in local language |
| Rural patients miss follow-ups | Follow-up and test scheduling, reminders, ASHA visit scheduling, calendar export |
| Poor medication adherence | Offline medicine reminders, dose logging, ASHA medication verification |
| Families struggle with post-hospital care | Consent-based family circle, daily task checklist, red-flag guidance |
| Low-literacy users need simplified guidance | Voice-first UI, icons, large buttons, audio for every task |
| Weak last-mile link to public health system | ASHA/ANM workflow, risk escalation, PHC and scheme navigation |
| Unreliable internet | Offline-first architecture for plan, reminders, logs and red flags |

---

## 4. Target Users and Roles

| Role | Description | Key needs |
|------|-------------|-----------|
| **Patient** | Adult or older adult recovering or managing a condition at home | "Tell me what to do today", in my language, by voice |
| **Family caregiver** | Spouse, child or relative who manages medicines and visits | Shared view, reminders, knowing when to worry |
| **ASHA worker** | Community health worker visiting households | Caseload list, visit schedule, adherence checks, escalate risk, works offline |
| **ANM** | Auxiliary nurse midwife supervising several ASHAs | Review escalations, see high-risk patients, confirm referrals |
| **Village Health Volunteer (VHV)** | Local volunteer supporting patients | Light access: view assigned patients, log visits, call for help |
| **PHC Medical Officer** | Doctor at the Primary Health Centre | Read-only summary of escalated patients (v1 lite dashboard) |
| **Admin** | Programme or technical admin | Manage rules, datasets, languages, user onboarding; no access to patient content |

Permission summary: patients own their data; caregivers, ASHA, ANM, VHV and PHC access only with recorded consent and an assignment relationship; every access is logged.

---

## 5. USP: Why This Beats Other Options

### 5.1 Landscape

| Alternative | Strength | Gap this platform fills |
|-------------|----------|-------------------------|
| General AI chatbots | Can explain a pasted document | Need internet and literacy; free-form answers can hallucinate doses; no reminders, logging, ASHA link or safety gate |
| Symptom checker apps | Fast triage | Give AI medical advice; not tied to the patient's own discharge instructions; English-centric |
| Medicine reminder apps | Pill alarms | Manual entry, no restrictions, tests, follow-ups, red flags or health-worker loop |
| Government programme apps and portals (telemedicine, health ID, TB, maternal and child tracking) | Authoritative, programme-specific | To our understanding, mostly record or serve one programme at a time; this platform is a patient-facing daily guidance and navigation layer that can complement them (validate during research) |
| Hospital patient portals | Store records | Raw documents, internet-dependent, hospital-specific |

### 5.2 Differentiators

1. **Offline-first, not offline-tolerant.** Plan, reminders, logs, red-flag screening, scheme checker and nearest-PHC list all work with no internet. Sync happens later.
2. **Extraction, not advice.** AI structures what the clinician wrote; it adds no clinical content.
3. **Source-linked and verified.** Every task links to the line in the document; patient or ASHA confirms before reminders activate.
4. **ASHA/ANM-in-the-loop.** Human community health workers verify medicines, visit high-risk patients and escalate, with a transparent rule-based risk score.
5. **Deterministic, on-device red flags.** Rule-based, versioned, works offline, one-tap call to emergency numbers.
6. **Voice-first, local language, low literacy.** Audio, pictograms and templated translations rather than free machine translation of medical instructions.
7. **Navigation to real services.** Scheme eligibility checklist, nearest PHC, telemedicine information, all cached for offline.
8. **Pathway templates.** One engine, five pathways, extensible.
9. **Honest uncertainty.** Low-confidence fields are flagged, never guessed.

### 5.3 Pitch line
> "Other tools explain a discharge paper if you have internet and can read. We make sure a rural patient actually follows it: in their language, by voice, offline, with their ASHA watching for danger."

---

## 6. Features

### 6.1 Core patient features (P0)

| # | Feature | Description |
|---|---------|-------------|
| F1 | Pathway onboarding | Choose pathway, discharge or diagnosis date, language, caregiver, ASHA assignment; voice-guided |
| F2 | Document capture and extraction | Photo/PDF or manual entry; extract medicines, timing, follow-up, tests, restrictions, food and fluid guidance, tasks, symptoms to track, emergency signs |
| F3 | Verify and confirm | Side-by-side original and extracted data, confidence flags, edit; ASHA can verify |
| F4 | Daily recovery timeline | Today view with at most 3 primary actions, audio per card, editable |
| F5 | Reminders | Medicines, tasks, follow-up and tests; calendar alarms work offline, in-app alarms and push as extra layers (section 7.3) |
| F6 | Symptom, pain and vitals logging | Pain score, pathway-specific logs (BP, blood sugar, fetal movement note, TB doses and side effects); voice or tap |
| F7 | Red-flag screen | On-device rules; "contact clinician / emergency now"; no AI treatment advice |
| F8 | Follow-up and test scheduling | Dates from document, one-tap add to phone calendar (.ics with alarms), reminder before visit |
| F9 | Questions for your doctor | Generated from plan, logs and unclear items; viewable offline |
| F10 | Progress view | Pictorial progress, adherence, trends |
| F11 | Family access | Consent-based, revocable |

### 6.2 Community health worker features (P0/P1)

| # | Feature | Description |
|---|---------|-------------|
| C1 | Offline caseload | List of assigned patients with risk colour (green/amber/red), downloaded when online |
| C2 | Visit scheduling | Suggested visit dates from pathway and risk; ASHA edits; visit log (offline) |
| C3 | Medication verification | Checklist at visit: medicine present, taken as per plan, remaining count, side effects; marks plan "ASHA verified" |
| C4 | Risk score | Transparent rule-based score from missed doses, red-flag logs, missed follow-ups, pathway-specific factors; thresholds configurable |
| C5 | Escalation workflow | ASHA -> ANM -> PHC Medical Officer; statuses: raised, acknowledged, visited, resolved or referred; offline-queued; optional prefilled SMS to the ANM sent over the phone's own network |
| C6 | Assisted registration | ASHA registers a patient and enters or scans instructions on their behalf |

### 6.3 Government scheme and care navigation module (P1)

| # | Feature | Description |
|---|---------|-------------|
| G1 | Scheme eligibility checker | Short guided questionnaire (state, ration/household category, pathway, age, pregnancy status) producing "likely eligible / may be eligible / check with Ayushman Mitra", with required documents. Covers national health insurance scheme (Ayushman Bharat PM-JAY), relevant Maharashtra schemes, maternal benefit schemes, TB nutrition support. **Indicative only, with official source link and "verify at your PHC"** |
| G2 | Nearby PHC and facility finder | Cached facility dataset; nearest by device GPS (works offline); phone number, services, "call" and "open in maps" |
| G3 | Telemedicine information | Offline-readable steps and numbers for the national telemedicine service and state helplines; link out when online |
| G4 | Plain-language explainer | Optional AI explanation of a scheme, grounded only in the curated scheme text, with source shown; hidden when offline (static explainers remain) |

Eligibility is rule-based (deterministic) so it works offline and is explainable. AI only rephrases curated content.

### 6.4 Pathway templates (P0 for surgery plus one; rest P1)

A template defines: task structure, what to log, how often ASHA visits, which scheme links to show, and the red-flag ruleset. **Templates never add clinical instructions; medicine doses and clinical thresholds come from the patient's document or a clinician-reviewed config.**

| Pathway | Typical daily and periodic items (structure only) | Illustrative red-flag themes (clinician review required) |
|---------|--------------------------------------------------|----------------------------------------------------------|
| Post-surgery | Medicines, wound care as instructed, activity limits, pain log, follow-up, tests | Heavy bleeding, wound discharge, high fever, severe pain, breathlessness |
| Pregnancy (antenatal and postnatal) | Check-up visits, supplements as prescribed, tests, birth plan and facility, postnatal check, newborn follow-up | Vaginal bleeding, severe headache or blurred vision, convulsions, reduced fetal movement, fever, fluid leakage |
| Diabetes | Medicines, sugar readings log, diet guidance from document, foot check, follow-up | Very low or very high readings (thresholds from clinician), confusion, unusual drowsiness |
| Tuberculosis | Daily dose confirmation (self, family or ASHA/DOT provider), side-effect log, monthly checks, missed dose count | Repeated missed doses, jaundice, vomiting that stops medicines, coughing blood |
| Hypertension | Medicines, BP log, salt and lifestyle guidance from document, follow-up | Very high BP (clinician threshold), chest pain, severe headache, weakness on one side |

### 6.5 Not in version 1
- Diagnosis, dose recommendation or any treatment advice
- Free-form medical chatbot
- Teleconsultation video calls, e-prescriptions, payments
- Full hospital or health-ID integration (planned: ABHA/ABDM linking in v2)
- Wearables
- Native Android or iOS app
- WhatsApp Business API, paid SMS gateways or IVR
- Offline voice recognition models (see 7.5)

---

## 7. Offline-First Design (Core Component)

Offline is the central design constraint, not a feature toggle. Every flow below must work in airplane mode.

### 7.1 Offline capability matrix

| Capability | Offline? | How |
|------------|----------|-----|
| Open app and view today's plan | Yes | App shell cached by service worker; plan in local database |
| Medicine and task reminders | Yes | Phone-calendar alarms plus in-app alarms (7.3); closed-app timing relies on the calendar layer |
| Log symptoms, pain, vitals, doses | Yes | Written locally, queued for sync |
| Red-flag screening | Yes | Ruleset cached on device and versioned |
| Voice prompts (audio output) | Yes | Pre-recorded clips cached; device text-to-speech where available |
| Voice input (speaking a symptom) | Limited | Browser speech recognition typically needs internet; offline fallback is icon and tap input |
| Create plan from manual entry | Yes | Pathway forms with local medicine autocomplete |
| Create plan from photo | Partly | Photo saved offline; on-device OCR (Tesseract.js with cached language data) gives a draft; better extraction when online |
| Scheme eligibility checker | Yes | Rules and scheme data cached |
| Nearest PHC list | Yes | Cached facility data plus GPS distance calculation; map tiles only when online |
| ASHA caseload, visit log, medication verification | Yes | Downloaded caseload; actions queued |
| Escalation | Queued, plus fallback | Queued for sync; one-tap call or prefilled SMS over cellular |
| Family sharing, ASHA dashboards updating | No (needs sync) | Updates appear after sync |
| Document upload to Cloudinary | Queued | Uploaded when online |

### 7.2 Local-first data architecture

1. **Local store:** IndexedDB via Dexie.js holds plans, tasks, reminders, logs, caseload, rules, scheme data, facility data, translation and audio manifests.
2. **Client-generated IDs:** every record gets a UUID on the device so it can be created offline without server coordination.
3. **Outbox queue:** every change is written to the local store and an `outbox` table; the sync worker sends it when online.
4. **Sync protocol:** push changes (idempotent, so retries are safe) then pull server changes since a cursor. Two Node.js endpoints: `POST /sync/push` and `GET /sync/pull?since=`.
5. **Triggers:** online event, app open, periodic timer, manual "Sync now". Background Sync API is used where supported; because iOS Safari lacks it, sync on open is the guaranteed fallback.
6. **Retry:** exponential backoff; sync status icon always visible ("Saved on phone / Synced").
7. **Server of record:** Supabase Postgres with Row Level Security; Node.js validates, applies and merges.

### 7.3 Offline reminders (web-only, honest design)

A website cannot guarantee a custom alarm when the browser is closed and the phone is offline. The scheduled-notification browser feature that once existed in Chrome was experimental and is not dependable, background sync runs at times the browser chooses, and Web Push needs a connection when the message is sent. So the platform uses the **phone's own calendar as the offline alarm engine**, and adds other layers around it.

| Layer | Mechanism | Works offline, app closed? | Reliability | Notes |
|-------|-----------|----------------------------|-------------|-------|
| 1 | **Calendar alarms:** the app generates an .ics file on the device (recurring events with alarms) and the user adds it to the phone calendar | Yes | High | Primary guaranteed layer; works on Android and iOS with no internet and no server |
| 2 | **In-app alarms** while the app is open: timers, sound, spoken prompt, screen wake lock | Yes | Only while open | Gives the big Taken / Skip action |
| 3 | **On-open catch-up:** due and missed list with voice | Yes | High for awareness, not for timing | Runs every time the app opens |
| 4 | **Web Push** (VAPID, free, `web-push` library) to the installed PWA | No, needs a connection at delivery | Medium | Short expiry and high urgency; on iOS it works only for web apps added to the home screen (iOS 16.4 and later) |
| 5 | **ASHA / VHV human layer:** visit schedule and a call list with one-tap `tel:` links | Yes (cellular) | High | Covers patients who miss digital reminders |

Design rules:
- Reminder times are computed on the device from the confirmed plan; the .ics file is generated client-side, so it works with no internet.
- Each medicine timing becomes a recurring calendar event with an end date and an alarm at event time. Follow-up and test dates become events with alarms one day and two hours before.
- Event titles are built from the same human-reviewed language templates, for example "Take medicine: {medicine}, {dose}", and add no clinical advice.
- Events carry stable IDs so re-importing an updated plan updates rather than duplicates in most calendar apps; behaviour varies, so the app shows simple "remove old reminders" instructions when needed.
- When the plan changes, the app shows an "Update your phone calendar" banner until the user re-exports.
- Adding to the calendar is a **required, guided, read-aloud onboarding step**; an ASHA can do it on the patient's phone at the first visit.
- Adherence logging stays in the app: the calendar alarm is the nudge, and the dose is logged when the app is opened. Missed-dose detection runs on open (no log by next due time plus a grace period) and reaches the ASHA at sync. This is a known limit: detection depends on the app being opened, which the ASHA verification visit covers.
- Calendar apps are generally more reliable than websites for alarms, but this must be verified on the target phones, including battery-saver settings.
- If funding allows later, a native wrapper could be added around the same React code; it is out of scope now.
- **Prototype acceptance test:** airplane mode, browser closed, the calendar alarm fires at the scheduled time, repeated on at least three phone brands.

### 7.4 Conflict resolution

| Data type | Strategy |
|-----------|----------|
| Logs (symptom, pain, vitals, dose taken, visit records) | Append-only events, no conflicts; merged by timestamp |
| Plan edits | Field-level last-write-wins with edit history |
| Clinical-critical fields (medicine, dose, frequency, follow-up date) | If two devices changed them, show both versions and require re-confirmation; plan marked "needs review" |
| Deletions | Soft delete with tombstones |
| Escalation status | Status moves only forward; every transition is an event |

Clock drift is handled by storing both device time and server receive time.

### 7.5 Offline voice

- **Output (reliable):** a set of short pre-recorded clips per language for core phrases ("Take your medicine now", "Your pain score today?", danger warning), cached by the service worker. Device text-to-speech reads dynamic text where a voice for that language exists; otherwise the clip or icon is used.
- **Input (best effort):** speech recognition in the browser generally needs internet. Offline, symptom logging falls back to large icon buttons. Fully offline speech recognition (on-device models) is a v2 research item.

### 7.6 Offline identity and security

- Registration and first login need internet once (or ASHA-assisted).
- After login the device keeps a session and a **local PIN** to unlock the app offline.
- Sensitive local fields are encrypted with a key derived from the PIN (Web Crypto, AES-GCM); auto-lock after inactivity.
- Lost or shared device: access revoked at next sync; ASHA devices have stricter lock and session rules.
- Offline sync tokens are refreshed when connectivity returns; expired sessions only block *sync*, never reading the plan or logging data.

### 7.7 Offline data downloads

On first online use, the app downloads and caches: translation files, fonts, audio clips, OCR language data, pathway templates, red-flag rules, scheme data, facility data for the user's district and the local drug name list. A visible "Offline ready" checklist shows what is cached. Dataset versions are checked on every sync.

### 7.8 Offline acceptance criteria

1. With airplane mode on, a user can open the app, see today's plan, hear it, mark a dose, log a symptom and trigger a red-flag alert.
2. After the user adds reminders to the phone calendar, alarms fire at the scheduled time with the browser closed and no internet.
3. A plan created offline from manual entry appears on the ASHA's dashboard after sync with no data loss.
4. Two logs created offline on two devices both survive sync.
5. Killing the app during sync never creates duplicates or loses data.
6. Cached datasets and rules show their version and date.

### 7.9 Browser storage durability (web-only risk)

Data lives in the browser, which can clear it. Mitigations:
1. Request persistent storage (`navigator.storage.persist()`) after first use.
2. Prompt users to install the web app to the home screen (still no app store); this improves durability and, on iOS Safari, avoids cleanup of unused sites.
3. Sync often; the status icon shows "Not backed up yet (N items)" until the server confirms.
4. ASHA devices sync at least once a day.
5. After login on a new browser the full plan and history are re-downloaded from the server.
6. One-tap export of the plan as a printable page and as .ics.

---

## 8. Languages and Voice-First Experience

| Item | Requirement |
|------|-------------|
| Languages | English, Hindi, Marathi (tier 1 for demo); Punjabi, Bengali, Tamil (tier 2); extensible |
| Safety-critical text | Medicine instructions, red flags and reminders are generated from **human-reviewed templates** (for example "{medicine}, {dose}, {when}") in each language, not free machine translation |
| Review | Native-speaker and ASHA review of all templates and audio scripts before real use |
| Fonts and scripts | Noto Sans families per script, bundled locally for offline |
| Voice output | Pre-recorded audio plus device text-to-speech; "tap to hear" on every card |
| Voice input | Online best effort; offline icon fallback |
| Low-literacy design | Pictograms (sun, moon, food, water, pill), colour coding, large touch targets, maximum 3 primary actions per screen, no jargon |
| Language switch | One-tap, remembered; ASHA can set a patient's language |

---

## 9. Accuracy Strategy

Accuracy is the product. Updated for rural and offline realities:

1. **Capture:** image quality check (blur, glare, rotation) with retake prompt; Cloudinary preprocessing (contrast and clean-up) when online.
2. **OCR:** Tesseract.js on device (offline, free) with multilingual data; optional server or AI pass when online. Handwritten prescriptions are a known weak spot, so manual and ASHA-assisted entry are first-class paths, not fallbacks.
3. **Structured extraction:** rule-based parser plus medicine dictionary as the offline baseline; optional LLM extraction when online outputting **strict JSON schema** with `value`, `source_text`, `confidence`.
4. **Validation (non-LLM):** medicine names against a drug list with fuzzy matching; normalization of frequency terms (OD, BD, TDS, HS, SOS); dose sanity ranges; date logic; duplicate and conflict checks.
5. **Mandatory confirmation:** nothing activates until the patient or ASHA confirms; unconfident fields are marked.
6. **Plan generation:** deterministic scheduler; rephrasing uses templates, and the output is checked to contain the same drug, dose and timing.
7. **Safety filter:** blocks any added medication or treatment advice.
8. **Evaluation set:** 50 or more synthetic documents covering typed, scanned and handwritten-style, across the five pathways and languages.
9. **Privacy rule for AI:** use only synthetic data with any hosted free AI tier, since free-tier terms may allow provider use of submitted data; verify terms before any real data.

| Metric | Prototype target |
|--------|------------------|
| Medicine name, dose, frequency exact match (clean typed docs) | >= 95% |
| Follow-up date accuracy | >= 98% |
| Red-flag recall on clinician-labelled test cases | 100% |
| Errors surfaced as low-confidence | >= 90% |
| Invented medical advice in outputs | 0 |
| Calendar alarm fired on time (airplane mode, browser closed, 20 runs on 3 phones) | >= 95% |
| Sync without data loss or duplicates (stress test) | 100% |

These are goals to measure against, not claims of current performance.

---

## 10. Technology Constraints (Summary for the TRD)

Required: **React, Node.js, Supabase, Cloudinary.** Everything else must be free and reliable.

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React (Vite) PWA, Tailwind, i18next, Recharts | Fast, offline-capable |
| Offline | Service worker (Workbox via vite-plugin-pwa), Dexie.js (IndexedDB) | Free, mature |
| Browser APIs | Service worker, Cache Storage, IndexedDB, Web Push, Wake Lock, speech synthesis (recognition online only), Geolocation | Everything needed runs in the browser |
| Backend | Node.js with Express, zod validation, JWT verification | Sync, extraction orchestration, escalation logic |
| Database and auth | Supabase Postgres, Row Level Security, Supabase Auth, Realtime for dashboards | Required stack; choose the Mumbai region for data locality |
| Images | Cloudinary (authenticated delivery, signed uploads from Node) | Required stack; medical images must not be public |
| OCR | Tesseract.js (free, on-device) | Offline OCR |
| Optional AI | Free-tier LLM API (online only, synthetic data) or none | Extraction enhancement only |
| Reminders | Client-generated .ics calendar alarms (primary offline layer), in-app alarms, Web Push via VAPID (online backup) | See 7.3 |
| Messaging | None paid. SMS only from the user's own phone via prefilled `sms:` links; no WhatsApp Business API, SMS gateway or IVR | These services cost money |
| Maps | Leaflet with OpenStreetMap when online; list view offline | Free |
| Hosting | Static hosting for React (free tier), free-tier Node host, or local server for demo | Free |
| Testing | Vitest, Playwright with offline emulation, Lighthouse PWA audit, real phone airplane-mode test | Offline proof |

Free-tier cautions to plan for: limits and idle behaviour change over time (for example Supabase free projects can pause after inactivity and free Node hosts can cold-start), so verify current limits and add a keep-alive and a local-demo fallback.

Authentication note: SMS OTP generally needs a paid gateway. For the prototype use phone number as username plus a PIN (implemented on Supabase Auth with a derived identifier), ASHA-assisted registration, and email for staff. SMS OTP is a production upgrade.

---

## 11. User Stories and Acceptance Criteria

1. **Patient (offline):** As a patient with no signal, I want to hear today's plan in Marathi and mark my medicine taken. *AC:* Works in airplane mode; record syncs later.
2. **Patient:** I want my discharge paper turned into a plan. *AC:* Extraction or manual entry yields a confirmable plan; each item has source and confidence.
3. **Caregiver:** I want to see tasks and know when to seek help. *AC:* Consent required; revocable; red-flag alert visible.
4. **ASHA:** I want my high-risk patients first, even offline. *AC:* Caseload sorted by risk; visit logged offline; syncs.
5. **ASHA:** I want to verify medicines at a visit. *AC:* Checklist updates plan to "ASHA verified".
6. **ASHA/ANM:** I want to escalate a patient. *AC:* Escalation queued offline; call or SMS fallback; status trackable after sync.
7. **Patient:** I want to know which scheme I may qualify for and the nearest PHC. *AC:* Checker works offline, shows source and "verify at PHC"; PHC list shows distance.
8. **Pregnant woman:** I want visit and test reminders. *AC:* Pregnancy template, dates from documents or ASHA entry.
9. **TB patient:** I want daily dose confirmation. *AC:* Missed-dose count visible to ASHA after sync; escalation rule triggers.
10. **Patient:** I want questions to ask my doctor. *AC:* Generated from logs and unclear items, viewable offline.

---

## 12. Success Metrics

| Category | Metric |
|----------|--------|
| Access | Share of sessions used offline; offline task completion rate |
| Adherence | Dose adherence %; reminder-to-action rate |
| Follow-up | Follow-up and test completion rate (self-reported, ASHA-verified) |
| Care loop | Time from red flag or high-risk score to ASHA acknowledgement; escalations resolved |
| Community | Patients per ASHA onboarded; verification visits completed |
| Language and inclusion | Usage by language; share of voice interactions |
| Quality | Extraction accuracy, correction rate, sync success rate |
| Demo | End-to-end offline demo in under 5 minutes |

---

## 12a. Prototype Demo Flow (Hackathon)

1. ASHA signs in online and downloads caseload, rules, language and facility data ("Offline ready" check).
2. Switch to airplane mode.
3. ASHA registers a patient (Marathi), chooses a pathway, scans or enters discharge instructions.
4. Verify screen; plan generated; plan read aloud.
5. The phone-calendar alarm created from the plan fires with the browser closed and no internet; the in-app alarm and spoken prompt are shown when the app is open.
6. Patient logs a symptom that matches a red flag; the alert shows with a call button and a prefilled SMS to the ANM.
7. Run the scheme checker and nearest-PHC finder offline.
8. Turn the network on; sync completes; ANM/PHC dashboard shows the escalation and the risk change.

---

## 13. Safety, Ethics and Compliance

- Disclaimer on every plan: it reorganizes the clinician's instructions and does not replace medical advice.
- Emergency access always visible; emergency numbers (national emergency number and state ambulance numbers) configurable per state and callable offline.
- **Data protection:** align with the Digital Personal Data Protection Act, 2023 (consent, purpose limitation, minimization, deletion, special care for children's data); confirm applicable health-data requirements and ABDM alignment before real deployment.
- **Consent:** explicit, granular, revocable, stored with timestamp; consent screens read aloud.
- **Data minimization:** delete or restrict original document images after extraction where possible; private Cloudinary delivery; encryption in transit and at rest on the server and for sensitive local fields.
- **Audit:** access logs for every cross-role view.
- **Clinical governance:** red-flag rules, pathway thresholds and translated safety messages reviewed by qualified clinicians and native speakers before real use.
- **Inclusion:** accessible design for older adults and low vision; no dependence on literacy.
- Scheme information is indicative, source-linked and dated.

---

## 14. Non-Functional Requirements

- Works on low-end Android devices (target 2 GB RAM) and small screens
- Supported browsers: current Chrome on Android (primary); Safari on iOS, desktop Chrome, Edge and Firefox (secondary); dashboards responsive for laptops
- Initial cached package size kept as small as practical; heavy assets (OCR data, audio) downloaded on demand and shown in "Offline ready"
- Low battery and data use
- Plan view loads in under 2 seconds from local storage
- Accessible (large text, high contrast, WCAG AA aims)
- Reliable local data: no loss on app kill or phone restart

---

## 15. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Browser cannot fire custom alarms when closed and offline | Phone-calendar alarms (.ics) as primary layer; in-app, push and ASHA layers around it |
| User skips the add-to-calendar step or mutes calendar notifications | Guided read-aloud onboarding step; ASHA does it at first visit; on-open catch-up list |
| Browser storage cleared or evicted | Persistent storage request, install to home screen, frequent sync, backup indicator, re-download after login |
| Limited Web Push support on some browsers | Push is backup only; iOS push works only for home-screen web apps |
| Messaging costs | No WhatsApp Business API, SMS gateway or IVR; free channels only |
| OCR fails on handwriting | Manual and ASHA-assisted entry first-class; confidence flags |
| Wrong translation of safety text | Human-reviewed templates, native-speaker review |
| Wrong or outdated scheme info | Curated source-linked data, dated, "verify at PHC", admin update path |
| Sync conflicts or duplicates | Append-only logs, idempotent push, re-confirmation for critical fields |
| Missed red flag | Rule-based, conservative, 100% recall on test set |
| Shared or lost phone exposes data | PIN, local encryption, auto-lock, revoke at sync |
| Free-tier limits or downtime | Local demo fallback, keep-alive, minimal server dependence by design |
| AI free tier and privacy | Synthetic data only; rules-first extraction |
| ASHA overload or alert fatigue | Risk tiers, quiet green status, configurable thresholds |
| Scope creep | P0/P1 discipline; surgery plus one more pathway first |

---

## 16. Phasing

| Phase | Scope |
|-------|-------|
| **P0 (must demo)** | Offline-first core (plan, calendar-alarm export, in-app reminders, logs, red flags, sync), manual entry plus basic OCR, verify screen, ASHA caseload and escalation, Hindi/Marathi/English with audio, surgery plus one chronic or maternal pathway |
| **P1** | Remaining pathways, scheme checker and PHC finder, doctor questions, family access, tier 2 languages |
| **P2** | ABHA/ABDM integration, offline speech recognition, PHC dashboard expansion, optional free Telegram bot channel (adoption to be validated), native wrapper or SMS/IVR only if funding allows, analytics for programme managers |

---

## 17. Open Questions

1. Which pathways are shown in the live demo (suggested: surgery plus pregnancy or TB)?
2. Which district's PHC and scheme data should be preloaded?
3. Can a clinician and an ASHA be consulted to review red-flag rules and templates?
4. Which three test phones will be used to prove calendar alarms fire offline?
5. Preferred emergency numbers to configure for the demo state?

---

*Next documents in the workflow: TRD (sync design, Supabase RLS, client-side .ics generation), App Flow, UI/UX Brief, Backend Schema, Implementation Plan.*
