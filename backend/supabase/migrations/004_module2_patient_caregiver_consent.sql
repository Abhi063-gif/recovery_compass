-- ============================================================
-- Recovery Compass — Supabase Migration: Module 2
-- Scope: Patient, Caregiver, and Consent (5 tables)
-- Tables: "PatientProfile", "CaregiverProfile", "FamilyInvitation",
--         "FamilyMembership", "ConsentRecord"
-- ============================================================

-- ── Step 0: Helper Functions for Patient / Caregiver Circle ───

-- Helper: Check if requesting user owns the PatientProfile
CREATE OR REPLACE FUNCTION public.is_patient_owner(p_patient_profile_id text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."PatientProfile"
    WHERE id = p_patient_profile_id
      AND "userId" = public.requesting_user_id()
  );
$$;

-- Helper: Check if requesting user is an active caregiver for the patient
CREATE OR REPLACE FUNCTION public.is_active_caregiver(p_patient_profile_id text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."FamilyMembership" fm
    JOIN "public"."CaregiverProfile" cp ON cp.id = fm."caregiverProfileId"
    WHERE fm."patientProfileId" = p_patient_profile_id
      AND cp."userId" = public.requesting_user_id()
      AND fm."isActive" = true
      AND fm."revokedAt" IS NULL
  );
$$;

-- Helper: Check if requesting user has a specific caregiver permission
CREATE OR REPLACE FUNCTION public.has_caregiver_permission(
  p_patient_profile_id text,
  p_permission "public"."CaregiverPermission"
)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."FamilyMembership" fm
    JOIN "public"."CaregiverProfile" cp ON cp.id = fm."caregiverProfileId"
    WHERE fm."patientProfileId" = p_patient_profile_id
      AND cp."userId" = public.requesting_user_id()
      AND fm."isActive" = true
      AND fm."revokedAt" IS NULL
      AND p_permission = ANY(fm.permissions)
  );
$$;

-- ── Step 1: Covering Indexes & Enable Row Level Security ────
CREATE INDEX IF NOT EXISTS "FamilyInvitation_invitedByUserId_idx"
  ON "public"."FamilyInvitation"("invitedByUserId");

ALTER TABLE "public"."PatientProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CaregiverProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FamilyInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FamilyMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ConsentRecord" ENABLE ROW LEVEL SECURITY;

-- ── Step 2: Clean up previous policies on these 5 tables ──────
DROP POLICY IF EXISTS "patient_select_profile" ON "public"."PatientProfile";
DROP POLICY IF EXISTS "patient_update_profile" ON "public"."PatientProfile";
DROP POLICY IF EXISTS "caregiver_select_patient_profile" ON "public"."PatientProfile";
DROP POLICY IF EXISTS "service_role_patient_profile" ON "public"."PatientProfile";

DROP POLICY IF EXISTS "caregiver_select_own_profile" ON "public"."CaregiverProfile";
DROP POLICY IF EXISTS "caregiver_update_own_profile" ON "public"."CaregiverProfile";
DROP POLICY IF EXISTS "patient_select_caregiver_profile" ON "public"."CaregiverProfile";
DROP POLICY IF EXISTS "service_role_caregiver_profile" ON "public"."CaregiverProfile";

DROP POLICY IF EXISTS "patient_select_invitations" ON "public"."FamilyInvitation";
DROP POLICY IF EXISTS "patient_update_invitations" ON "public"."FamilyInvitation";
DROP POLICY IF EXISTS "service_role_invitations" ON "public"."FamilyInvitation";

DROP POLICY IF EXISTS "member_select_membership" ON "public"."FamilyMembership";
DROP POLICY IF EXISTS "patient_update_membership" ON "public"."FamilyMembership";
DROP POLICY IF EXISTS "service_role_membership" ON "public"."FamilyMembership";

DROP POLICY IF EXISTS "member_select_consent" ON "public"."ConsentRecord";
DROP POLICY IF EXISTS "patient_manage_consent" ON "public"."ConsentRecord";
DROP POLICY IF EXISTS "service_role_consent" ON "public"."ConsentRecord";

DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."PatientProfile";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."CaregiverProfile";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."FamilyInvitation";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."FamilyMembership";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."ConsentRecord";

-- ── Step 3: Column-Level Privilege Lockdown on Sensitive Tables ─
REVOKE ALL ON TABLE "public"."PatientProfile" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."CaregiverProfile" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."FamilyInvitation" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."FamilyMembership" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."ConsentRecord" FROM anon, authenticated;

-- Allow authenticated users appropriate read/update access
GRANT SELECT, UPDATE ON TABLE "public"."PatientProfile" TO authenticated;
GRANT SELECT, UPDATE ON TABLE "public"."CaregiverProfile" TO authenticated;

-- Protect invitation secret tokens and OTP codes from browser select (grant safe columns only)
GRANT SELECT (
  id, "patientProfileId", "invitedByUserId", email, phone,
  permissions, status, "expiresAt", "acceptedAt", "declinedAt", "createdAt"
) ON TABLE "public"."FamilyInvitation" TO authenticated;
GRANT UPDATE (status, "declinedAt") ON TABLE "public"."FamilyInvitation" TO authenticated;

