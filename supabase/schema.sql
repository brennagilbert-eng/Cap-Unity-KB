-- ============================================================
--  Unity knowledge base schema
--  Run this once in your Supabase SQL editor
-- ============================================================

-- Enable pgvector extension
create extension if not exists vector;

-- Documents table
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  source      text not null,          -- 'confluence' | 'jira' | 'slack' | 'drive'
  source_id   text not null unique,   -- deterministic ID for upserts
  title       text not null,
  content     text not null,
  url         text not null,
  author      text,
  embedding   vector(1536),           -- text-embedding-3-small
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- IVFFlat index for fast cosine similarity search
create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index on source for filtered queries
create index if not exists documents_source_idx on documents (source);

-- ── Semantic search function ──────────────────────────────
create or replace function match_documents(
  query_embedding vector(1536),
  match_count     int      default 6,
  filter_sources  text[]   default null
)
returns table (
  id          uuid,
  source      text,
  source_id   text,
  title       text,
  content     text,
  url         text,
  author      text,
  similarity  float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.source,
    d.source_id,
    d.title,
    d.content,
    d.url,
    d.author,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where
    (filter_sources is null or d.source = any(filter_sources))
    and d.embedding is not null
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
