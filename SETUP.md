# Recovery Compass — Complete Setup & Integration Guide

> **Hackathon MVP** — Not for clinical use. All data is synthetic.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React + Vite)                                         │
│  ├── Supabase anon client  → auth session restore + realtime    │
│  └── apiClient (fetch)     → NestJS REST API (JWT)              │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼ HTTP (JWT Bearer)
┌─────────────────────────────────────────────────────────────────┐
│  NestJS Backend (port 3000)                                     │
│  ├── Auth        → bcrypt + JWT (15m access / 7d refresh)       │
│  ├── Storage     → Supabase Storage (private bucket)            │
│  ├── RAG         → Gemini embeddings → pgvector                 │
│  ├── Extraction  → Gemini 1.5 Pro (Zod-validated)               │
│  ├── Safety      → Deterministic red-flag engine (no AI)        │
│  └── Prisma      → Supabase PostgreSQL                          │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼ Direct connection (service role)
┌─────────────────────────────────────────────────────────────────┐
│  Supabase Project                                               │
│  ├── PostgreSQL + pgvector  → document_chunks (RAG store)       │
│  ├── Storage                → discharge-documents (private)     │
│  └── RLS                    → blocks browser direct access      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | bundled with Node |
| Redis | 7+ | `winget install Redis.Redis` |
| Git | any | [git-scm.com](https://git-scm.com) |

---

## Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to your users
3. Note your project's:
   - **Project URL** → `https://[ref].supabase.co`
   - **anon/public key** → Settings → API → anon key
   - **service_role key** → Settings → API → service_role ⚠️ Keep secret!
   - **Database password** → set during project creation

---

## Step 2 — Run Supabase SQL Migrations

In Supabase Dashboard → **SQL Editor**, run these files **in order**:

### Migration 001 — pgvector + RLS
Copy and run: [`backend/supabase/migrations/001_pgvector_and_rls.sql`](./backend/supabase/migrations/001_pgvector_and_rls.sql)

This creates:
- `vector` extension (pgvector)
- `document_chunks` table with HNSW index (768-dim for Gemini)
- RLS policies blocking browser direct access
- `discharge-documents` storage bucket (private, 20MB limit)

### Migration 002 — Functions & Views
Copy and run: [`backend/supabase/migrations/002_functions_and_views.sql`](./backend/supabase/migrations/002_functions_and_views.sql)

This creates:
- `search_document_chunks()` RPC function
- Monitoring views for chunk stats and storage usage

---

## Step 3 — Configure Environment Variables

### Frontend `.env` (root directory)

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_ENV=development

# From Supabase → Settings → API
VITE_SUPABASE_URL=https://[your-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Set true only for hackathon demo (auto-loads demo user)
VITE_DEMO_MODE=true
```

### Backend `backend/.env`

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
# Supabase Transaction Pooler (port 6543) for the app connection
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Direct connection (port 5432) for Prisma migrations
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase
SUPABASE_URL="https://[your-ref].supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_SECRET_KEY="your-service-role-key"      # NEVER expose this
SUPABASE_STORAGE_BUCKET="discharge-documents"

# Google Gemini (get key from https://aistudio.google.com)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-1.5-pro"
LLM_PROVIDER="gemini"
EMBEDDING_PROVIDER="gemini"
EMBEDDING_MODEL="text-embedding-004"

# JWT (generate 32+ char random strings)
JWT_ACCESS_SECRET="your-32-char-access-secret-here!!"
JWT_REFRESH_SECRET="your-32-char-refresh-secret-here!!"

# Redis
REDIS_URL="redis://localhost:6379"

# Storage: use 'supabase' for real uploads, 'local' for dev
STORAGE_PROVIDER="supabase"

# Demo/prototype flags
DEMO_MODE=true
IS_PROTOTYPE=true
```

> **Where to find Supabase database URLs:**
> Supabase Dashboard → Settings → Database → Connection string → Transaction pooler / Direct

---

## Step 4 — Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

---

## Step 5 — Run Prisma Migrations

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Push schema to Supabase (creates all 35+ tables)
# For development — creates migrations automatically:
npm run db:migrate

# Seed demo data (users, red-flag rules, symptom definitions):
npm run db:seed
```

> **Seed accounts** (password: `Password123!`):
> - `admin@recoverycompass.com` — Admin/Clinician
> - `patient@recoverycompass.com` — Patient
> - `caregiver@recoverycompass.com` — Family Caregiver

---

## Step 6 — Start the Application

### Terminal 1 — Redis (Windows)
```bash
redis-server
```

### Terminal 2 — Backend
```bash
cd backend
npm run dev
```

Backend starts at: `http://localhost:3000`
API docs (Swagger): `http://localhost:3000/api/docs`
Health check: `http://localhost:3000/api/v1/health`

### Terminal 3 — Frontend
```bash
# Root directory
npm run dev
```

Frontend starts at: `http://localhost:5173`

---

## Step 7 — Verify Integration

### Health Check
```bash
curl http://localhost:3000/api/v1/health
# → {"status":"ok","timestamp":"...","service":"recovery-compass-api"}

curl http://localhost:3000/api/v1/health/ready
# → {"status":"ready","checks":{"database":{"status":"healthy"}}}

curl http://localhost:3000/api/v1/health/detailed
# → {"status":"healthy","dependencies":{"database":...,"gemini":...}}
```

### API Docs
Visit `http://localhost:3000/api/docs` — full Swagger UI with all endpoints.

---

## Document Processing Pipeline

```
Upload PDF/image
      │
      ▼
[1] Magic-byte validation (blocks spoofed files)
      │
      ▼
[2] Quality analysis (is the image readable?)
      │
      ▼
[3] OCR (Tesseract — extracts raw text)
      │
      ▼
[4] RAG indexing (chunk → Gemini embed → pgvector store)
      │
      ▼
[5] LLM extraction (Gemini 1.5 Pro, Zod-validated)
      │
      ▼
[6] Human verification GATE (clinician must confirm before plan activates)
      │
      ▼
[7] Recovery plan generation
      │
      ▼
[8] Deterministic red-flag monitoring (no AI in safety path)
```

---

## Storage Configuration

| `STORAGE_PROVIDER` | Description | Use when |
|---|---|---|
| `local` | Files saved to disk in `backend/uploads/` | Dev without Supabase |
| `supabase` | Files in private Supabase Storage bucket | Production / Demo |
| `s3` | AWS S3 bucket | Production at scale |

---

## Key Safety Properties (Never Alter)

| Property | Implementation |
|---|---|
| Human verification gate | Plan blocked until clinician confirms extraction |
| No AI in safety path | Red-flag detection is deterministic rules only |
| Mock blocked in production | `LLM_PROVIDER=mock` throws in `NODE_ENV=production` |
| Service role never in browser | `SUPABASE_SECRET_KEY` only in backend |
| RLS on document_chunks | Browser cannot directly query vector store |
| Source traceability | Every extracted field has `sourceText`, `page`, `boundingBox` |
| Audit trail | Every clinical action logged to `AuditLog` table |

---

## Troubleshooting

### "Supabase is not configured"
→ Check `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `backend/.env`.
→ URL must not contain `your-project-ref`.

### "pgvector extension not found"
→ Run Migration 001 in Supabase SQL Editor.
→ The vector store auto-falls-back to in-memory (dev only).

### "GEMINI_API_KEY not configured"
→ Get a key from [aistudio.google.com](https://aistudio.google.com/app/apikey).
→ Set `GEMINI_API_KEY=your-real-key` in `backend/.env`.

### Redis connection refused
→ Start Redis: `redis-server` or install via `winget install Redis.Redis`.

### Prisma migration fails
→ Ensure `DIRECT_URL` (port 5432, not 6543) is set for migrations.

### CORS errors in browser
→ Add frontend URL to `CORS_ORIGINS` in `backend/.env`.

---

## Production Checklist

- [ ] `NODE_ENV=production`
- [ ] `DEMO_MODE=false`
- [ ] `LLM_PROVIDER=gemini` (not `mock`)
- [ ] `STORAGE_PROVIDER=supabase`
- [ ] Real `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (32+ chars)
- [ ] Real `GEMINI_API_KEY`
- [ ] Real `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
- [ ] `FIELD_ENCRYPTION_KEY` (exactly 32 chars)
- [ ] Supabase RLS migrations applied
- [ ] Storage bucket is **private** (not public)
- [ ] `VITE_DEMO_MODE=false` in frontend `.env`
