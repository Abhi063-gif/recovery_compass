import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/common/AppShell';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DocumentUploadPage } from '@/pages/DocumentUploadPage';
import { DocumentProcessingPage } from '@/pages/DocumentProcessingPage';
import { VerificationPage } from '@/pages/VerificationPage';
import { ConfirmPlanPage } from '@/pages/ConfirmPlanPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TimelinePage } from '@/pages/TimelinePage';
import { MedicationsPage } from '@/pages/MedicationsPage';
import { SymptomsPage } from '@/pages/SymptomsPage';
import { SafetyCheckPage } from '@/pages/SafetyCheckPage';
import { FollowUpsPage } from '@/pages/FollowUpsPage';
import { DoctorQuestionsPage } from '@/pages/DoctorQuestionsPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { FamilyPage } from '@/pages/FamilyPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { OfflinePage } from '@/pages/OfflinePage';
import { AdminPage } from '@/pages/AdminPage';
import { AshaDashboardPage } from '@/pages/AshaDashboardPage';
import { AnmDashboardPage } from '@/pages/AnmDashboardPage';
import { SchemesPage } from '@/pages/SchemesPage';
import { FacilitiesPage } from '@/pages/FacilitiesPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/onboarding/*" element={<OnboardingPage />} />

          {/* Document Ingestion & Verification */}
          <Route path="/documents" element={<Navigate to="/documents/upload" replace />} />
          <Route path="/documents/upload" element={<DocumentUploadPage />} />
          <Route path="/documents/processing/:id" element={<DocumentProcessingPage />} />
          <Route path="/verification/:planId" element={<VerificationPage />} />
          <Route path="/verification" element={<Navigate to="/verification/plan-chole-90284" replace />} />
          <Route path="/confirm-plan" element={<ConfirmPlanPage />} />

          {/* Daily Recovery Journey */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/today" element={<DashboardPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/timeline/*" element={<TimelinePage />} />

          {/* Meds & Symptom Logging */}
          <Route path="/medications" element={<MedicationsPage />} />
          <Route path="/medications/*" element={<MedicationsPage />} />
          <Route path="/symptoms" element={<SymptomsPage />} />
          <Route path="/symptoms/log" element={<SymptomsPage />} />
          <Route path="/symptoms/history" element={<SymptomsPage />} />

          {/* Safety & Red Flags */}
          <Route path="/safety" element={<SafetyCheckPage />} />
          <Route path="/safety/*" element={<SafetyCheckPage />} />

          {/* Follow-up & Doctor Questions */}
          <Route path="/follow-ups" element={<FollowUpsPage />} />
          <Route path="/follow-ups/*" element={<FollowUpsPage />} />
          <Route path="/doctor-questions" element={<DoctorQuestionsPage />} />

          {/* Progress & Family Circle */}
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/family/*" element={<FamilyPage />} />

          {/* Community Health Worker & Supervisor Portals */}
          <Route path="/asha" element={<AshaDashboardPage />} />
          <Route path="/community" element={<AshaDashboardPage />} />
          <Route path="/anm" element={<AnmDashboardPage />} />

          {/* Government Schemes & Public Health Facility Finder */}
          <Route path="/schemes" element={<SchemesPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />

          {/* Notifications, Offline, Admin & Settings */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
