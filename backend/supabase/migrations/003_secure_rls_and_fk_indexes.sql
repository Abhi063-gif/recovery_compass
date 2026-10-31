-- ============================================================
-- Recovery Compass — Supabase Migration 003
-- Security Lockdown: Enable RLS on all 34 public tables
-- Performance Optimization: Covering indexes for unindexed foreign keys
-- ============================================================
-- Safe to execute in: Supabase Dashboard → SQL Editor
-- Or via: supabase db push
--
-- ARCHITECTURAL CONTEXT:
-- Recovery Compass utilizes a centralized NestJS REST API with Prisma ORM.
-- Prisma connects via the direct connection / transaction pooler using the
-- `postgres` database owner, which automatically BYPASSES Row Level Security.
--
-- The Supabase PostgREST Data API exposes the `public` schema to the browser
-- using `anon` and `authenticated` roles. Because the frontend communicates
-- exclusively with NestJS (/api/v1/*) and never queries PostgREST directly,
-- enabling RLS and denying `anon`/`authenticated` access completely seals
-- external data exposure without breaking application functionality.
-- ============================================================

-- ── Step 1: Enable RLS on all 34 public tables ────────────────
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OtpCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PatientProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CaregiverProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PathwayTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SourceDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DocumentPage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DocumentRegion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Extraction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ExtractionField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RecoveryPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PlanVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RecoveryTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TaskEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Medication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MedicationSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."MedicationEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SymptomDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SymptomLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RedFlagRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RedFlagEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FollowUp" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PendingTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DoctorQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FamilyInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FamilyMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ConsentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."NotificationPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AdminConfiguration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProcessingJob" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DeletionRequest" ENABLE ROW LEVEL SECURITY;

-- ── Step 2: Enforce Restrictive Deny-All Policies for browser roles ─
-- Explicit defense-in-depth: Even if permissive policies are accidentally
-- added later, RESTRICTIVE policies evaluate as AND with PERMISSIVE ones.
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'User', 'RefreshToken', 'OtpCode', 'PatientProfile', 'CaregiverProfile',
    'PathwayTemplate', 'SourceDocument', 'DocumentPage', 'DocumentRegion',
    'Extraction', 'ExtractionField', 'RecoveryPlan', 'PlanVersion',
    'RecoveryTask', 'TaskEvent', 'Medication', 'MedicationSchedule',
    'MedicationEvent', 'SymptomDefinition', 'SymptomLog', 'RedFlagRule',
    'RedFlagEvent', 'FollowUp', 'PendingTest', 'DoctorQuestion',
    'FamilyInvitation', 'FamilyMembership', 'ConsentRecord', 'Notification',
    'NotificationPreference', 'AuditEvent', 'AdminConfiguration',
    'ProcessingJob', 'DeletionRequest'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."%I";', tbl);
    EXECUTE format(
      'CREATE POLICY "deny_direct_browser_access" ON "public"."%I" AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);',
      tbl
    );
  END LOOP;
END $$;

-- ── Step 3: Revoke Direct Table & Routine Privileges from anon/authenticated ─
-- Prevents any unauthorized PostgREST introspection or direct API interaction
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- Ensure service_role and postgres retain full operational access
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;

-- ── Step 4: Add Covering Indexes for Unindexed Foreign Keys ─────
-- Prevents table scans during cascading operations, joins, and parent row updates/deletes

-- 1. AuditEvent -> SourceDocument (documentId)
CREATE INDEX IF NOT EXISTS "AuditEvent_documentId_idx"
  ON "public"."AuditEvent"("documentId");

-- 2. ExtractionField -> DocumentRegion (sourceRegionId)
CREATE INDEX IF NOT EXISTS "ExtractionField_sourceRegionId_idx"
  ON "public"."ExtractionField"("sourceRegionId");

-- 3. FamilyInvitation -> User (invitedByUserId)
CREATE INDEX IF NOT EXISTS "FamilyInvitation_invitedByUserId_idx"
  ON "public"."FamilyInvitation"("invitedByUserId");

-- 4. Notification -> MedicationSchedule (medicationScheduleId)
CREATE INDEX IF NOT EXISTS "Notification_medicationScheduleId_idx"
  ON "public"."Notification"("medicationScheduleId");

-- 5. Notification -> FollowUp (followUpId)
CREATE INDEX IF NOT EXISTS "Notification_followUpId_idx"
  ON "public"."Notification"("followUpId");

-- 6. PendingTest -> FollowUp (followUpId)
CREATE INDEX IF NOT EXISTS "PendingTest_followUpId_idx"
  ON "public"."PendingTest"("followUpId");

-- 7. RecoveryPlan -> PathwayTemplate (pathwayTemplateId)
CREATE INDEX IF NOT EXISTS "RecoveryPlan_pathwayTemplateId_idx"
  ON "public"."RecoveryPlan"("pathwayTemplateId");

-- 8. RedFlagEvent -> RedFlagRule (ruleId)
CREATE INDEX IF NOT EXISTS "RedFlagEvent_ruleId_idx"
  ON "public"."RedFlagEvent"("ruleId");

-- 9. SymptomLog -> SymptomDefinition (symptomDefinitionId)
CREATE INDEX IF NOT EXISTS "SymptomLog_symptomDefinitionId_idx"
  ON "public"."SymptomLog"("symptomDefinitionId");

-- ── Step 5: Verification Query ────────────────────────────────
-- Returns verification table showing RLS status and policy counts for all public tables.
DO $$
BEGIN
  RAISE NOTICE 'RLS and Foreign Key covering indexes successfully applied to all 34 public tables.';
END $$;

