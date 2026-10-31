-- ============================================================
-- Recovery Compass — Supabase Migration: Module 5
-- Scope: Plans, Tasks, and Medication (7 tables)
-- Tables: "RecoveryPlan", "PlanVersion", "RecoveryTask", "TaskEvent",
--         "Medication", "MedicationSchedule", "MedicationEvent"
-- ============================================================

-- ── Step 0: Helper Functions for Plan Access Control ──────────
CREATE OR REPLACE FUNCTION public.can_access_plan(p_plan_id text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."RecoveryPlan" rp
    WHERE rp.id = p_plan_id
      AND (
        public.is_patient_owner(rp."patientProfileId")
        OR public.has_caregiver_permission(rp."patientProfileId", 'VIEW_PLAN')
      )
  );
$$;

-- ── Step 1: Covering Index for RecoveryPlan.pathwayTemplateId ─
CREATE INDEX IF NOT EXISTS "RecoveryPlan_pathwayTemplateId_idx"
  ON "public"."RecoveryPlan"("pathwayTemplateId");

-- ── Step 2: Enable Row Level Security ─────────────────────────
ALTER TABLE "public"."RecoveryPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PlanVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RecoveryTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TaskEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Medication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MedicationSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MedicationEvent" ENABLE ROW LEVEL SECURITY;

-- ── Step 3: Clean up previous policies on these 7 tables ──────
DROP POLICY IF EXISTS "user_select_recovery_plan" ON "public"."RecoveryPlan";
DROP POLICY IF EXISTS "patient_update_recovery_plan" ON "public"."RecoveryPlan";
DROP POLICY IF EXISTS "service_role_recovery_plan" ON "public"."RecoveryPlan";

DROP POLICY IF EXISTS "user_select_plan_version" ON "public"."PlanVersion";
DROP POLICY IF EXISTS "service_role_plan_version" ON "public"."PlanVersion";

DROP POLICY IF EXISTS "user_select_recovery_task" ON "public"."RecoveryTask";
DROP POLICY IF EXISTS "patient_update_recovery_task" ON "public"."RecoveryTask";
DROP POLICY IF EXISTS "service_role_recovery_task" ON "public"."RecoveryTask";

DROP POLICY IF EXISTS "user_select_task_event" ON "public"."TaskEvent";
DROP POLICY IF EXISTS "user_insert_task_event" ON "public"."TaskEvent";
DROP POLICY IF EXISTS "service_role_task_event" ON "public"."TaskEvent";

DROP POLICY IF EXISTS "user_select_medication" ON "public"."Medication";
DROP POLICY IF EXISTS "patient_update_medication" ON "public"."Medication";
DROP POLICY IF EXISTS "service_role_medication" ON "public"."Medication";

DROP POLICY IF EXISTS "user_select_medication_schedule" ON "public"."MedicationSchedule";
DROP POLICY IF EXISTS "service_role_medication_schedule" ON "public"."MedicationSchedule";

DROP POLICY IF EXISTS "user_select_medication_event" ON "public"."MedicationEvent";
DROP POLICY IF EXISTS "authorized_insert_medication_event" ON "public"."MedicationEvent";
DROP POLICY IF EXISTS "service_role_medication_event" ON "public"."MedicationEvent";

DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."RecoveryPlan";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."PlanVersion";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."RecoveryTask";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."TaskEvent";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."Medication";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."MedicationSchedule";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."MedicationEvent";

-- ── Step 4: Privilege Grants / Revocations ────────────────────
REVOKE ALL ON TABLE "public"."RecoveryPlan" FROM anon;
REVOKE ALL ON TABLE "public"."PlanVersion" FROM anon;
REVOKE ALL ON TABLE "public"."RecoveryTask" FROM anon;
REVOKE ALL ON TABLE "public"."TaskEvent" FROM anon;
REVOKE ALL ON TABLE "public"."Medication" FROM anon;
REVOKE ALL ON TABLE "public"."MedicationSchedule" FROM anon;
REVOKE ALL ON TABLE "public"."MedicationEvent" FROM anon;

GRANT SELECT, UPDATE ON TABLE "public"."RecoveryPlan" TO authenticated;
GRANT SELECT ON TABLE "public"."PlanVersion" TO authenticated;
GRANT SELECT, UPDATE ON TABLE "public"."RecoveryTask" TO authenticated;
GRANT SELECT, INSERT ON TABLE "public"."TaskEvent" TO authenticated;
GRANT SELECT, UPDATE ON TABLE "public"."Medication" TO authenticated;
GRANT SELECT ON TABLE "public"."MedicationSchedule" TO authenticated;
GRANT SELECT, INSERT ON TABLE "public"."MedicationEvent" TO authenticated;

