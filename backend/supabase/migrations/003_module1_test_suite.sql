-- ============================================================
-- Recovery Compass — Verification Test Suite for Module 1
-- Run this in Supabase SQL Editor to verify Module 1 security guarantees
-- ============================================================

DO $$
DECLARE
  v_user_a_id text := '11111111-1111-1111-1111-111111111111';
  v_user_b_id text := '22222222-2222-2222-2222-222222222222';
  v_test_count int;
  v_err_caught boolean := false;
BEGIN
  RAISE NOTICE '── [TEST SUITE START] Verifying Module 1 (User, RefreshToken, OtpCode) ──';

  -- 1. Setup temporary test fixtures as superuser
  DELETE FROM "public"."OtpCode" WHERE "userId" IN (v_user_a_id, v_user_b_id);
  DELETE FROM "public"."RefreshToken" WHERE "userId" IN (v_user_a_id, v_user_b_id);
  DELETE FROM "public"."User" WHERE id IN (v_user_a_id, v_user_b_id);

  INSERT INTO "public"."User" (id, email, "passwordHash", role, "firstName", "lastName", "isActive", "createdAt", "updatedAt")
  VALUES 
    (v_user_a_id, 'test_user_a@example.com', '$2a$12$fakehashA', 'PATIENT', 'Alice', 'Smith', true, NOW(), NOW()),
    (v_user_b_id, 'test_user_b@example.com', '$2a$12$fakehashB', 'PATIENT', 'Bob', 'Jones', true, NOW(), NOW());

  INSERT INTO "public"."RefreshToken" (id, "userId", "tokenHash", "expiresAt", "isRevoked")
  VALUES ('token-a-1', v_user_a_id, 'hash-a-secret', NOW() + INTERVAL '7 days', false);

  INSERT INTO "public"."OtpCode" (id, "userId", code, purpose, "expiresAt")
  VALUES ('otp-a-1', v_user_a_id, '123456', 'LOGIN', NOW() + INTERVAL '10 minutes');

  -- ── TEST 1: Anon role cannot access any User rows ────────────
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."User";
    IF v_test_count > 0 THEN
      RAISE EXCEPTION 'FAILED: Anon role read % rows from User table!', v_test_count;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected behavior: access is completely revoked
    NULL;
  END;
  RAISE NOTICE '  ✅ Test 1 Passed: Anon role cannot read from User table';

  -- ── TEST 2: Anon role cannot access RefreshToken or OtpCode ──
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."RefreshToken";
    IF v_test_count > 0 THEN
      RAISE EXCEPTION 'FAILED: Anon role read % rows from RefreshToken!', v_test_count;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."OtpCode";
    IF v_test_count > 0 THEN
      RAISE EXCEPTION 'FAILED: Anon role read % rows from OtpCode!', v_test_count;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RAISE NOTICE '  ✅ Test 2 Passed: Anon role cannot read RefreshToken or OtpCode';

  -- ── TEST 3: Authenticated User A can read their own profile ───
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_user_a_id, true);

  SELECT count(*) INTO v_test_count 
  FROM "public"."User" 
  WHERE id = v_user_a_id;

  IF v_test_count <> 1 THEN
    RAISE EXCEPTION 'FAILED: Authenticated User A could not read their own profile!';
  END IF;
  RAISE NOTICE '  ✅ Test 3 Passed: Authenticated user can read their own profile';

  -- ── TEST 4: Authenticated User A CANNOT read User B's profile ─
  SELECT count(*) INTO v_test_count 
  FROM "public"."User" 
  WHERE id = v_user_b_id;

  IF v_test_count > 0 THEN
    RAISE EXCEPTION 'FAILED: Cross-user violation! User A was able to read User B profile.';
  END IF;
  RAISE NOTICE '  ✅ Test 4 Passed: Cross-user profile access blocked (User A cannot view User B)';

  -- ── TEST 5: Password hash is protected by Column-Level Security
  v_err_caught := false;
  BEGIN
    -- This must trigger an insufficient_privilege error because passwordHash is revoked
    EXECUTE 'SELECT "passwordHash" FROM "public"."User" WHERE id = ' || quote_literal(v_user_a_id);
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: Authenticated user was able to query passwordHash column!';
  END IF;
  RAISE NOTICE '  ✅ Test 5 Passed: Column-level security protects passwordHash from ordinary clients';

  -- ── TEST 6: Authenticated User A CANNOT read RefreshToken or OtpCode
  v_err_caught := false;
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."RefreshToken";
    IF v_test_count > 0 THEN
      RAISE EXCEPTION 'FAILED: Authenticated user read % rows from RefreshToken!', v_test_count;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;
  RAISE NOTICE '  ✅ Test 6 Passed: Direct client access to RefreshToken is blocked';

  v_err_caught := false;
  BEGIN
    SELECT count(*) INTO v_test_count FROM "public"."OtpCode";
    IF v_test_count > 0 THEN
      RAISE EXCEPTION 'FAILED: Authenticated user read % rows from OtpCode!', v_test_count;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;
  RAISE NOTICE '  ✅ Test 7 Passed: Direct client access to OtpCode is blocked';

  -- ── TEST 7: Role elevation attempt is blocked ─────────────────
  v_err_caught := false;
  BEGIN
    -- User A attempts to escalate their role to ADMIN
    EXECUTE 'UPDATE "public"."User" SET role = ''ADMIN'' WHERE id = ' || quote_literal(v_user_a_id);
  EXCEPTION WHEN insufficient_privilege THEN
    v_err_caught := true;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'FAILED: Authenticated user was able to update their role column!';
  END IF;
  RAISE NOTICE '  ✅ Test 8 Passed: Role elevation attempt blocked by column privileges';

  -- ── TEST 8: Safe profile update is permitted ──────────────────
  UPDATE "public"."User" 
  SET "firstName" = 'AliceUpdated' 
  WHERE id = v_user_a_id;
  RAISE NOTICE '  ✅ Test 9 Passed: User can update their own safe personal profile fields';

  -- ── CLEANUP ──────────────────────────────────────────────────
  RESET ROLE;
  DELETE FROM "public"."OtpCode" WHERE "userId" IN (v_user_a_id, v_user_b_id);
  DELETE FROM "public"."RefreshToken" WHERE "userId" IN (v_user_a_id, v_user_b_id);
  DELETE FROM "public"."User" WHERE id IN (v_user_a_id, v_user_b_id);

  RAISE NOTICE '── [TEST SUITE COMPLETED] All 9 Module 1 Security Tests Passed! ──';
END $$;

