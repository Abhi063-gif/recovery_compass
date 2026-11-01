-- ============================================================
-- Recovery Compass — Final Comprehensive Health & Security Audit
-- Run this in Supabase SQL Editor to verify the entire database status
-- ============================================================

-- ── 1. Check Row Level Security (RLS) status across all 34 public tables ──
SELECT 
  t.tablename,
  CASE WHEN t.rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END AS rls_status,
  COALESCE(p.policy_count, 0) AS active_policies
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, count(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'User', 'RefreshToken', 'OtpCode',
    'PatientProfile', 'CaregiverProfile', 'FamilyInvitation', 'FamilyMembership', 'ConsentRecord',
    'SourceDocument', 'DocumentPage', 'DocumentRegion',
    'Extraction', 'ExtractionField', 'ProcessingJob',
    'RecoveryPlan', 'PlanVersion', 'RecoveryTask', 'TaskEvent', 'Medication', 'MedicationSchedule', 'MedicationEvent',
    'PathwayTemplate', 'SymptomDefinition', 'SymptomLog', 'RedFlagRule', 'RedFlagEvent', 'FollowUp', 'PendingTest', 'DoctorQuestion',
    'Notification', 'NotificationPreference', 'AuditEvent', 'AdminConfiguration', 'DeletionRequest'
  )
ORDER BY t.tablename;

-- ── 2. High-Level RLS Health Scorecard (Target: 34 / 34 Protected) ────────
SELECT 
  COUNT(*) FILTER (WHERE t.rowsecurity AND COALESCE(p.policy_count, 0) > 0) AS secured_tables_count,
  34 AS target_tables_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE t.rowsecurity AND COALESCE(p.policy_count, 0) > 0) >= 34 
    THEN '✅ ALL 34 TABLES SECURED WITH ACTIVE RLS POLICIES' 
    ELSE '❌ WARNING: INCOMPLETE RLS COVERAGE' 
  END AS overall_status
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, count(*) AS policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'User', 'RefreshToken', 'OtpCode',
    'PatientProfile', 'CaregiverProfile', 'FamilyInvitation', 'FamilyMembership', 'ConsentRecord',
    'SourceDocument', 'DocumentPage', 'DocumentRegion',
    'Extraction', 'ExtractionField', 'ProcessingJob',
    'RecoveryPlan', 'PlanVersion', 'RecoveryTask', 'TaskEvent', 'Medication', 'MedicationSchedule', 'MedicationEvent',
    'PathwayTemplate', 'SymptomDefinition', 'SymptomLog', 'RedFlagRule', 'RedFlagEvent', 'FollowUp', 'PendingTest', 'DoctorQuestion',
    'Notification', 'NotificationPreference', 'AuditEvent', 'AdminConfiguration', 'DeletionRequest'
  );

-- ── 3. Check the 9 Foreign-Key Covering Indexes ──────────────────────────
SELECT 
  tablename,
  indexname,
  '✅ PRESENT' AS status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'AuditEvent_documentId_idx',
    'ExtractionField_sourceRegionId_idx',
    'FamilyInvitation_invitedByUserId_idx',
    'Notification_followUpId_idx',
    'Notification_medicationScheduleId_idx',
    'PendingTest_followUpId_idx',
    'RecoveryPlan_pathwayTemplateId_idx',
    'RedFlagEvent_ruleId_idx',
    'SymptomLog_symptomDefinitionId_idx'
  )
ORDER BY tablename, indexname;

-- ── 4. Sensitive Column Access Lockdown Check (Target: ALL REVOKED) ───────
SELECT 
  t.table_name,
  t.column_name,
  t.role_tested,
  CASE 
    WHEN has_column_privilege(t.role_tested, '"public"."' || t.table_name || '"', t.column_name, 'SELECT') 
    THEN '❌ LEAKED (Accessible)' 
    ELSE '✅ REVOKED (Protected)' 
  END AS select_status
FROM (
  VALUES 
    ('User', 'passwordHash', 'authenticated'),
    ('User', 'passwordHash', 'anon'),
    ('FamilyInvitation', 'tokenHash', 'authenticated'),
    ('FamilyInvitation', 'tokenHash', 'anon'),
    ('FamilyInvitation', 'otpCode', 'authenticated'),
    ('FamilyInvitation', 'otpCode', 'anon'),
    ('RefreshToken', 'tokenHash', 'authenticated'),
    ('RefreshToken', 'tokenHash', 'anon'),
    ('OtpCode', 'code', 'authenticated'),
    ('OtpCode', 'code', 'anon'),
    ('Extraction', 'rawLlmOutput', 'authenticated'),
    ('Extraction', 'rawLlmOutput', 'anon')
) AS t(table_name, column_name, role_tested)
ORDER BY t.table_name, t.column_name, t.role_tested;