GRANT ALL ON TABLE "public"."RecoveryPlan" TO postgres, service_role;
GRANT ALL ON TABLE "public"."PlanVersion" TO postgres, service_role;
GRANT ALL ON TABLE "public"."RecoveryTask" TO postgres, service_role;
GRANT ALL ON TABLE "public"."TaskEvent" TO postgres, service_role;
GRANT ALL ON TABLE "public"."Medication" TO postgres, service_role;
GRANT ALL ON TABLE "public"."MedicationSchedule" TO postgres, service_role;
GRANT ALL ON TABLE "public"."MedicationEvent" TO postgres, service_role;

-- ── Step 5: Policies for "RecoveryPlan" ───────────────────────
CREATE POLICY "user_select_recovery_plan"
  ON "public"."RecoveryPlan"
  FOR SELECT
  TO authenticated
  USING (
    public.is_patient_owner("patientProfileId")
    OR public.has_caregiver_permission("patientProfileId", 'VIEW_PLAN')
  );

CREATE POLICY "patient_update_recovery_plan"
  ON "public"."RecoveryPlan"
  FOR UPDATE
  TO authenticated
  USING (public.is_patient_owner("patientProfileId"))
  WITH CHECK (public.is_patient_owner("patientProfileId"));

CREATE POLICY "service_role_recovery_plan"
  ON "public"."RecoveryPlan"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 6: Policies for "PlanVersion" ────────────────────────
CREATE POLICY "user_select_plan_version"
  ON "public"."PlanVersion"
  FOR SELECT
  TO authenticated
  USING (public.can_access_plan("planId"));

CREATE POLICY "service_role_plan_version"
  ON "public"."PlanVersion"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 7: Policies for "RecoveryTask" ───────────────────────
CREATE POLICY "user_select_recovery_task"
  ON "public"."RecoveryTask"
  FOR SELECT
  TO authenticated
  USING (public.can_access_plan("planId"));

CREATE POLICY "patient_update_recovery_task"
  ON "public"."RecoveryTask"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "RecoveryTask"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "RecoveryTask"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  );

CREATE POLICY "service_role_recovery_task"
  ON "public"."RecoveryTask"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 8: Policies for "TaskEvent" ──────────────────────────
CREATE POLICY "user_select_task_event"
  ON "public"."TaskEvent"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryTask" rt
      WHERE rt.id = "TaskEvent"."taskId"
        AND public.can_access_plan(rt."planId")
    )
  );

CREATE POLICY "user_insert_task_event"
  ON "public"."TaskEvent"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryTask" rt
      JOIN "public"."RecoveryPlan" rp ON rp.id = rt."planId"
      WHERE rt.id = "TaskEvent"."taskId"
        AND public.is_patient_owner(rp."patientProfileId")
        AND "actorId" = public.requesting_user_id()
    )
  );

CREATE POLICY "service_role_task_event"
  ON "public"."TaskEvent"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 9: Policies for "Medication" ────────────────────────
CREATE POLICY "user_select_medication"
  ON "public"."Medication"
  FOR SELECT
  TO authenticated
  USING (public.can_access_plan("planId"));

CREATE POLICY "patient_update_medication"
  ON "public"."Medication"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "Medication"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."RecoveryPlan" rp
      WHERE rp.id = "Medication"."planId"
        AND public.is_patient_owner(rp."patientProfileId")
    )
  );

CREATE POLICY "service_role_medication"
  ON "public"."Medication"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 10: Policies for "MedicationSchedule" ───────────────
CREATE POLICY "user_select_medication_schedule"
  ON "public"."MedicationSchedule"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Medication" m
      WHERE m.id = "MedicationSchedule"."medicationId"
        AND public.can_access_plan(m."planId")
    )
  );

CREATE POLICY "service_role_medication_schedule"
  ON "public"."MedicationSchedule"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 11: Policies for "MedicationEvent" ──────────────────
CREATE POLICY "user_select_medication_event"
  ON "public"."MedicationEvent"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."MedicationSchedule" ms
      JOIN "public"."Medication" m ON m.id = ms."medicationId"
      WHERE ms.id = "MedicationEvent"."scheduleId"
        AND public.can_access_plan(m."planId")
    )
  );

-- Patient OR caregiver with explicit MARK_MEDICATIONS permission can log dose events
CREATE POLICY "authorized_insert_medication_event"
  ON "public"."MedicationEvent"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    "actorId" = public.requesting_user_id()
    AND (
      EXISTS (
        SELECT 1 FROM "public"."MedicationSchedule" ms
        JOIN "public"."Medication" m ON m.id = ms."medicationId"
        JOIN "public"."RecoveryPlan" rp ON rp.id = m."planId"
        WHERE ms.id = "MedicationEvent"."scheduleId"
          AND (
            public.is_patient_owner(rp."patientProfileId")
            OR public.has_caregiver_permission(rp."patientProfileId", 'MARK_MEDICATIONS')
          )
      )
    )
  );

CREATE POLICY "service_role_medication_event"
  ON "public"."MedicationEvent"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

