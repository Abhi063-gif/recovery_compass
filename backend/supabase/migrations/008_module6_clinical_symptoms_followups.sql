-- ============================================================
-- Recovery Compass — Supabase Migration: Module 6
-- Scope: Clinical Definitions, Symptoms, and Follow-ups (8 tables)
-- Tables: "PathwayTemplate", "SymptomDefinition", "SymptomLog",
--         "RedFlagRule", "RedFlagEvent", "FollowUp", "PendingTest",
--         "DoctorQuestion"
-- ============================================================

-- ── Step 1: Covering Indexes for Unindexed Foreign Keys ───────
CREATE INDEX IF NOT EXISTS "SymptomLog_symptomDefinitionId_idx"
  ON "public"."SymptomLog"("symptomDefinitionId");

CREATE INDEX IF NOT EXISTS "RedFlagEvent_ruleId_idx"
  ON "public"."RedFlagEvent"("ruleId");

CREATE INDEX IF NOT EXISTS "PendingTest_followUpId_idx"
  ON "public"."PendingTest"("followUpId");

-- ── Step 2: Enable Row Level Security ─────────────────────────
ALTER TABLE "public"."PathwayTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SymptomDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SymptomLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RedFlagRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RedFlagEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FollowUp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PendingTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DoctorQuestion" ENABLE ROW LEVEL SECURITY;

-- ── Step 3: Clean up previous policies on these 8 tables ──────
DROP POLICY IF EXISTS "public_select_pathway_template" ON "public"."PathwayTemplate";
DROP POLICY IF EXISTS "service_role_pathway_template" ON "public"."PathwayTemplate";

DROP POLICY IF EXISTS "public_select_symptom_definition" ON "public"."SymptomDefinition";
DROP POLICY IF EXISTS "service_role_symptom_definition" ON "public"."SymptomDefinition";

DROP POLICY IF EXISTS "user_select_symptom_log" ON "public"."SymptomLog";
DROP POLICY IF EXISTS "authorized_insert_symptom_log" ON "public"."SymptomLog";
DROP POLICY IF EXISTS "patient_update_symptom_log" ON "public"."SymptomLog";
DROP POLICY IF EXISTS "service_role_symptom_log" ON "public"."SymptomLog";

DROP POLICY IF EXISTS "authenticated_select_red_flag_rule" ON "public"."RedFlagRule";
DROP POLICY IF EXISTS "service_role_red_flag_rule" ON "public"."RedFlagRule";

DROP POLICY IF EXISTS "user_select_red_flag_event" ON "public"."RedFlagEvent";
DROP POLICY IF EXISTS "patient_update_red_flag_event" ON "public"."RedFlagEvent";
DROP POLICY IF EXISTS "service_role_red_flag_event" ON "public"."RedFlagEvent";

DROP POLICY IF EXISTS "user_select_follow_up" ON "public"."FollowUp";
DROP POLICY IF EXISTS "patient_update_follow_up" ON "public"."FollowUp";
DROP POLICY IF EXISTS "service_role_follow_up" ON "public"."FollowUp";

DROP POLICY IF EXISTS "user_select_pending_test" ON "public"."PendingTest";
DROP POLICY IF EXISTS "patient_update_pending_test" ON "public"."PendingTest";
DROP POLICY IF EXISTS "service_role_pending_test" ON "public"."PendingTest";

DROP POLICY IF EXISTS "user_select_doctor_question" ON "public"."DoctorQuestion";
DROP POLICY IF EXISTS "user_insert_doctor_question" ON "public"."DoctorQuestion";
DROP POLICY IF EXISTS "patient_update_doctor_question" ON "public"."DoctorQuestion";
DROP POLICY IF EXISTS "service_role_doctor_question" ON "public"."DoctorQuestion";

DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."PathwayTemplate";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."SymptomDefinition";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."SymptomLog";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."RedFlagRule";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."RedFlagEvent";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."FollowUp";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."PendingTest";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."DoctorQuestion";

-- ── Step 4: Privilege Grants / Revocations ────────────────────
-- Revoke patient/client write privileges on system catalogs and rules
REVOKE ALL ON TABLE "public"."PathwayTemplate" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."SymptomDefinition" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."RedFlagRule" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."SymptomLog" FROM anon;
REVOKE ALL ON TABLE "public"."RedFlagEvent" FROM anon;
REVOKE ALL ON TABLE "public"."FollowUp" FROM anon;
REVOKE ALL ON TABLE "public"."PendingTest" FROM anon;
REVOKE ALL ON TABLE "public"."DoctorQuestion" FROM anon;

-- Read-only catalog grants for users
GRANT SELECT ON TABLE "public"."PathwayTemplate" TO anon, authenticated;
GRANT SELECT ON TABLE "public"."SymptomDefinition" TO anon, authenticated;
GRANT SELECT ON TABLE "public"."RedFlagRule" TO authenticated;

-- Patient-specific clinical records
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."SymptomLog" TO authenticated;
GRANT SELECT, UPDATE ON TABLE "public"."RedFlagEvent" TO authenticated;
GRANT SELECT, UPDATE ON TABLE "public"."FollowUp" TO authenticated;
GRANT SELECT, UPDATE ON TABLE "public"."PendingTest" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."DoctorQuestion" TO authenticated;

