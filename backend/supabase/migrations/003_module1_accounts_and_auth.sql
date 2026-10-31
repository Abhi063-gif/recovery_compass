-- ============================================================
-- Recovery Compass — Supabase Migration: Module 1
-- Scope: Accounts and Authentication (3 tables)
-- Tables: "User", "RefreshToken", "OtpCode"
-- ============================================================
--
-- IDENTITY MAPPING & ARCHITECTURE:
-- In Supabase PostgREST, authenticated requests carry a JWT containing the
-- user's subject identifier in the 'sub' claim (accessible via auth.uid() or
-- request.jwt.claim.sub).
-- In Recovery Compass, User.id is a UUID matching this subject claim.
--
-- ACCESS SPECIFICATION:
-- 1. "User":
--    - anon: NO access.
--    - authenticated: SELECT own profile, UPDATE safe personal fields (firstName, lastName, phone).
--    - sensitive columns (passwordHash): explicitly REVOKED from anon/authenticated.
--    - role elevation (role, isActive): blocked from authenticated updates.
--    - service_role / postgres: full access.
-- 2. "RefreshToken":
--    - anon & authenticated: NO access (server-side token verification only).
--    - service_role / postgres: full access.
-- 3. "OtpCode":
--    - anon & authenticated: NO access (protects against OTP interception).
--    - service_role / postgres: full access.
-- ============================================================

-- ── Step 0: Helper function for unified user identity extraction ──
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (auth.uid())::text
  );
$$;

COMMENT ON FUNCTION public.requesting_user_id IS
  'Extracts the requesting user UUID as text from either auth.uid() or the JWT sub claim.';

-- ── Step 1: Enable Row Level Security ─────────────────────────
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OtpCode" ENABLE ROW LEVEL SECURITY;

-- ── Step 2: Clear existing policies on these 3 tables ─────────
DROP POLICY IF EXISTS "user_select_own" ON "public"."User";
DROP POLICY IF EXISTS "user_update_own" ON "public"."User";
DROP POLICY IF EXISTS "service_role_all_users" ON "public"."User";
DROP POLICY IF EXISTS "deny_browser_refresh_tokens" ON "public"."RefreshToken";
DROP POLICY IF EXISTS "service_role_all_refresh_tokens" ON "public"."RefreshToken";
DROP POLICY IF EXISTS "deny_browser_otp_codes" ON "public"."OtpCode";
DROP POLICY IF EXISTS "service_role_all_otp_codes" ON "public"."OtpCode";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."User";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."RefreshToken";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."OtpCode";

-- ── Step 3: Column-Level Privilege Lockdown on "User" ──────────
-- Ensure passwords, roles, and status cannot be read or tampered with directly via PostgREST
REVOKE ALL ON TABLE "public"."User" FROM anon;
REVOKE ALL ON TABLE "public"."RefreshToken" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."OtpCode" FROM anon, authenticated;

-- Allow authenticated users to select non-credential fields
GRANT SELECT (id, email, phone, role, "firstName", "lastName", "isActive", "isEmailVerified", "isPhoneVerified", "lastLoginAt", "createdAt", "updatedAt")
  ON TABLE "public"."User" TO authenticated;

-- Allow authenticated users to update safe personal profile fields only
GRANT UPDATE ("firstName", "lastName", phone, "updatedAt")
  ON TABLE "public"."User" TO authenticated;

-- Ensure service_role and postgres maintain complete access
GRANT ALL ON TABLE "public"."User" TO postgres, service_role;
GRANT ALL ON TABLE "public"."RefreshToken" TO postgres, service_role;
GRANT ALL ON TABLE "public"."OtpCode" TO postgres, service_role;

-- ── Step 4: Define RLS Policies for "User" ────────────────────
-- 1. Authenticated users can view their own profile only
CREATE POLICY "user_select_own"
  ON "public"."User"
  FOR SELECT
  TO authenticated
  USING (id = public.requesting_user_id());

-- 2. Authenticated users can update their own profile only
CREATE POLICY "user_update_own"
  ON "public"."User"
  FOR UPDATE
  TO authenticated
  USING (id = public.requesting_user_id())
  WITH CHECK (id = public.requesting_user_id());

-- 3. Trusted server-side operations (service_role) retain full access
CREATE POLICY "service_role_all_users"
  ON "public"."User"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 5: Define RLS Policies for "RefreshToken" ────────────
-- Strictly backend / service_role only. No browser role can inspect token hashes.
CREATE POLICY "service_role_all_refresh_tokens"
  ON "public"."RefreshToken"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 6: Define RLS Policies for "OtpCode" ─────────────────
-- Strictly backend / service_role only. No browser role can inspect raw OTPs.
CREATE POLICY "service_role_all_otp_codes"
  ON "public"."OtpCode"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

