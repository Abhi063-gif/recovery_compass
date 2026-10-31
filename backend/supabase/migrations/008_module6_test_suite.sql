-- ============================================================
-- Recovery Compass — Verification Test Suite for Module 6
-- Run this in Supabase SQL Editor to verify Module 6 security guarantees
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
  v_sym_def_id           text := 'sym-fever-001';
  v_rule_id              text := 'rule-fever-001';

  v_plan_id      text := 'plan-001';
  v_sym_log_id   text := 'sym-log-001';
  v_flag_ev_id   text := 'flag-ev-001';
  v_followup_id  text := 'followup-001';
  v_test_id      text := 'test-001';
  v_question_id  text := 'question-001';

  v_test_count int;
  v_err_caught boolean := false;
BEGIN
  RAISE NOTICE '── [TEST SUITE START] Verifying Module 6 (Clinical, Symptoms, Safety, Follow-ups) ──';

  -- 1. Setup clean test fixtures as superuser
  DELETE FROM "public"."DoctorQuestion" WHERE id = v_question_id;
  DELETE FROM "public"."PendingTest" WHERE id = v_test_id;
  DELETE FROM "public"."FollowUp" WHERE id = v_followup_id;
  DELETE FROM "public"."RedFlagEvent" WHERE id = v_flag_ev_id;
  DELETE FROM "public"."SymptomLog" WHERE id = v_sym_log_id;
  DELETE FROM "public"."RedFlagRule" WHERE id = v_rule_id;
  DELETE FROM "public"."SymptomDefinition" WHERE id = v_sym_def_id;
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
  VALUES (v_caregiver_profile_id, v_caregiver_user_id, 'Sister', NOW(), NOW());

  INSERT INTO "public"."PathwayTemplate" (id, identifier, version, title, description, "createdAt", "updatedAt")
  VALUES (v_template_id, 'cholecystectomy', 1, 'Laparoscopic Cholecystectomy', 'Clinical pathway', NOW(), NOW());

  INSERT INTO "public"."SymptomDefinition" (id, code, name, description, "createdAt")
  VALUES (v_sym_def_id, 'FEVER', 'High Fever', 'Body temperature above normal', NOW());

  INSERT INTO "public"."RedFlagRule" (id, "pathwayTemplateId", "ruleCode", name, description, "triggerType", "triggerConfig", severity, action, "messageTemplate", status, "reviewNote", "createdAt", "updatedAt")
  VALUES (v_rule_id, v_template_id, 'RULE-FEVER-385', 'Fever Alert', 'Temperature > 38.5 C', 'fever_above_threshold', '{"operator": ">", "value": 38.5}'::jsonb, 'CRITICAL'::"public"."RedFlagSeverity", 'URGENT_CALL'::"public"."RedFlagAction", 'Contact emergency health helpline immediately', 'ACTIVE'::"public"."RedFlagRuleStatus", 'Prototype — clinician review pending', NOW(), NOW());

  -- Caregiver initially only has VIEW_PLAN permission (NOT LOG_SYMPTOMS)
  INSERT INTO "public"."FamilyMembership" (id, "patientProfileId", "caregiverProfileId", permissions, "isActive", "createdAt", "updatedAt")
  VALUES (v_membership_id, v_patient_profile_id, v_caregiver_profile_id, ARRAY['VIEW_PLAN'::"public"."CaregiverPermission"], true, NOW(), NOW());

  INSERT INTO "public"."RecoveryPlan" (id, "patientProfileId", "pathwayTemplateId", status, "createdAt", "updatedAt")
  VALUES (v_plan_id, v_patient_profile_id, v_template_id, 'ACTIVE', NOW(), NOW());

  INSERT INTO "public"."FollowUp" (id, "planId", "appointmentType", "purpose", "scheduledDate", "createdAt", "updatedAt")
  VALUES (v_followup_id, v_plan_id, 'WOUND_CHECK', 'Inspect surgical incisions', NOW() + INTERVAL '7 days', NOW(), NOW());

  INSERT INTO "public"."PendingTest" (id, "planId", "followUpId", "testName", "createdAt")
  VALUES (v_test_id, v_plan_id, v_followup_id, 'Complete Blood Count', NOW());

  INSERT INTO "public"."DoctorQuestion" (id, "planId", "questionText", "sourceType", "createdAt")
  VALUES (v_question_id, v_plan_id, 'When can I resume lifting heavy groceries?', 'USER_ASKED', NOW());

  -- ── TEST 1: Public definitions are readable ───────────────────
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."PathwayTemplate" WHERE id = v_template_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Authenticated user could not read PathwayTemplate!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."SymptomDefinition" WHERE id = v_sym_def_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Authenticated user could not read SymptomDefinition!'; END IF;
  RAISE NOTICE '  ✅ Test 1 Passed: System definition catalogs are readable';

  -- ── TEST 2: Clients CANNOT alter or tamper with RedFlagRules ─
  v_err_caught := false;
  BEGIN
    EXECUTE 'UPDATE "public"."RedFlagRule" SET severity = ''LOW'' WHERE id = ' || quote_literal(v_rule_id);
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: Client was able to modify a RedFlagRule safety threshold!';
  END IF;
  RAISE NOTICE '  ✅ Test 2 Passed: Safety rule manipulation is strictly blocked';

  -- ── TEST 3: Patient Alice can read her clinical follow-ups and questions ─
  SELECT count(*) INTO v_test_count FROM "public"."FollowUp" WHERE id = v_followup_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read FollowUp!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."PendingTest" WHERE id = v_test_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read PendingTest!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."DoctorQuestion" WHERE id = v_question_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read DoctorQuestion!'; END IF;
  RAISE NOTICE '  ✅ Test 3 Passed: Patient can read their follow-ups, tests, and doctor questions';

  -- ── TEST 4: Cross-patient isolation (Bob cannot view Alice records) ─
  PERFORM set_config('request.jwt.claim.sub', v_other_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."FollowUp" WHERE id = v_followup_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient follow-up leakage!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."PendingTest" WHERE id = v_test_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient test leakage!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."DoctorQuestion" WHERE id = v_question_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient question leakage!'; END IF;
  RAISE NOTICE '  ✅ Test 4 Passed: Cross-patient clinical data access strictly blocked';

  -- ── TEST 5: Caregiver WITHOUT LOG_SYMPTOMS cannot log symptoms ─
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  v_err_caught := false;
  BEGIN
    INSERT INTO "public"."SymptomLog" (id, "planId", "loggedBy", "symptomDefinitionId", "painScore", temperature)
    VALUES (v_sym_log_id, v_plan_id, v_caregiver_user_id, v_sym_def_id, 7, 38.2);
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_test_count FROM "public"."SymptomLog" WHERE id = v_sym_log_id;
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Caregiver without LOG_SYMPTOMS was able to log symptoms!'; END IF;
  END IF;
  RAISE NOTICE '  ✅ Test 5 Passed: Caregiver without LOG_SYMPTOMS is blocked from recording symptoms';

  -- ── TEST 6: Patient grants LOG_SYMPTOMS -> Caregiver can log symptoms ─
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  UPDATE "public"."FamilyMembership" 
  SET permissions = ARRAY['VIEW_PLAN'::"public"."CaregiverPermission", 'LOG_SYMPTOMS'::"public"."CaregiverPermission"]
  WHERE id = v_membership_id;

  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  INSERT INTO "public"."SymptomLog" (id, "planId", "loggedBy", "symptomDefinitionId", "painScore", temperature)
  VALUES (v_sym_log_id, v_plan_id, v_caregiver_user_id, v_sym_def_id, 7, 38.2);

  SELECT count(*) INTO v_test_count FROM "public"."SymptomLog" WHERE id = v_sym_log_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Caregiver with LOG_SYMPTOMS could not record symptom log!'; END IF;
  RAISE NOTICE '  ✅ Test 6 Passed: Caregiver with LOG_SYMPTOMS can record symptom logs';

  -- ── TEST 7: Revoked Caregiver access terminates immediately ───
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  UPDATE "public"."FamilyMembership" 
  SET "isActive" = false, "revokedAt" = NOW() 
  WHERE id = v_membership_id;

  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  SELECT count(*) INTO v_test_count FROM "public"."FollowUp" WHERE id = v_followup_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Revoked caregiver was still able to read FollowUp!'; END IF;
  RAISE NOTICE '  ✅ Test 7 Passed: Revoked caregiver access to clinical data terminated immediately';

  -- ── TEST 8: Verify covering indexes ──────────────────────────
  SELECT count(*) INTO v_test_count
  FROM pg_indexes
  WHERE tablename = 'SymptomLog' AND indexname = 'SymptomLog_symptomDefinitionId_idx';
  IF v_test_count = 0 THEN RAISE EXCEPTION 'FAILED: SymptomLog_symptomDefinitionId_idx missing!'; END IF;

  SELECT count(*) INTO v_test_count
  FROM pg_indexes
  WHERE tablename = 'RedFlagEvent' AND indexname = 'RedFlagEvent_ruleId_idx';
  IF v_test_count = 0 THEN RAISE EXCEPTION 'FAILED: RedFlagEvent_ruleId_idx missing!'; END IF;
  RAISE NOTICE '  ✅ Test 8 Passed: Covering indexes on SymptomLog and RedFlagEvent confirmed';

  -- ── CLEANUP ──────────────────────────────────────────────────
  RESET ROLE;
  DELETE FROM "public"."DoctorQuestion" WHERE id = v_question_id;
  DELETE FROM "public"."PendingTest" WHERE id = v_test_id;
  DELETE FROM "public"."FollowUp" WHERE id = v_followup_id;
  DELETE FROM "public"."RedFlagEvent" WHERE id = v_flag_ev_id;
  DELETE FROM "public"."SymptomLog" WHERE id = v_sym_log_id;
  DELETE FROM "public"."RedFlagRule" WHERE id = v_rule_id;
  DELETE FROM "public"."SymptomDefinition" WHERE id = v_sym_def_id;
  DELETE FROM "public"."RecoveryPlan" WHERE id = v_plan_id;
  DELETE FROM "public"."PathwayTemplate" WHERE id = v_template_id;
  DELETE FROM "public"."FamilyMembership" WHERE id = v_membership_id;
  DELETE FROM "public"."CaregiverProfile" WHERE id = v_caregiver_profile_id;
  DELETE FROM "public"."PatientProfile" WHERE id = v_patient_profile_id;
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id, v_caregiver_user_id);

  RAISE NOTICE '── [TEST SUITE COMPLETED] All 8 Module 6 Security Tests Passed! ──';
END $$;