-- Superuser and service role complete management
GRANT ALL ON TABLE "public"."PathwayTemplate" TO postgres, service_role;
GRANT ALL ON TABLE "public"."SymptomDefinition" TO postgres, service_role;
GRANT ALL ON TABLE "public"."RedFlagRule" TO postgres, service_role;
GRANT ALL ON TABLE "public"."SymptomLog" TO postgres, service_role;
GRANT ALL ON TABLE "public"."RedFlagEvent" TO postgres, service_role;
GRANT ALL ON TABLE "public"."FollowUp" TO postgres, service_role;
GRANT ALL ON TABLE "public"."PendingTest" TO postgres, service_role;
GRANT ALL ON TABLE "public"."DoctorQuestion" TO postgres, service_role;

-- ── Step 5: Policies for "PathwayTemplate" ───────────────────
-- Read-only catalog for onboarding & pathway exploration
CREATE POLICY "public_select_pathway_template"
  ON "public"."PathwayTemplate"
  FOR SELECT
  TO anon, authenticated
  USING ("isActive" = true);

CREATE POLICY "service_role_pathway_template"
  ON "public"."PathwayTemplate"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 6: Policies for "SymptomDefinition" ─────────────────
CREATE POLICY "public_select_symptom_definition"
  ON "public"."SymptomDefinition"
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "service_role_symptom_definition"
  ON "public"."SymptomDefinition"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 7: Policies for "RedFlagRule" ───────────────────────
-- Clients can inspect rules, but NEVER alter safety thresholds or triggers
CREATE POLICY "authenticated_select_red_flag_rule"
  ON "public"."RedFlagRule"
  FOR SELECT
  TO authenticated
  USING ("status" = 'ACTIVE' OR "status" = 'DRAFT');

CREATE POLICY "service_role_red_flag_rule"
  ON "public"."RedFlagRule"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 8: Policies for "SymptomLog" ────────────────────────
CREATE POLICY "user_select_symptom_log"
  ON "public"."SymptomLog"
  FOR SELECT
  TO authenticated
  USING (public.can_access_plan("planId"));

-- Patient OR caregiver with explicit LOG_SYMPTOMS permission can record logs
CREATE POLICY "authorized_insert_symptom_log"
  ON "public"."SymptomLog"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "loggedBy" = public.requesting_user_id()
    AND (
      EXISTS (
        SELECT 1 FROM "public"."RecoveryPlan" rp
        WHERE rp.id = "SymptomLog"."planId"
          AND (
            public.is_patient_owner(rp."patientProfileId")
            OR public.has_caregiver_permission(rp."patientProfileId", 'LOG_SYMPTOMS')
          )
      )
    )
  );

CREATE POLICY "patient_update_symptom_log"
  ON "public"."SymptomLog"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "SymptomLog"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "SymptomLog"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  );

CREATE POLICY "service_role_symptom_log"
  ON "public"."SymptomLog"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 9: Policies for "RedFlagEvent" ──────────────────────
CREATE POLICY "user_select_red_flag_event"
  ON "public"."RedFlagEvent"
  FOR SELECT
  TO authenticated
  USING (public.can_access_plan("planId"));

-- Patient can acknowledge or resolve an alert
CREATE POLICY "patient_update_red_flag_event"
  ON "public"."RedFlagEvent"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "RedFlagEvent"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "RedFlagEvent"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  );

CREATE POLICY "service_role_red_flag_event"
  ON "public"."RedFlagEvent"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 10: Policies for "FollowUp" ─────────────────────────
CREATE POLICY "user_select_follow_up"
  ON "public"."FollowUp"
  FOR SELECT
  TO authenticated
  USING (public.can_access_plan("planId"));

CREATE POLICY "patient_update_follow_up"
  ON "public"."FollowUp"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "FollowUp"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "FollowUp"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  );

CREATE POLICY "service_role_follow_up"
  ON "public"."FollowUp"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 11: Policies for "PendingTest" ──────────────────────
CREATE POLICY "user_select_pending_test"
  ON "public"."PendingTest"
  FOR SELECT
  TO authenticated
  USING (public.can_access_plan("planId"));

CREATE POLICY "patient_update_pending_test"
  ON "public"."PendingTest"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "PendingTest"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "PendingTest"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  );

CREATE POLICY "service_role_pending_test"
  ON "public"."PendingTest"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 12: Policies for "DoctorQuestion" ───────────────────
CREATE POLICY "user_select_doctor_question"
  ON "public"."DoctorQuestion"
  FOR SELECT
  TO authenticated
  USING (public.can_access_plan("planId"));

CREATE POLICY "user_insert_doctor_question"
  ON "public"."DoctorQuestion"
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_plan("planId"));

CREATE POLICY "patient_update_doctor_question"
  ON "public"."DoctorQuestion"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "DoctorQuestion"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "DoctorQuestion"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  );

CREATE POLICY "service_role_doctor_question"
  ON "public"."DoctorQuestion"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

