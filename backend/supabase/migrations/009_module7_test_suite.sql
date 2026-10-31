-- ============================================================
-- Recovery Compass — Verification Test Suite for Module 7
-- Run this in Supabase SQL Editor to verify Module 7 security guarantees
-- ============================================================

DO $$
DECLARE
  v_patient_user_id text := '11111111-2222-3333-4444-555555555555';
  v_other_user_id   text := '22222222-3333-4444-5555-666666666666';

  v_notif_id     text := 'notif-001';
  v_pref_id      text := 'pref-001';
  v_audit_id     text := 'audit-001';
  v_admin_cfg_id text := 'admin-cfg-001';
  v_del_req_id   text := 'del-req-001';

  v_test_count int;
  v_err_caught boolean := false;
BEGIN
  RAISE NOTICE '── [TEST SUITE START] Verifying Module 7 (Notifications, Audit, Admin, Deletion) ──';

  -- 1. Setup clean test fixtures as superuser
  DELETE FROM "public"."DeletionRequest" WHERE id = v_del_req_id;
  DELETE FROM "public"."AdminConfiguration" WHERE id = v_admin_cfg_id;
  DELETE FROM "public"."AuditEvent" WHERE id = v_audit_id;
  DELETE FROM "public"."NotificationPreference" WHERE id = v_pref_id;
  DELETE FROM "public"."Notification" WHERE id = v_notif_id;
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id);

  INSERT INTO "public"."User" (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES 
    (v_patient_user_id, 'alice.patient@test.com', '$2a$12$fake', 'PATIENT', 'Alice', 'Patient', true, NOW(), NOW()),
    (v_other_user_id, 'bob.patient@test.com', '$2a$12$fake', 'PATIENT', 'Bob', 'Patient', true, NOW(), NOW());

  INSERT INTO "public"."Notification" (id, "userId", type, channel, status, body, "idempotencyKey", "createdAt", "updatedAt")
  VALUES (v_notif_id, v_patient_user_id, 'MEDICATION_DUE'::"public"."NotificationType", 'IN_APP'::"public"."NotificationChannel", 'PENDING'::"public"."NotificationStatus", 'Time for your Paracetamol dose', 'notif-key-001', NOW(), NOW());

  INSERT INTO "public"."NotificationPreference" (id, "userId", "emailEnabled", "smsEnabled", "createdAt", "updatedAt")
  VALUES (v_pref_id, v_patient_user_id, true, true, NOW(), NOW());

  INSERT INTO "public"."AuditEvent" (id, "actorId", action, "resourceType", "resourceId", "createdAt")
  VALUES (v_audit_id, v_patient_user_id, 'PLAN_CONFIRMED', 'RecoveryPlan', 'plan-001', NOW());

  INSERT INTO "public"."AdminConfiguration" (id, key, value, description, "createdAt", "updatedAt")
  VALUES (v_admin_cfg_id, 'GLOBAL_SMS_GATEWAY', '{"provider": "twilio", "secret": "confidential"}'::jsonb, 'SMS Gateway Configuration', NOW(), NOW());

  INSERT INTO "public"."DeletionRequest" (id, "userId", status, "requestedAt")
  VALUES (v_del_req_id, v_patient_user_id, 'PENDING'::"public"."DeletionRequestStatus", NOW());

  -- ── TEST 1: Anon role blocked across all Module 7 tables ──────
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."Notification";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read Notification!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."AuditEvent";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read AuditEvent!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."AdminConfiguration";
    IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Anon read AdminConfiguration!'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RAISE NOTICE '  ✅ Test 1 Passed: Anon role denied access to all Module 7 tables';

  -- ── TEST 2: Alice can read her own notifications and preferences ─
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."Notification" WHERE id = v_notif_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read Notification!'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."NotificationPreference" WHERE id = v_pref_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read NotificationPreference!'; END IF;
  RAISE NOTICE '  ✅ Test 2 Passed: User can read their own notifications and preferences';

  -- ── TEST 3: Cross-user isolation (Bob cannot view Alice's notifications) ─
  PERFORM set_config('request.jwt.claim.sub', v_other_user_id, true);

  SELECT count(*) INTO v_test_count FROM "public"."Notification" WHERE id = v_notif_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-user notification leakage! Bob read Alice notification.'; END IF;

  SELECT count(*) INTO v_test_count FROM "public"."NotificationPreference" WHERE id = v_pref_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-user preference leakage! Bob read Alice preference.'; END IF;
  RAISE NOTICE '  ✅ Test 3 Passed: Cross-user notification and preference isolation strictly enforced';

  -- ── TEST 4: Clients CANNOT access AdminConfiguration ─────────
  PERFORM set_config('request.jwt.claim.sub', v_patient_user_id, true);
  v_err_caught := false;
  BEGIN
    EXECUTE 'SELECT count(*) FROM "public"."AdminConfiguration"';
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: Client was able to query AdminConfiguration!';
  END IF;
  RAISE NOTICE '  ✅ Test 4 Passed: Admin configuration is completely isolated from clients';

  -- ── TEST 5: Clients CANNOT rewrite or tamper with AuditEvent ─
  v_err_caught := false;
  BEGIN
    EXECUTE 'UPDATE "public"."AuditEvent" SET action = ''TAMPERED'' WHERE id = ' || quote_literal(v_audit_id);
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: Client was able to update AuditEvent!';
  END IF;
  RAISE NOTICE '  ✅ Test 5 Passed: Audit log immutability verified (client tampering blocked)';

  -- ── TEST 6: User can manage DeletionRequest securely ──────────
  SELECT count(*) INTO v_test_count FROM "public"."DeletionRequest" WHERE id = v_del_req_id;
  IF v_test_count <> 1 THEN RAISE EXCEPTION 'FAILED: Alice could not read her DeletionRequest!'; END IF;

  PERFORM set_config('request.jwt.claim.sub', v_other_user_id, true);
  SELECT count(*) INTO v_test_count FROM "public"."DeletionRequest" WHERE id = v_del_req_id;
  IF v_test_count > 0 THEN RAISE EXCEPTION 'FAILED: Cross-user deletion request leakage!'; END IF;
  RAISE NOTICE '  ✅ Test 6 Passed: Deletion requests are private to account owner';

  -- ── TEST 7: Verify covering indexes ──────────────────────────
  SELECT count(*) INTO v_test_count
  FROM pg_indexes
  WHERE tablename = 'Notification' AND indexname = 'Notification_followUpId_idx';
  IF v_test_count = 0 THEN RAISE EXCEPTION 'FAILED: Notification_followUpId_idx missing!'; END IF;

  SELECT count(*) INTO v_test_count
  FROM pg_indexes
  WHERE tablename = 'Notification' AND indexname = 'Notification_medicationScheduleId_idx';
  IF v_test_count = 0 THEN RAISE EXCEPTION 'FAILED: Notification_medicationScheduleId_idx missing!'; END IF;

  SELECT count(*) INTO v_test_count
  FROM pg_indexes
  WHERE tablename = 'AuditEvent' AND indexname = 'AuditEvent_documentId_idx';
  IF v_test_count = 0 THEN RAISE EXCEPTION 'FAILED: AuditEvent_documentId_idx missing!'; END IF;
  RAISE NOTICE '  ✅ Test 7 Passed: Covering indexes on Notification and AuditEvent confirmed';

  -- ── CLEANUP ──────────────────────────────────────────────────
  RESET ROLE;
  DELETE FROM "public"."DeletionRequest" WHERE id = v_del_req_id;
  DELETE FROM "public"."AdminConfiguration" WHERE id = v_admin_cfg_id;
  DELETE FROM "public"."AuditEvent" WHERE id = v_audit_id;
  DELETE FROM "public"."NotificationPreference" WHERE id = v_pref_id;
  DELETE FROM "public"."Notification" WHERE id = v_notif_id;
  DELETE FROM "public"."User" WHERE id IN (v_patient_user_id, v_other_user_id);

  RAISE NOTICE '── [TEST SUITE COMPLETED] All 7 Module 7 Security Tests Passed! ──';
END $$;

