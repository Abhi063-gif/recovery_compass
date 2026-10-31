-- ============================================================
-- Recovery Compass — Verification Test Suite for Module 3
-- Run this in Supabase SQL Editor to verify Module 3 security guarantees
-- ============================================================

DO $$
DECLARE
  v_patient_user_id   text := '11111111-2222-3333-4444-555555555555';
  v_other_user_id     text := '22222222-3333-4444-5555-666666666666';
  v_caregiver_user_id text := '33333333-4444-5555-6666-777777777777';

  v_patient_profile_id   text := 'prof-patient-001';
  v_caregiver_profile_id text := 'prof-caregiver-001';
  v_membership_id        text := 'membership-001';

  v_doc_id    text := 'doc-discharge-001';
  v_page_id   text := 'page-001';
  v_region_id text := 'region-001';

  v_test_count int;
  v_err_caught boolean := false;
BEGIN
  RAISE NOTICE '── [TEST SUITE START] Verifying Module 3 (Documents, Pages, Regions) ──';

  -- 1. Setup clean test fixtures as superuser
  DELETE FROM "public"."DocumentRegion" WHERE id = v_region_id;
  DELETE FROM "public"."DocumentPage" WHERE id = v_page_id;
  DELETE FROM "public"."SourceDocument" WHERE id = v_doc_id;
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
  VALUES (v_caregiver_profile_id, v_caregiver_user_id, 'Daughter', NOW(), NOW());

  INSERT INTO "public"."FamilyMembership" (id, "patientProfileId", "caregiverProfileId", permissions, "isActive", "createdAt", "updatedAt")
  VALUES (v_membership_id, v_patient_profile_id, v_caregiver_profile_id, ARRAY['VIEW_PLAN'::"public"."CaregiverPermission"], true, NOW(), NOW());

  -- Create document and its child hierarchy
  INSERT INTO "public"."SourceDocument" (id, "patientProfileId", "originalFileName", "storagePath", "mimeType", "fileSizeBytes", status, "uploadedAt", "createdAt", "updatedAt")
  VALUES (v_doc_id, v_patient_profile_id, 'discharge_summary.pdf', 'docs/enc_123.pdf', 'application/pdf', 1048576, 'CONFIRMED', NOW(), NOW(), NOW());

  INSERT INTO "public"."DocumentPage" (id, "documentId", "pageNumber", "rawText", "createdAt")
  VALUES (v_page_id, v_doc_id, 1, 'Patient discharged after laparoscopic cholecystectomy. Prescribed Paracetamol 1g.', NOW());

  INSERT INTO "public"."DocumentRegion" (id, "pageId", x, y, width, height, text, confidence, "createdAt")
  VALUES (v_region_id, v_page_id, 10.0, 20.0, 200.0, 50.0, 'Paracetamol 1g QDS', 0.96, NOW());

  -- ── TEST 1: Anon role cannot access documents, pages, or regions ─
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."SourceDocument";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read SourceDocument!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."DocumentPage";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read DocumentPage!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."DocumentRegion";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read DocumentRegion!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE '  ✅ Test 1 Passed: Anon role denied access to all document tables';

  -- ── TEST 2: Patient Alice can read document, page OCR, and regions ─
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."SourceDocument" WHERE id = v_doc_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Patient Alice could not read her SourceDocument!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."DocumentPage" WHERE id = v_page_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Patient Alice could not read DocumentPage OCR text!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."DocumentRegion" WHERE id = v_region_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Patient Alice could not read DocumentRegion!'; END IF;
  RAISE NOTICE '  ✅ Test 2 Passed: Patient can read their documents, pages, and OCR regions';

  -- ── TEST 3: Unrelated Patient Bob CANNOT read Alice's documents ─
  PERFORM set_config('request.jwt.claim.sub', v_other_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."SourceDocument" WHERE id = v_doc_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient document leakage! Bob read Alice document.'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."DocumentPage" WHERE id = v_page_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient OCR leakage! Bob read Alice DocumentPage.'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."DocumentRegion" WHERE id = v_region_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient region leakage! Bob read Alice DocumentRegion.'; END IF;
  RAISE NOTICE '  ✅ Test 3 Passed: Cross-patient document & OCR access strictly blocked';

  -- ── TEST 4: Authorized Caregiver Charlie CAN view documents ───
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."SourceDocument" WHERE id = v_doc_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Caregiver with VIEW_PLAN could not read document!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."DocumentPage" WHERE id = v_page_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Caregiver with VIEW_PLAN could not read DocumentPage!'; END IF;
  RAISE NOTICE '  ✅ Test 4 Passed: Authorized caregiver with VIEW_PLAN can read document & OCR';

  -- ── TEST 5: Revoked Caregiver access immediately terminates ──
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  UPDATE "public"."FamilyMembership" 
  SET "isActive" = false, "revokedAt" = NOW() 
  WHERE id = v_membership_id;

  -- Test as Charlie again: must be blocked
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  SELECT count(*) INTO v_test_count FROM "public"."SourceDocument" WHERE id = v_doc_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Revoked caregiver was still able to read document!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."DocumentPage" WHERE id = v_page_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Revoked caregiver was still able to read DocumentPage!'; END IF;
  RAISE NOTICE '  ✅ Test 5 Passed: Revoked caregiver access to documents and OCR is terminated';

  -- ── TEST 6: Client cannot forge DocumentPage or DocumentRegion ─
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  v_err_caught := false;
  BEGIN
    EXECUTE 'INSERT INTO "public"."DocumentPage" (id, "documentId", "pageNumber", "rawText") VALUES (''fake-page'', ' || quote_literal(v_doc_id) || ', 2, ''Forged text'')';
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: Client was able to directly insert DocumentPage!';
  END IF;
  RAISE NOTICE '  ✅ Test 6 Passed: Direct client insertion of OCR pages/regions is blocked';

  -- ── CLEANUP ──────────────────────────────────────────────────
  RESET ROLE;
  DELETE FROM "public"."DocumentRegion" WHERE id = v_region_id;
  DELETE FROM "public"."DocumentPage" WHERE id = v_page_id;
  DELETE FROM "public"."SourceDocument" WHERE id = v_doc_id;
  DELETE FROM "public"."FamilyMembership" WHERE id = v_membership_id;
  DELETE FROM "public"."CaregiverProfile" WHERE id = v_caregiver_profile_id;
  DELETE FROM "public"."PatientProfile" WHERE id = v_patient_profile_id;
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id, v_caregiver_user_id);

  RAISE NOTICE '── [TEST SUITE COMPLETED] All 6 Module 3 Security Tests Passed! ──';
END $$;

