-- ============================================================
-- Recovery Compass — Supabase Migration 001
-- pgvector extension + document_chunks vector table + RLS
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor
-- Or via: supabase db push (if using Supabase CLI)
-- ============================================================

-- ── Step 1: Enable pgvector extension ────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Step 2: Create document_chunks table ─────────────────────
-- Stores RAG embeddings for semantic retrieval.
-- Scoped by document_id — cross-patient retrieval is IMPOSSIBLE by schema.
CREATE TABLE IF NOT EXISTS document_chunks (
  id              TEXT        PRIMARY KEY,
  document_id     TEXT        NOT NULL,
  page_number     INTEGER     NOT NULL DEFAULT 1,
  chunk_index     INTEGER     NOT NULL DEFAULT 0,
  content         TEXT        NOT NULL,
  token_count     INTEGER     NOT NULL DEFAULT 0,
  -- 768-dimensional vector for Gemini text-embedding-004
  -- Change to 1536 if using OpenAI text-embedding-3-small
  embedding       VECTOR(768) NOT NULL,
  metadata        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Step 3: Index for fast ANN vector search ──────────────────
-- HNSW index is faster at query time than IVFFlat but uses more memory.
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Covering index for fast document-scoped retrieval
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
  ON document_chunks (document_id);

-- ── Step 4: Enable Row Level Security ────────────────────────
-- Note: document_chunks is accessed ONLY by the backend service role
-- (which bypasses RLS). Enabling RLS here prevents any accidental
-- direct browser access via the anon key.
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Deny ALL direct access from browser (anon / authenticated roles).
-- The backend uses service_role which bypasses RLS by design.
CREATE POLICY "deny_direct_browser_access_to_chunks"
  ON document_chunks
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false);

-- ── Step 5: Storage bucket setup ─────────────────────────────
-- Creates the private discharge-documents bucket if it doesn't exist.
-- This is idempotent.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'discharge-documents',
  'discharge-documents',
  false,           -- NEVER public
  20971520,        -- 20 MB limit (matches MAX_FILE_SIZE_MB)
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Deny direct browser upload/download (all go through backend signed URLs)
CREATE POLICY "deny_direct_browser_storage_upload"
  ON storage.objects
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  USING (bucket_id = 'discharge-documents' AND false);

CREATE POLICY "deny_direct_browser_storage_select"
  ON storage.objects
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'discharge-documents' AND false);

-- ── Step 6: Helpful view for chunk search (optional) ─────────
-- Returns chunks without the embedding vector (too large for display)
CREATE OR REPLACE VIEW document_chunks_view AS
  SELECT
    id,
    document_id,
    page_number,
    chunk_index,
    content,
    token_count,
    metadata,
    created_at
  FROM document_chunks;

COMMENT ON VIEW document_chunks_view IS
  'document_chunks without embeddings — for monitoring/debugging only';
