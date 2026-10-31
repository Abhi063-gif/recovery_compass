-- ============================================================
-- Recovery Compass — Supabase Migration: Module 7
-- Scope: Notifications, Audit, Admin, and Deletion (5 tables)
-- Tables: "Notification", "NotificationPreference", "AuditEvent",
--         "AdminConfiguration", "DeletionRequest"
-- ============================================================

-- ── Step 1: Covering Indexes for Unindexed Foreign Keys ───────
CREATE INDEX IF NOT EXISTS "Notification_followUpId_idx"
  ON "public"."Notification"("followUpId");

CREATE INDEX IF NOT EXISTS "Notification_medicationScheduleId_idx"
  ON "public"."Notification"("medicationScheduleId");

CREATE INDEX IF NOT EXISTS "AuditEvent_documentId_idx"
  ON "public"."AuditEvent"("documentId");

-- ── Step 2: Enable Row Level Security ─────────────────────────
ALTER TABLE "public"."Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."NotificationPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AdminConfiguration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."DeletionRequest" ENABLE ROW LEVEL SECURITY;

-- ── Step 3: Clean up previous policies on these 5 tables ──────
DROP POLICY IF EXISTS "user_select_notification" ON "public"."Notification";
DROP POLICY IF EXISTS "user_update_notification" ON "public"."Notification";
DROP POLICY IF EXISTS "service_role_notification" ON "public"."Notification";

DROP POLICY IF EXISTS "user_select_notification_pref" ON "public"."NotificationPreference";
DROP POLICY IF EXISTS "user_manage_notification_pref" ON "public"."NotificationPreference";
DROP POLICY IF EXISTS "service_role_notification_pref" ON "public"."NotificationPreference";

DROP POLICY IF EXISTS "user_select_audit_event" ON "public"."AuditEvent";
DROP POLICY IF EXISTS "service_role_audit_event" ON "public"."AuditEvent";

DROP POLICY IF EXISTS "service_role_admin_configuration" ON "public"."AdminConfiguration";

DROP POLICY IF EXISTS "user_select_deletion_request" ON "public"."DeletionRequest";
DROP POLICY IF EXISTS "user_insert_deletion_request" ON "public"."DeletionRequest";
DROP POLICY IF EXISTS "service_role_deletion_request" ON "public"."DeletionRequest";

DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."Notification";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."NotificationPreference";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."AuditEvent";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."AdminConfiguration";
DROP POLICY IF EXISTS "deny_direct_browser_access" ON "public"."DeletionRequest";

-- ── Step 4: Privilege Grants / Revocations ────────────────────
REVOKE ALL ON TABLE "public"."Notification" FROM anon;
REVOKE ALL ON TABLE "public"."NotificationPreference" FROM anon;
REVOKE ALL ON TABLE "public"."AuditEvent" FROM anon;
REVOKE ALL ON TABLE "public"."AdminConfiguration" FROM anon, authenticated;
REVOKE ALL ON TABLE "public"."DeletionRequest" FROM anon;

-- Ordinary clients can view notifications and manage preferences
GRANT SELECT, UPDATE ON TABLE "public"."Notification" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."NotificationPreference" TO authenticated;
-- Audit trail is read-only for transparency; no direct client write/tampering
GRANT SELECT ON TABLE "public"."AuditEvent" TO authenticated;
-- Deletion requests: clients can view and submit
GRANT SELECT, INSERT ON TABLE "public"."DeletionRequest" TO authenticated;

-- Superuser and service role have full access
GRANT ALL ON TABLE "public"."Notification" TO postgres, service_role;
GRANT ALL ON TABLE "public"."NotificationPreference" TO postgres, service_role;
GRANT ALL ON TABLE "public"."AuditEvent" TO postgres, service_role;
GRANT ALL ON TABLE "public"."AdminConfiguration" TO postgres, service_role;
GRANT ALL ON TABLE "public"."DeletionRequest" TO postgres, service_role;

-- ── Step 5: Policies for "Notification" ───────────────────────
CREATE POLICY "user_select_notification"
  ON "public"."Notification"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.requesting_user_id());

CREATE POLICY "user_update_notification"
  ON "public"."Notification"
  FOR UPDATE
  TO authenticated
  USING ("userId" = public.requesting_user_id())
  WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "service_role_notification"
  ON "public"."Notification"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 6: Policies for "NotificationPreference" ─────────────
CREATE POLICY "user_select_notification_pref"
  ON "public"."NotificationPreference"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.requesting_user_id());

CREATE POLICY "user_manage_notification_pref"
  ON "public"."NotificationPreference"
  FOR ALL
  TO authenticated
  USING ("userId" = public.requesting_user_id())
  WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "service_role_notification_pref"
  ON "public"."NotificationPreference"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 7: Policies for "AuditEvent" ─────────────────────────
-- Users can inspect compliance audit events relating to their own actions or plan
CREATE POLICY "user_select_audit_event"
  ON "public"."AuditEvent"
  FOR SELECT
  TO authenticated
  USING (
    "actorId" = public.requesting_user_id()
    OR ("planId" IS NOT NULL AND public.can_access_plan("planId"))
  );

-- Audit history is strictly immutable from the client; only backend writes
CREATE POLICY "service_role_audit_event"
  ON "public"."AuditEvent"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 8: Policies for "AdminConfiguration" ─────────────────
-- Strictly server-side and administrators only. Browser clients have zero access.
CREATE POLICY "service_role_admin_configuration"
  ON "public"."AdminConfiguration"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Step 9: Policies for "DeletionRequest" ────────────────────
CREATE POLICY "user_select_deletion_request"
  ON "public"."DeletionRequest"
  FOR SELECT
  TO authenticated
  USING ("userId" = public.requesting_user_id());

CREATE POLICY "user_insert_deletion_request"
  ON "public"."DeletionRequest"
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = public.requesting_user_id());

CREATE POLICY "service_role_deletion_request"
  ON "public"."DeletionRequest"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

