import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/common/AppShell';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

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
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute message="Please sign in to configure your recovery profile.">
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding/*"
            element={
              <ProtectedRoute message="Please sign in to configure your recovery profile.">
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Document Ingestion & Verification — Strictly Protected */}
          <Route path="/documents" element={<Navigate to="/documents/upload" replace />} />
          <Route
            path="/documents/upload"
            element={
              <ProtectedRoute message="Please sign in or create an account to upload your discharge summary.">
                <DocumentUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/processing/:id"
            element={
              <ProtectedRoute message="Please sign in to view document extraction and clinical processing.">
                <DocumentProcessingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verification/:planId"
            element={
              <ProtectedRoute message="Please sign in to verify your clinical recovery plan.">
                <VerificationPage />
              </ProtectedRoute>
            }
          />
          <Route path="/verification" element={<Navigate to="/verification/plan-chole-90284" replace />} />
          <Route
            path="/confirm-plan"
            element={
              <ProtectedRoute message="Please sign in to confirm and activate your recovery plan.">
                <ConfirmPlanPage />
              </ProtectedRoute>
            }
          />

          {/* Daily Recovery Journey — Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute message="Please sign in to access your daily recovery dashboard.">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/today"
            element={
              <ProtectedRoute message="Please sign in to access your daily recovery dashboard.">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute message="Please sign in to view your 15-day recovery timeline.">
                <TimelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline/*"
            element={
              <ProtectedRoute message="Please sign in to view your 15-day recovery timeline.">
                <TimelinePage />
              </ProtectedRoute>
            }
          />

          {/* Meds & Symptom Logging — Protected */}
          <Route
            path="/medications"
            element={
              <ProtectedRoute message="Please sign in to manage your medications and dosage schedule.">
                <MedicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medications/*"
            element={
              <ProtectedRoute message="Please sign in to manage your medications and dosage schedule.">
                <MedicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptoms"
            element={
              <ProtectedRoute message="Please sign in to track and record symptoms.">
                <SymptomsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptoms/log"
            element={
              <ProtectedRoute message="Please sign in to log clinical symptoms.">
                <SymptomsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptoms/history"
            element={
              <ProtectedRoute message="Please sign in to review your symptom history.">
                <SymptomsPage />
              </ProtectedRoute>
            }
          />

          {/* Safety & Red Flags — Protected */}
          <Route
            path="/safety"
            element={
              <ProtectedRoute message="Please sign in to view emergency safety protocols and red flags.">
                <SafetyCheckPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safety/*"
            element={
              <ProtectedRoute message="Please sign in to view emergency safety protocols and red flags.">
                <SafetyCheckPage />
              </ProtectedRoute>
            }
          />

          {/* Follow-up & Doctor Questions — Protected */}
          <Route
            path="/follow-ups"
            element={
              <ProtectedRoute message="Please sign in to view your scheduled clinical follow-ups.">
                <FollowUpsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/follow-ups/*"
            element={
              <ProtectedRoute message="Please sign in to view your scheduled clinical follow-ups.">
                <FollowUpsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor-questions"
            element={
              <ProtectedRoute message="Please sign in to review questions for your doctor.">
                <DoctorQuestionsPage />
              </ProtectedRoute>
            }
          />

          {/* Progress & Family Circle — Protected */}
          <Route
            path="/progress"
            element={
              <ProtectedRoute message="Please sign in to view your recovery progress analytics.">
                <ProgressPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family"
            element={
              <ProtectedRoute message="Please sign in to manage your Family Circle and caregiver oversight.">
                <FamilyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/family/*"
            element={
              <ProtectedRoute message="Please sign in to manage your Family Circle and caregiver oversight.">
                <FamilyPage />
              </ProtectedRoute>
            }
          />

          {/* Frontline Community Health Worker Portals — Strictly ASHA & ANM Only */}
          <Route
            path="/asha"
            element={
              <ProtectedRoute
                allowedRoles={['ASHA', 'ANM', 'ADMIN']}
                message="Please sign in with verified ASHA or ANM credentials to access the community caseload."
              >
                <AshaDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute
                allowedRoles={['ASHA', 'ANM', 'ADMIN']}
                message="Please sign in with verified ASHA or ANM credentials to access the community caseload."
              >
                <AshaDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anm"
            element={
              <ProtectedRoute
                allowedRoles={['ASHA', 'ANM', 'ADMIN']}
                message="Please sign in with verified ANM supervisor or ASHA credentials to access clinical reviews."
              >
                <AnmDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Government Schemes & Public Health Facility Finder — Protected */}
          <Route
            path="/schemes"
            element={
              <ProtectedRoute message="Please sign in to check your eligibility for government health schemes.">
                <SchemesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facilities"
            element={
              <ProtectedRoute message="Please sign in to locate nearby PHCs, CHCs, and district hospitals.">
                <FacilitiesPage />
              </ProtectedRoute>
            }
          />

          {/* Notifications, Offline, Admin & Settings — Protected */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute message="Please sign in to view alerts and reminders.">
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/offline"
            element={
              <ProtectedRoute message="Please sign in to view offline recovery plans.">
                <OfflinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={['ADMIN']}
                message="Administrative privileges required to access system settings."
              >
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute message="Please sign in to manage account settings and privacy preferences.">
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/*"
            element={
              <ProtectedRoute message="Please sign in to manage account settings and privacy preferences.">
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