GRANT SELECT, UPDATE ON TABLE "public"."FamilyMembership" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."ConsentRecord" TO authenticated;

-- Full privileges for trusted backend operations
GRANT ALL ON TABLE "public"."PatientProfile" TO postgres, service_role;
GRANT ALL ON TABLE "public"."CaregiverProfile" TO postgres, service_role;
GRANT ALL ON TABLE "public"."FamilyInvitation" TO postgres, service_role;
GRANT ALL ON TABLE "public"."FamilyMembership" TO postgres, service_role;
GRANT ALL ON TABLE "public"."ConsentRecord" TO postgres, service_role;

-- ── Step 4: Policies for "PatientProfile" ──────────────────────
-- Patient can read their own profile
CREATE POLICY "patient_select_profile"
  ON "public"."PatientProfile"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.requesting_user_id());

-- Patient can update their own profile
CREATE POLICY "patient_update_profile"
  ON "public"."PatientProfile"
  FOR UPDATE
  TO authenticated
  USING ("userId" = public.requesting_user_id())
  WITH CHECK ("userId" = public.requesting_user_id());

-- Active caregivers in the patient circle can read the patient profile
CREATE POLICY "caregiver_select_patient_profile"
  ON "public"."PatientProfile"
  FOR SELECT
  TO authenticated
  USING (public.is_active_caregiver(id));

-- Trusted backend service role
CREATE POLICY "service_role_patient_profile"
  ON "public"."PatientProfile"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 5: Policies for "CaregiverProfile" ────────────────────
-- Caregiver can read their own profile
CREATE POLICY "caregiver_select_own_profile"
  ON "public"."CaregiverProfile"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.requesting_user_id());

-- Caregiver can update their own profile
CREATE POLICY "caregiver_update_own_profile"
  ON "public"."CaregiverProfile"
  FOR UPDATE
  TO authenticated
  USING ("userId" = public.requesting_user_id())
  WITH CHECK ("userId" = public.requesting_user_id());

-- Patient can read profiles of caregivers in their circle
CREATE POLICY "patient_select_caregiver_profile"
  ON "public"."CaregiverProfile"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."FamilyMembership" fm
      JOIN "public"."PatientProfile" pp ON pp.id = fm."patientProfileId"
      WHERE fm."caregiverProfileId" = "CaregiverProfile".id
        AND pp."userId" = public.requesting_user_id()
    )
  );

CREATE POLICY "service_role_caregiver_profile"
  ON "public"."CaregiverProfile"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 6: Policies for "FamilyInvitation" ───────────────────
-- Patient who sent the invitation (or owns the profile) can view invitations
CREATE POLICY "patient_select_invitations"
  ON "public"."FamilyInvitation"
  FOR SELECT
  TO authenticated
  USING (
    "invitedByUserId" = public.requesting_user_id()
    OR public.is_patient_owner("patientProfileId")
  );

-- Patient can update/revoke invitations
CREATE POLICY "patient_update_invitations"
  ON "public"."FamilyInvitation"
  FOR UPDATE
  TO authenticated
  USING (public.is_patient_owner("patientProfileId"))
  WITH CHECK (public.is_patient_owner("patientProfileId"));

CREATE POLICY "service_role_invitations"
  ON "public"."FamilyInvitation"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 7: Policies for "FamilyMembership" ───────────────────
-- Both patient and caregiver can view active/revoked memberships they belong to
CREATE POLICY "member_select_membership"
  ON "public"."FamilyMembership"
  FOR SELECT
  TO authenticated
  USING (
    public.is_patient_owner("patientProfileId")
    OR EXISTS (
      SELECT 1 FROM "public"."CaregiverProfile" cp
      WHERE cp.id = "FamilyMembership"."caregiverProfileId"
        AND cp."userId" = public.requesting_user_id()
    )
  );

-- Only patient can update/revoke memberships and permissions
CREATE POLICY "patient_update_membership"
  ON "public"."FamilyMembership"
  FOR UPDATE
  TO authenticated
  USING (public.is_patient_owner("patientProfileId"))
  WITH CHECK (public.is_patient_owner("patientProfileId"));

CREATE POLICY "service_role_membership"
  ON "public"."FamilyMembership"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 8: Policies for "ConsentRecord" ───────────────────────
-- Patient and active caregiver can view consent history
CREATE POLICY "member_select_consent"
  ON "public"."ConsentRecord"
  FOR SELECT
  TO authenticated
  USING (
    public.is_patient_owner("patientProfileId")
    OR EXISTS (
      SELECT 1 FROM "public"."FamilyMembership" fm
      JOIN "public"."CaregiverProfile" cp ON cp.id = fm."caregiverProfileId"
      WHERE fm.id = "ConsentRecord"."membershipId"
        AND cp."userId" = public.requesting_user_id()
        AND fm."isActive" = true
        AND fm."revokedAt" IS NULL
    )
  );

-- Only patient can grant or revoke consent records
CREATE POLICY "patient_manage_consent"
  ON "public"."ConsentRecord"
  FOR ALL
  TO authenticated
  USING (public.is_patient_owner("patientProfileId"))
  WITH CHECK (public.is_patient_owner("patientProfileId"));

CREATE POLICY "service_role_consent"
  ON "public"."ConsentRecord"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

