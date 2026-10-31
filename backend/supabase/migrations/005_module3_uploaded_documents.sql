-- ============================================================
-- Recovery Compass — Supabase Migration: Module 3
-- Scope: Uploaded Documents (3 tables)
-- Tables: "SourceDocument", "DocumentPage", "DocumentRegion"
-- ============================================================

-- ── Step 0: Helper Functions for Document Access Control ──────
CREATE OR REPLACE FUNCTION public.can_access_document(p_document_id text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."SourceDocument" sd
    WHERE sd.id = p_document_id
      AND (
        public.is_patient_owner(sd."patientProfileId")
        OR public.has_caregiver_permission(sd."patientProfileId", 'VIEW_PLAN')
      )
  );
$$;

-- ── Step 1: Enable Row Level Security ─────────────────────────
ALTER TABLE "public"."SourceDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DocumentPage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DocumentRegion" ENABLE ROW LEVEL SECURITY;

-- ── Step 2: Clean up previous policies on these 3 tables ──────
DROP POLICY IF EXISTS "user_select_source_document" ON "public"."SourceDocument";
DROP POLICY IF EXISTS "patient_manage_source_document" ON "public"."SourceDocument";
DROP POLICY IF EXISTS "service_role_source_document" ON "public"."SourceDocument";

DROP POLICY IF EXISTS "user_select_document_page" ON "public"."DocumentPage";
DROP POLICY IF EXISTS "service_role_document_page" ON "public"."DocumentPage";

DROP POLICY IF EXISTS "user_select_document_region" ON "public"."DocumentRegion";
DROP POLICY IF EXISTS "service_role_document_region" ON "public"."DocumentRegion";

DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."SourceDocument";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."DocumentPage";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."DocumentRegion";

-- ── Step 3: Privilege Grants / Revocations ────────────────────
REVOKE ALL ON TABLE "public"."SourceDocument" FROM anon;
REVOKE ALL ON TABLE "public"."DocumentPage" FROM anon;
REVOKE ALL ON TABLE "public"."DocumentRegion" FROM anon;

-- Ordinary clients can read documents they have rights to
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."SourceDocument" TO authenticated;
-- Pages and OCR regions are managed by server-side workers; clients only read
GRANT SELECT ON TABLE "public"."DocumentPage" TO authenticated;
GRANT SELECT ON TABLE "public"."DocumentRegion" TO authenticated;

-- Trusted backend service role and postgres
GRANT ALL ON TABLE "public"."SourceDocument" TO postgres, service_role;
GRANT ALL ON TABLE "public"."DocumentPage" TO postgres, service_role;
GRANT ALL ON TABLE "public"."DocumentRegion" TO postgres, service_role;

-- ── Step 4: Policies for "SourceDocument" ─────────────────────
-- Patient and active caregiver with VIEW_PLAN can read document metadata
CREATE POLICY "user_select_source_document"
  ON "public"."SourceDocument"
  FOR SELECT
  TO authenticated
  USING (
    public.is_patient_owner("patientProfileId")
    OR public.has_caregiver_permission("patientProfileId", 'VIEW_PLAN')
  );

-- Patient can upload, update status, or soft-delete their own documents
CREATE POLICY "patient_manage_source_document"
  ON "public"."SourceDocument"
  FOR ALL
  TO authenticated
  USING (public.is_patient_owner("patientProfileId"))
  WITH CHECK (public.is_patient_owner("patientProfileId"));

CREATE POLICY "service_role_source_document"
  ON "public"."SourceDocument"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 5: Policies for "DocumentPage" ───────────────────────
-- Access checked through the parent document relationship
CREATE POLICY "user_select_document_page"
  ON "public"."DocumentPage"
  FOR SELECT
  TO authenticated
  USING (public.can_access_document("documentId"));

CREATE POLICY "service_role_document_page"
  ON "public"."DocumentPage"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 6: Policies for "DocumentRegion" ─────────────────────
-- Access checked through DocumentPage -> SourceDocument hierarchy
CREATE POLICY "user_select_document_region"
  ON "public"."DocumentRegion"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."DocumentPage" dp
      WHERE dp.id = "DocumentRegion"."pageId"
        AND public.can_access_document(dp."documentId")
    )
  );

CREATE POLICY "service_role_document_region"
  ON "public"."DocumentRegion"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

