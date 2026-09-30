-- =========================================================================
-- TÌM KIẾM NGỮ NGHĨA SÂU BẰNG VECTOR (PGVECTOR TRÊN SUPABASE) - K12ONLINE
-- =========================================================================
-- Hướng dẫn: Đăng nhập https://supabase.com > Chọn Project > Vào SQL Editor
-- Bấm "New Query", dán nội dung này vào và bấm "Run".

-- 1. Kích hoạt tiện ích mở rộng vector (pgvector)
create extension if not exists vector;

-- 2. Tạo bảng lưu trữ vector embedding của các bài viết nghiệp vụ
create table if not exists public.knowledge_embeddings (
  id bigserial primary key,
  title text not null,
  category text not null,
  source_url text not null,
  content text not null,
  embedding vector(1536), -- Vector 1536 chiều chuẩn cho text-embedding
  created_at timestamptz not null default now()
);

-- 3. Tạo chỉ mục tìm kiếm vector siêu tốc
create index if not exists idx_knowledge_embeddings_vector 
  on public.knowledge_embeddings 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- 4. Tạo hàm RPC tìm kiếm theo độ tương đồng Cosine (Cosine Similarity)
create or replace function match_k12_documents (
  query_embedding vector(1536),
  match_threshold float default 0.60,
  match_count int default 3
)
returns table (
  id bigint,
  title text,
  category text,
  source_url text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_embeddings.id,
    knowledge_embeddings.title,
    knowledge_embeddings.category,
    knowledge_embeddings.source_url,
    knowledge_embeddings.content,
    1 - (knowledge_embeddings.embedding <=> query_embedding) as similarity
  from knowledge_embeddings
  where 1 - (knowledge_embeddings.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- 5. Cấp quyền truy cập cho client
grant all on public.knowledge_embeddings to anon, authenticated, service_role;
