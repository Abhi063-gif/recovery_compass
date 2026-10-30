-- ============================================================
-- Recovery Compass — Supabase Migration 002
-- Utility functions + monitoring views
-- ============================================================
-- Run after 001_pgvector_and_rls.sql
-- ============================================================

-- ── Semantic search function ──────────────────────────────────
-- Callable from the backend via Supabase RPC for vector search.
-- Returns top-k chunks for a document, ordered by cosine distance.
-- This is an alternative to raw SQL — can also be called via supabase.rpc()
CREATE OR REPLACE FUNCTION search_document_chunks(
  p_document_id   TEXT,
  p_query_embedding VECTOR(768),
  p_top_k         INTEGER DEFAULT 8
)
RETURNS TABLE (
  id              TEXT,
  document_id     TEXT,
  page_number     INTEGER,
  chunk_index     INTEGER,
  content         TEXT,
  token_count     INTEGER,
  metadata        JSONB,
  similarity      FLOAT
)
LANGUAGE SQL STABLE
-- Use security definer to allow service_role to call on behalf of all users
SECURITY DEFINER
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.page_number,
    dc.chunk_index,
    dc.content,
    dc.token_count,
    dc.metadata,
    1 - (dc.embedding <=> p_query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.document_id = p_document_id
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_top_k;
$$;

COMMENT ON FUNCTION search_document_chunks IS
  'Semantic similarity search for RAG — scoped to a single document_id to prevent cross-patient leakage.';

-- ── Chunk count by document ───────────────────────────────────
-- Quick monitoring view showing how many chunks each document has.
CREATE OR REPLACE VIEW document_chunk_stats AS
  SELECT
    document_id,
    COUNT(*)           AS chunk_count,
    MIN(page_number)   AS first_page,
    MAX(page_number)   AS last_page,
    SUM(token_count)   AS total_tokens,
    MIN(created_at)    AS indexed_at
  FROM document_chunks
  GROUP BY document_id;

COMMENT ON VIEW document_chunk_stats IS
  'Per-document RAG indexing stats — for monitoring dashboards.';

-- ── Storage usage view ────────────────────────────────────────
CREATE OR REPLACE VIEW storage_usage AS
  SELECT
    bucket_id,
    COUNT(*)                           AS object_count,
    SUM(metadata->>'size')::BIGINT     AS total_bytes,
    pg_size_pretty(
      SUM(metadata->>'size')::BIGINT
    )                                  AS total_size_human
  FROM storage.objects
  GROUP BY bucket_id;

COMMENT ON VIEW storage_usage IS
  'Aggregate storage usage per bucket — for monitoring dashboards.';
