# Recovery Compass — Production-Quality Hackathon MVP

> **Recovery Compass** converts hospital discharge instructions into an understandable, verified, day-by-day recovery journey for patients and family caregivers.

---

## 👥 2-Person Parallel Team Architecture & Branch Strategy

To enable seamless, conflict-free collaboration on GitHub, the application is divided cleanly by domain ownership:

```mermaid
graph TD
    subgraph Foundation["Shared Foundation (main branch)"]
        Types[src/types/index.ts - Domain Models]
        Mocks[src/api/mocks/mockPlanData.ts - Synthetic Clinical Data]
        Shell[src/components/common/* - AppShell, Nav, TopBar, Banners]
        Stores[src/stores/* - Zustand State Slices]
    end

    subgraph DevA["Developer A: Ingestion, OCR & Clinical Safety Engine"]
        A1[Landing & Onboarding Flows]
        A2[Document Upload & Legibility Quality Check]
        A3[Side-by-Side OCR Verification with Coordinate Highlighting]
        A4[Low-Confidence Indicators & Inline Item Editor]
        A5[Plan Confirmation Gate & Doctor Questions Generator]
        A6[Safety Rules & ER Protocol Screen]
    end

    subgraph DevB["Developer B: Daily Recovery Journey, Tracker & Family"]
        B1[Daily Action Dashboard & Progress Ring]
        B2[14-Day Interactive Recovery Timeline]
        B3[Medication Reminders & Adherence Tracker]
        B4[30-Sec Fast Pain/Symptom Logger with Recharts]
        B5[Follow-Up Appointments & .ics Calendar Export]
        B6[Family Circle with Granular Consent Permissions]
    end

    Foundation --> DevA
    Foundation --> DevB
    DevA --> Main[PR / Merge to main]
    DevB --> Main
```

---

## 🛠️ Tech Stack

* **Framework**: React 18 + Vite + TypeScript (Strict Mode)
* **Styling**: Tailwind CSS + Custom Healthcare Palette & Accessible Tokens
* **Icons**: Lucide React
* **State Management**: Zustand
* **Visualizations**: Recharts (7-day Pain Trend, Checklist Completion Rate)
* **Routing**: React Router v6

---

## 🚀 Running the Project

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local dev server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Production build**:
   ```bash
   npm run build
   ```

---

## 🧪 Hackathon Demo Mode

The application includes a deterministic synthetic clinical case for **Laparoscopic Cholecystectomy (Eleanor Vance, MRN #90284-A)**:
* Click the **"Load Demo Case"** button in the TopBar at any time to populate full mock data.
* Test the **OCR Verification Workspace** with side-by-side highlighting.
* Test the **30-Second Symptom Logger** with temperature &gt; 101.0°F or shortness of breath to see the deterministic safety evaluator trigger the high-priority safety modal.
* Test the **Follow-Up Screen** to download a valid `.ics` calendar appointment.
* Test the **Family Circle** to configure 4 granular caregiver permissions.
