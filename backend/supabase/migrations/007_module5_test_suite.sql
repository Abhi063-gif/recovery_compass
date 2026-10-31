-- ============================================================
-- Recovery Compass — Verification Test Suite for Module 5
-- Run this in Supabase SQL Editor to verify Module 5 security guarantees
-- ============================================================

DO $$
DECLARE
  v_patient_user_id   text := '11111111-2222-3333-4444-555555555555';
  v_other_user_id     text := '22222222-3333-4444-5555-666666666666';
  v_caregiver_user_id text := '33333333-4444-5555-6666-777777777777';

  v_patient_profile_id   text := 'prof-patient-001';
  v_caregiver_profile_id text := 'prof-caregiver-001';
  v_membership_id        text := 'membership-001';
  v_template_id          text := 'tmpl-chole-001';

  v_plan_id     text := 'plan-001';
  v_task_id     text := 'task-001';
  v_task_ev_id  text := 'task-ev-001';
  v_med_id      text := 'med-001';
  v_sched_id    text := 'sched-001';
  v_med_ev_id   text := 'med-ev-001';

  v_test_count int;
  v_err_caught boolean := false;
BEGIN
  RAISE NOTICE '── [TEST SUITE START] Verifying Module 5 (Plans, Tasks, Medications) ──';

  -- 1. Setup clean test fixtures as superuser
  DELETE FROM "public"."MedicationEvent" WHERE id = v_med_ev_id;
  DELETE FROM "public"."MedicationSchedule" WHERE id = v_sched_id;
  DELETE FROM "public"."Medication" WHERE id = v_med_id;
  DELETE FROM "public"."TaskEvent" WHERE id = v_task_ev_id;
  DELETE FROM "public"."RecoveryTask" WHERE id = v_task_id;
  DELETE FROM "public"."PlanVersion" WHERE "planId" = v_plan_id;
  DELETE FROM "public"."RecoveryPlan" WHERE id = v_plan_id;
  DELETE FROM "public"."PathwayTemplate" WHERE id = v_template_id;
  DELETE FROM "public"."FamilyMembership" WHERE id = v_membership_id;
  DELETE FROM "public"."CaregiverProfile" WHERE id = v_caregiver_profile_id;
  DELETE FROM "public"."PatientProfile" WHERE id = v_patient_profile_id;
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id, v_caregiver_user_id);

  INSERT INTO "public"."User" (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES 
    (v_patient_user_id, 'alice.patient@test.com', '$2a$12$fake', 'PATIENT', 'Alice', 'Patient', true, NOW(), NOW()),
    (v_other_user_id, 'bob.patient@test.com', '$2a$12$fake', 'PATIENT', 'Bob', 'Patient', true, NOW(), NOW()),
    (v_caregiver_user_id, 'charlie.caregiver@test.com', '$2a$12$fake', 'CAREGIVER', 'Charlie', 'Caregiver', true, NOW(), NOW());

  INSERT INTO "public"."PatientProfile" (id, "userId", "nhsNumber", "createdAt", "updatedAt")
  VALUES (v_patient_profile_id, v_patient_user_id, 'NHS-11111', NOW(), NOW());

  INSERT INTO "public"."CaregiverProfile" (id, "userId", relationship, "createdAt", "updatedAt")
  VALUES (v_caregiver_profile_id, v_caregiver_user_id, 'Spouse', NOW(), NOW());

  INSERT INTO "public"."PathwayTemplate" (id, identifier, version, title, description, "createdAt", "updatedAt")
  VALUES (v_template_id, 'cholecystectomy', 1, 'Gallbladder Surgery Pathway', 'Recovery pathway', NOW(), NOW());

  -- Caregiver initially only has VIEW_PLAN permission (NOT MARK_MEDICATIONS)
  INSERT INTO "public"."FamilyMembership" (id, "patientProfileId", "caregiverProfileId", permissions, "isActive", "createdAt", "updatedAt")
  VALUES (v_membership_id, v_patient_profile_id, v_caregiver_profile_id, ARRAY['VIEW_PLAN'::"public"."CaregiverPermission"], true, NOW(), NOW());

  INSERT INTO "public"."RecoveryPlan" (id, "patientProfileId", "pathwayTemplateId", status, "createdAt", "updatedAt")
  VALUES (v_plan_id, v_patient_profile_id, v_template_id, 'ACTIVE', NOW(), NOW());

  INSERT INTO "public"."RecoveryTask" (id, "planId", title, "dayOffset", status, "createdAt", "updatedAt")
  VALUES (v_task_id, v_plan_id, 'Gentle walking for 10 mins', 1, 'SCHEDULED', NOW(), NOW());

  INSERT INTO "public"."Medication" (id, "planId", name, dose, "doseUnit", frequency, "createdAt", "updatedAt")
  VALUES (v_med_id, v_plan_id, 'Paracetamol', '500', 'mg', 'TDS', NOW(), NOW());

  INSERT INTO "public"."MedicationSchedule" (id, "medicationId", "scheduledAt", "idempotencyKey", "createdAt")
  VALUES (v_sched_id, v_med_id, NOW() + INTERVAL '2 hours', 'paracetamol-dose-1', NOW());

  -- ── TEST 1: Anon role blocked across all Module 5 tables ──────
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."RecoveryPlan";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read RecoveryPlan!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."Medication";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read Medication!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."RecoveryTask";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read RecoveryTask!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE '  ✅ Test 1 Passed: Anon role denied access to all plan, task, and medication tables';

  -- ── TEST 2: Patient Alice can read her plan, tasks, and schedules ─
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."RecoveryPlan" WHERE id = v_plan_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read RecoveryPlan!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."RecoveryTask" WHERE id = v_task_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read RecoveryTask!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."MedicationSchedule" WHERE id = v_sched_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read MedicationSchedule!'; END IF;
  RAISE NOTICE '  ✅ Test 2 Passed: Patient can read their plan, tasks, and medication schedules';

  -- ── TEST 3: Cross-patient isolation (Bob cannot view Alice's plan/tasks) ─
  PERFORM set_config('request.jwt.claim.sub', v_other_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."RecoveryPlan" WHERE id = v_plan_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient plan leakage! Bob read Alice plan.'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."RecoveryTask" WHERE id = v_task_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient task leakage! Bob read Alice task.'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."MedicationSchedule" WHERE id = v_sched_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient med schedule leakage! Bob read Alice schedule.'; END IF;
  RAISE NOTICE '  ✅ Test 3 Passed: Cross-patient plan, task, and medication access strictly blocked';

  -- ── TEST 4: Caregiver Charlie with VIEW_PLAN can read schedules ─
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."MedicationSchedule" WHERE id = v_sched_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Caregiver with VIEW_PLAN could not read MedicationSchedule!'; END IF;
  RAISE NOTICE '  ✅ Test 4 Passed: Caregiver with VIEW_PLAN can view medication schedules';

  -- ── TEST 5: Caregiver WITHOUT MARK_MEDICATIONS cannot log doses ─
  v_err_caught := false;
  BEGIN
    INSERT INTO "public"."MedicationEvent" (id, "scheduleId", status, "actorId")
    VALUES (v_med_ev_id, v_sched_id, 'TAKEN'::"public"."MedicationEventStatus", v_caregiver_user_id);
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
  END;
  -- If insert did not throw exception, ensure RLS WITH CHECK blocked row insertion
  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_test_count FROM "public"."MedicationEvent" WHERE id = v_med_ev_id;
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Caregiver without MARK_MEDICATIONS was able to log dose event!'; END IF;
  END IF;
  RAISE NOTICE '  ✅ Test 5 Passed: Caregiver without MARK_MEDICATIONS is blocked from logging dose events';

  -- ── TEST 6: Patient grants MARK_MEDICATIONS -> Caregiver can log doses ─
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  UPDATE "public"."FamilyMembership" 
  SET permissions = ARRAY['VIEW_PLAN'::"public"."CaregiverPermission", 'MARK_MEDICATIONS'::"public"."CaregiverPermission"]
  WHERE id = v_membership_id;

  -- Test as Charlie again: must now succeed
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  INSERT INTO "public"."MedicationEvent" (id, "scheduleId", status, "actorId")
  VALUES (v_med_ev_id, v_sched_id, 'TAKEN'::"public"."MedicationEventStatus", v_caregiver_user_id);

  SELECT count(*) INTO v_test_count FROM "public"."MedicationEvent" WHERE id = v_med_ev_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Caregiver with MARK_MEDICATIONS could not log dose event!'; END IF;
  RAISE NOTICE '  ✅ Test 6 Passed: Caregiver with MARK_MEDICATIONS can log dose events';

  -- ── TEST 7: Revoked Caregiver access terminates immediately ───
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  UPDATE "public"."FamilyMembership" 
  SET "isActive" = false, "revokedAt" = NOW() 
  WHERE id = v_membership_id;

  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  SELECT count(*) INTO v_test_count FROM "public"."RecoveryPlan" WHERE id = v_plan_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Revoked caregiver was still able to read RecoveryPlan!'; END IF;
  RAISE NOTICE '  ✅ Test 7 Passed: Revoked caregiver access to recovery plans is terminated immediately';

  -- ── TEST 8: Verify covering index on RecoveryPlan.pathwayTemplateId ─
  SELECT count(*) INTO v_test_count
  FROM pg_indexes
  WHERE tablename = 'RecoveryPlan'
    AND indexname = 'RecoveryPlan_pathwayTemplateId_idx';

  IF v_test_count = 0 THEN
    RAISE EXCEPTION 'FAILED: Covering index RecoveryPlan_pathwayTemplateId_idx is missing!';
  END IF;
  RAISE NOTICE '  ✅ Test 8 Passed: Covering index on RecoveryPlan.pathwayTemplateId confirmed';

  -- ── CLEANUP ──────────────────────────────────────────────────
  RESET ROLE;
  DELETE FROM "public"."MedicationEvent" WHERE id = v_med_ev_id;
  DELETE FROM "public"."MedicationSchedule" WHERE id = v_sched_id;
  DELETE FROM "public"."Medication" WHERE id = v_med_id;
  DELETE FROM "public"."TaskEvent" WHERE id = v_task_ev_id;
  DELETE FROM "public"."RecoveryTask" WHERE id = v_task_id;
  DELETE FROM "public"."PlanVersion" WHERE "planId" = v_plan_id;
  DELETE FROM "public"."RecoveryPlan" WHERE id = v_plan_id;
  DELETE FROM "public"."PathwayTemplate" WHERE id = v_template_id;
  DELETE FROM "public"."FamilyMembership" WHERE id = v_membership_id;
  DELETE FROM "public"."CaregiverProfile" WHERE id = v_caregiver_profile_id;
  DELETE FROM "public"."PatientProfile" WHERE id = v_patient_profile_id;
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id, v_caregiver_user_id);

  RAISE NOTICE '── [TEST SUITE COMPLETED] All 8 Module 5 Security Tests Passed! ──';
END $$;

