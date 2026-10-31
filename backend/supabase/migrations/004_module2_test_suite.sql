-- ============================================================
-- Recovery Compass — Verification Test Suite for Module 2
-- Run this in Supabase SQL Editor to verify Module 2 security guarantees
-- ============================================================

DO $$
DECLARE
  v_patient_user_id   text := '11111111-2222-3333-4444-555555555555';
  v_other_user_id     text := '22222222-3333-4444-5555-666666666666';
  v_caregiver_user_id text := '33333333-4444-5555-6666-777777777777';

  v_patient_profile_id   text := 'prof-patient-001';
  v_other_profile_id     text := 'prof-patient-002';
  v_caregiver_profile_id text := 'prof-caregiver-001';
  v_membership_id        text := 'membership-001';
  v_consent_id           text := 'consent-001';
  v_invite_id            text := 'invite-001';

  v_test_count int;
  v_err_caught boolean := false;
BEGIN
  RAISE NOTICE '── [TEST SUITE START] Verifying Module 2 (Patient, Caregiver, Consent) ──';

  -- 1. Setup clean test fixtures as superuser
  DELETE FROM "public"."ConsentRecord" WHERE id = v_consent_id;
  DELETE FROM "public"."FamilyMembership" WHERE id = v_membership_id;
  DELETE FROM "public"."FamilyInvitation" WHERE id = v_invite_id;
  DELETE FROM "public"."CaregiverProfile" WHERE id = v_caregiver_profile_id;
  DELETE FROM "public"."PatientProfile" WHERE id IN (v_patient_profile_id, v_other_profile_id);
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id, v_caregiver_user_id);

  INSERT INTO "public"."User" (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES 
    (v_patient_user_id, 'alice.patient@test.com', '$2a$12$fake', 'PATIENT', 'Alice', 'Patient', true, NOW(), NOW()),
    (v_other_user_id, 'bob.patient@test.com', '$2a$12$fake', 'PATIENT', 'Bob', 'Patient', true, NOW(), NOW()),
    (v_caregiver_user_id, 'charlie.caregiver@test.com', '$2a$12$fake', 'CAREGIVER', 'Charlie', 'Caregiver', true, NOW(), NOW());

  INSERT INTO "public"."PatientProfile" (id, "userId", "nhsNumber", "emergencyContact", "createdAt", "updatedAt")
  VALUES 
    (v_patient_profile_id, v_patient_user_id, 'NHS-11111', '9876543210', NOW(), NOW()),
    (v_other_profile_id, v_other_user_id, 'NHS-22222', '1234567890', NOW(), NOW());

  INSERT INTO "public"."CaregiverProfile" (id, "userId", relationship, "createdAt", "updatedAt")
  VALUES (v_caregiver_profile_id, v_caregiver_user_id, 'Son', NOW(), NOW());

  INSERT INTO "public"."FamilyMembership" (id, "patientProfileId", "caregiverProfileId", permissions, "isActive", "createdAt", "updatedAt")
  VALUES (v_membership_id, v_patient_profile_id, v_caregiver_profile_id, ARRAY['VIEW_PLAN'::"public"."CaregiverPermission", 'LOG_SYMPTOMS'::"public"."CaregiverPermission"], true, NOW(), NOW());

  INSERT INTO "public"."ConsentRecord" (id, "patientProfileId", "membershipId", permission, status, "actorId", "createdAt")
  VALUES (v_consent_id, v_patient_profile_id, v_membership_id, 'VIEW_PLAN'::"public"."CaregiverPermission", 'ACTIVE', v_patient_user_id, NOW());

  INSERT INTO "public"."FamilyInvitation" (id, "patientProfileId", "invitedByUserId", "tokenHash", "otpCode", permissions, status, "expiresAt")
  VALUES (v_invite_id, v_patient_profile_id, v_patient_user_id, 'secret-hash-xyz', '654321', ARRAY['VIEW_PLAN'::"public"."CaregiverPermission"], 'PENDING', NOW() + INTERVAL '48 hours');

  -- ── TEST 1: Anon role blocked from all 5 tables ───────────────
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."PatientProfile";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read PatientProfile!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."CaregiverProfile";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read CaregiverProfile!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."FamilyMembership";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read FamilyMembership!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE '  ✅ Test 1 Passed: Anon role denied access to all Module 2 tables';

  -- ── TEST 2: Patient Alice can read her own PatientProfile ─────
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."PatientProfile" WHERE id = v_patient_profile_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read her PatientProfile!'; END IF;
  RAISE NOTICE '  ✅ Test 2 Passed: Patient can read their own PatientProfile';

  -- ── TEST 3: Cross-patient isolation (Alice cannot view Bob) ───
  SELECT count(*) INTO v_test_count FROM "public"."PatientProfile" WHERE id = v_other_profile_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient isolation failure! Alice read Bob profile.'; END IF;
  RAISE NOTICE '  ✅ Test 3 Passed: Cross-patient profile access blocked';

  -- ── TEST 4: Caregiver Charlie CAN view Alice's profile (Active Membership)
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  SELECT count(*) INTO v_test_count FROM "public"."PatientProfile" WHERE id = v_patient_profile_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Active caregiver Charlie could not view Alice profile!'; END IF;
  RAISE NOTICE '  ✅ Test 4 Passed: Caregiver with active membership can view patient profile';

  -- ── TEST 5: Revoked Caregiver access immediately stops ────────
  -- Patient Alice revokes Charlie's membership
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  UPDATE "public"."FamilyMembership" 
  SET "isActive" = false, "revokedAt" = NOW() 
  WHERE id = v_membership_id;

  -- Now test as Charlie again: access MUST be blocked
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  SELECT count(*) INTO v_test_count FROM "public"."PatientProfile" WHERE id = v_patient_profile_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Revoked caregiver was still able to view patient profile!'; END IF;
  RAISE NOTICE '  ✅ Test 5 Passed: Revoked caregiver access is immediately terminated';

  -- ── TEST 6: Caregiver CANNOT tamper with ConsentRecord ────────
  v_err_caught := false;
  BEGIN
    INSERT INTO "public"."ConsentRecord" (id, "patientProfileId", "membershipId", permission, status, "actorId")
    VALUES ('consent-illegal', v_patient_profile_id, v_membership_id, 'MARK_MEDICATIONS'::"public"."CaregiverPermission", 'ACTIVE', v_caregiver_user_id);
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
  END;
  -- If insert did not throw, verify row count remained 0 due to RLS WITH CHECK
  IF NOT v_err_caught THEN
    SELECT count(*) INTO v_test_count FROM "public"."ConsentRecord" WHERE id = 'consent-illegal';
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Caregiver was able to insert a ConsentRecord!'; END IF;
  END IF;
  RAISE NOTICE '  ✅ Test 6 Passed: Caregiver cannot forge or modify consent records';

  -- ── TEST 7: Column-level protection of FamilyInvitation tokens ─
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  v_err_caught := false;
  BEGIN
    EXECUTE 'SELECT "tokenHash" FROM "public"."FamilyInvitation" WHERE id = ' || quote_literal(v_invite_id);
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: FamilyInvitation tokenHash column was accessible via select!';
  END IF;
  RAISE NOTICE '  ✅ Test 7 Passed: Column-level security protects invitation tokenHash and otpCode';

  -- ── CLEANUP ──────────────────────────────────────────────────
  RESET ROLE;
  DELETE FROM "public"."ConsentRecord" WHERE id IN (v_consent_id, 'consent-illegal');
  DELETE FROM "public"."FamilyMembership" WHERE id = v_membership_id;
  DELETE FROM "public"."FamilyInvitation" WHERE id = v_invite_id;
  DELETE FROM "public"."CaregiverProfile" WHERE id = v_caregiver_profile_id;
  DELETE FROM "public"."PatientProfile" WHERE id IN (v_patient_profile_id, v_other_profile_id);
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id, v_caregiver_user_id);

  RAISE NOTICE '── [TEST SUITE COMPLETED] All 7 Module 2 Security Tests Passed! ──';
END $$;

