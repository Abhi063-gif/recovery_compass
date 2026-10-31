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
ORDER BY t.tablename;

-- ── 2. Check the 9 Foreign-Key Covering Indexes ──────────────────────────
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

