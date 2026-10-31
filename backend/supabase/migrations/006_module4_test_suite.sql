-- ============================================================
-- Recovery Compass — Verification Test Suite for Module 4
-- Run this in Supabase SQL Editor to verify Module 4 security guarantees
-- ============================================================

DO $$
DECLARE
  v_patient_user_id   text := '11111111-2222-3333-4444-555555555555';
  v_other_user_id     text := '22222222-3333-4444-5555-666666666666';
  v_caregiver_user_id text := '33333333-4444-5555-6666-777777777777';

  v_patient_profile_id   text := 'prof-patient-001';
  v_caregiver_profile_id text := 'prof-caregiver-001';
  v_membership_id        text := 'membership-001';

  v_doc_id        text := 'doc-discharge-001';
  v_page_id       text := 'page-001';
  v_region_id     text := 'region-001';
  v_extraction_id text := 'ext-001';
  v_field_id      text := 'field-001';
  v_job_id        text := 'job-001';

  v_test_count int;
  v_err_caught boolean := false;
BEGIN
  RAISE NOTICE '── [TEST SUITE START] Verifying Module 4 (Extraction, Fields, Processing Jobs) ──';

  -- 1. Setup clean test fixtures as superuser
  DELETE FROM "public"."ProcessingJob" WHERE id = v_job_id;
  DELETE FROM "public"."ExtractionField" WHERE id = v_field_id;
  DELETE FROM "public"."Extraction" WHERE id = v_extraction_id;
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

  INSERT INTO "public"."SourceDocument" (id, "patientProfileId", "originalFileName", "storagePath", "mimeType", "fileSizeBytes", status, "uploadedAt", "createdAt", "updatedAt")
  VALUES (v_doc_id, v_patient_profile_id, 'discharge_summary.pdf', 'docs/enc_123.pdf', 'application/pdf', 1048576, 'CONFIRMED', NOW(), NOW(), NOW());

  INSERT INTO "public"."DocumentPage" (id, "documentId", "pageNumber", "rawText", "createdAt")
  VALUES (v_page_id, v_doc_id, 1, 'Prescribed Amoxicillin 500mg TDS for 5 days.', NOW());

  INSERT INTO "public"."DocumentRegion" (id, "pageId", x, y, width, height, text, confidence, "createdAt")
  VALUES (v_region_id, v_page_id, 10.0, 20.0, 200.0, 50.0, 'Amoxicillin 500mg', 0.95, NOW());

  INSERT INTO "public"."Extraction" (id, "documentId", status, "llmModel", "rawLlmOutput", "createdAt", "updatedAt")
  VALUES (v_extraction_id, v_doc_id, 'COMPLETED', 'gemini-1.5-pro', '{"audit": "raw json stream"}', NOW(), NOW());

  INSERT INTO "public"."ExtractionField" (id, "extractionId", category, "fieldKey", value, "sourceRegionId", "validationStatus", "createdAt", "updatedAt")
  VALUES (v_field_id, v_extraction_id, 'MEDICINES'::"public"."ExtractionCategory", 'medicine.name', 'Amoxicillin', v_region_id, 'VALID'::"public"."ValidationStatus", NOW(), NOW());

  INSERT INTO "public"."ProcessingJob" (id, "jobType", "documentId", status, attempt, "createdAt", "updatedAt")
  VALUES (v_job_id, 'EXTRACTION', v_doc_id, 'COMPLETED'::"public"."JobStatus", 1, NOW(), NOW());

  -- ── TEST 1: Anon role blocked from all Module 4 tables ────────
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."Extraction";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read Extraction!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."ExtractionField";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read ExtractionField!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."ProcessingJob";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read ProcessingJob!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE '  ✅ Test 1 Passed: Anon role denied access to all extraction & job tables';

  -- ── TEST 2: Patient Alice can read her own Extraction & Fields ─
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."Extraction" WHERE id = v_extraction_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Patient Alice could not read Extraction!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."ExtractionField" WHERE id = v_field_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Patient Alice could not read ExtractionField!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."ProcessingJob" WHERE id = v_job_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Patient Alice could not poll ProcessingJob status!'; END IF;
  RAISE NOTICE '  ✅ Test 2 Passed: Patient can read their extractions, fields, and job status';

  -- ── TEST 3: Cross-patient isolation (Bob cannot view Alice extraction) ─
  PERFORM set_config('request.jwt.claim.sub', v_other_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."Extraction" WHERE id = v_extraction_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient extraction leakage! Bob read Alice extraction.'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."ExtractionField" WHERE id = v_field_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient field leakage! Bob read Alice ExtractionField.'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."ProcessingJob" WHERE id = v_job_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-patient job leakage! Bob read Alice ProcessingJob.'; END IF;
  RAISE NOTICE '  ✅ Test 3 Passed: Cross-patient extraction & processing job access strictly blocked';

  -- ── TEST 4: Authorized Caregiver Charlie CAN view extractions ──
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."Extraction" WHERE id = v_extraction_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Authorized caregiver could not view Extraction!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."ExtractionField" WHERE id = v_field_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Authorized caregiver could not view ExtractionField!'; END IF;
  RAISE NOTICE '  ✅ Test 4 Passed: Authorized caregiver with VIEW_PLAN can read extraction fields';

  -- ── TEST 5: Revoked Caregiver access terminates immediately ───
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  UPDATE "public"."FamilyMembership" 
  SET "isActive" = false, "revokedAt" = NOW() 
  WHERE id = v_membership_id;

  -- Test as Charlie again: must be blocked
  PERFORM set_config('request.jwt.claim.sub', v_caregiver_user_id, true);
  SELECT count(*) INTO v_test_count FROM "public"."Extraction" WHERE id = v_extraction_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Revoked caregiver was still able to read Extraction!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."ExtractionField" WHERE id = v_field_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Revoked caregiver was still able to read ExtractionField!'; END IF;
  RAISE NOTICE '  ✅ Test 5 Passed: Revoked caregiver access to extractions terminated immediately';

  -- ── TEST 6: Client CANNOT alter or forge ProcessingJob status ─
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  v_err_caught := false;
  BEGIN
    EXECUTE 'UPDATE "public"."ProcessingJob" SET status = ''FAILED'' WHERE id = ' || quote_literal(v_job_id);
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: Client was able to update ProcessingJob status!';
  END IF;
  RAISE NOTICE '  ✅ Test 6 Passed: Direct client manipulation of ProcessingJob is blocked';

  -- ── TEST 7: Column-level protection of rawLlmOutput ──────────
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  v_err_caught := false;
  BEGIN
    EXECUTE 'SELECT "rawLlmOutput" FROM "public"."Extraction" WHERE id = ' || quote_literal(v_extraction_id);
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: rawLlmOutput was accessible to ordinary client via select!';
  END IF;
  RAISE NOTICE '  ✅ Test 7 Passed: Column-level security protects rawLlmOutput audit stream';

  -- ── TEST 8: Verify covering index on ExtractionField.sourceRegionId ─
  SELECT count(*) INTO v_test_count
  FROM pg_indexes
  WHERE tablename = 'ExtractionField'
    AND indexname = 'ExtractionField_sourceRegionId_idx';

  IF v_test_count = 0 THEN
    RAISE EXCEPTION 'FAILED: Covering index ExtractionField_sourceRegionId_idx is missing!';
  END IF;
  RAISE NOTICE '  ✅ Test 8 Passed: Covering index on ExtractionField.sourceRegionId confirmed';

  -- ── CLEANUP ──────────────────────────────────────────────────
  RESET ROLE;
  DELETE FROM "public"."ProcessingJob" WHERE id = v_job_id;
  DELETE FROM "public"."ExtractionField" WHERE id = v_field_id;
  DELETE FROM "public"."Extraction" WHERE id = v_extraction_id;
  DELETE FROM "public"."DocumentRegion" WHERE id = v_region_id;
  DELETE FROM "public"."DocumentPage" WHERE id = v_page_id;
  DELETE FROM "public"."SourceDocument" WHERE id = v_doc_id;
  DELETE FROM "public"."FamilyMembership" WHERE id = v_membership_id;
  DELETE FROM "public"."CaregiverProfile" WHERE id = v_caregiver_profile_id;
  DELETE FROM "public"."PatientProfile" WHERE id = v_patient_profile_id;
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id, v_caregiver_user_id);

  RAISE NOTICE '── [TEST SUITE COMPLETED] All 8 Module 4 Security Tests Passed! ──';
END $$;

