-- ============================================================
-- Recovery Compass — Supabase Migration: Module 4
-- Scope: Extraction and Processing (3 tables)
-- Tables: "Extraction", "ExtractionField", "ProcessingJob"
-- ============================================================

-- ── Step 0: Helper Functions for Extraction Access Control ────
CREATE OR REPLACE FUNCTION public.can_access_extraction(p_extraction_id text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."Extraction" e
    WHERE e.id = p_extraction_id
      AND public.can_access_document(e."documentId")
  );
$$;

-- ── Step 1: Covering Index for ExtractionField.sourceRegionId ─
CREATE INDEX IF NOT EXISTS "ExtractionField_sourceRegionId_idx"
  ON "public"."ExtractionField"("sourceRegionId");

-- ── Step 2: Enable Row Level Security ─────────────────────────
ALTER TABLE "public"."Extraction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ExtractionField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProcessingJob" ENABLE ROW LEVEL SECURITY;

-- ── Step 3: Clean up previous policies on these 3 tables ──────
DROP POLICY IF EXISTS "user_select_extraction" ON "public"."Extraction";
DROP POLICY IF EXISTS "patient_update_extraction" ON "public"."Extraction";
DROP POLICY IF EXISTS "service_role_extraction" ON "public"."Extraction";

DROP POLICY IF EXISTS "user_select_extraction_field" ON "public"."ExtractionField";
DROP POLICY IF EXISTS "patient_update_extraction_field" ON "public"."ExtractionField";
DROP POLICY IF EXISTS "service_role_extraction_field" ON "public"."ExtractionField";

DROP POLICY IF EXISTS "user_select_processing_job" ON "public"."ProcessingJob";
DROP POLICY IF EXISTS "service_role_processing_job" ON "public"."ProcessingJob";

DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."Extraction";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."ExtractionField";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."ProcessingJob";

-- ── Step 4: Privilege Grants / Revocations ────────────────────
REVOKE ALL ON TABLE "public"."Extraction" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."ExtractionField" FROM anon;
REVOKE ALL ON TABLE "public"."ProcessingJob" FROM anon;

-- Protect raw LLM output from ordinary API queries (grant safe columns only)
GRANT SELECT (
  id, "documentId", status, "llmModel", "llmVersion", "schemaVersion",
  "confirmedAt", "confirmedBy", "createdAt", "updatedAt"
) ON TABLE "public"."Extraction" TO authenticated;
GRANT UPDATE (status, "confirmedAt", "confirmedBy", "updatedAt") ON TABLE "public"."Extraction" TO authenticated;

-- Extraction fields can be read and edited during human verification
GRANT SELECT, UPDATE ON TABLE "public"."ExtractionField" TO authenticated;
-- Processing jobs are strictly read-only for clients to poll status
GRANT SELECT ON TABLE "public"."ProcessingJob" TO authenticated;

-- Trusted backend service role and postgres
GRANT ALL ON TABLE "public"."Extraction" TO postgres, service_role;
GRANT ALL ON TABLE "public"."ExtractionField" TO postgres, service_role;
GRANT ALL ON TABLE "public"."ProcessingJob" TO postgres, service_role;

-- ── Step 5: Policies for "Extraction" ─────────────────────────
-- Read allowed through parent document permission
CREATE POLICY "user_select_extraction"
  ON "public"."Extraction"
  FOR SELECT
  TO authenticated
  USING (public.can_access_document("documentId"));

-- Patient can confirm extraction during human verification flow
CREATE POLICY "patient_update_extraction"
  ON "public"."Extraction"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."SourceDocument" sd
      WHERE sd.id = "Extraction"."documentId"
        AND public.is_patient_owner(sd."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."SourceDocument" sd
      WHERE sd.id = "Extraction"."documentId"
        AND public.is_patient_owner(sd."patientProfileId")
    )
  );

CREATE POLICY "service_role_extraction"
  ON "public"."Extraction"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 6: Policies for "ExtractionField" ────────────────────
-- Read allowed through extraction -> document parent hierarchy
CREATE POLICY "user_select_extraction_field"
  ON "public"."ExtractionField"
  FOR SELECT
  TO authenticated
  USING (public.can_access_extraction("extractionId"));

-- Patient can edit values and confirm fields during review
CREATE POLICY "patient_update_extraction_field"
  ON "public"."ExtractionField"
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Extraction" e
      JOIN "public"."SourceDocument" sd ON sd.id = e."documentId"
      WHERE e.id = "ExtractionField"."extractionId"
        AND public.is_patient_owner(sd."patientProfileId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."Extraction" e
      JOIN "public"."SourceDocument" sd ON sd.id = e."documentId"
      WHERE e.id = "ExtractionField"."extractionId"
        AND public.is_patient_owner(sd."patientProfileId")
    )
  );

CREATE POLICY "service_role_extraction_field"
  ON "public"."ExtractionField"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 7: Policies for "ProcessingJob" ──────────────────────
-- Clients can poll job status only for their own documents
CREATE POLICY "user_select_processing_job"
  ON "public"."ProcessingJob"
  FOR SELECT
  TO authenticated
  USING (
    "documentId" IS NOT NULL
    AND public.can_access_document("documentId")
  );

-- Backend workers control job creation, attempts, results, and state transitions
CREATE POLICY "service_role_processing_job"
  ON "public"."ProcessingJob"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

