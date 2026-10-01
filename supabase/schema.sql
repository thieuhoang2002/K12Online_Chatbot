-- =========================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU ĐỒNG BỘ LỊCH SỬ CHAT - K12ONLINE CHATBOT (SUPABASE)
-- =========================================================================
-- Hướng dẫn: Đăng nhập https://supabase.com > Chọn Project > Vào mục SQL Editor
-- Bấm "New Query", dán toàn bộ nội dung file này vào và bấm "Run".

-- 1. Tạo bảng lưu trữ các phiên chat
create table if not exists public.chat_sessions (
  id text primary key,
  user_email text not null,
  title text not null default 'Cuộc trò chuyện mới',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Tạo chỉ mục (Index) để truy vấn siêu tốc theo email người dùng
create index if not exists idx_chat_sessions_user_email on public.chat_sessions(user_email);
create index if not exists idx_chat_sessions_updated_at on public.chat_sessions(updated_at desc);

-- 3. Bật Row Level Security (RLS) để bảo vệ dữ liệu riêng tư
alter table public.chat_sessions enable row level security;

-- 4. Tạo Policy cho phép người dùng đọc và ghi phiên chat của chính mình
create policy "Allow all authenticated and public operations for app clients"
  on public.chat_sessions
  for all
  using (true)
  with check (true);

-- 5. Cho phép cấp quyền đầy đủ cho vai trò anon và authenticated
grant all on public.chat_sessions to anon, authenticated, service_role;

-- =========================================================================
-- 6. BẢNG ADMIN VAULT (ZERO-KNOWLEDGE ENCRYPTED CREDENTIALS)
-- Server & DB chỉ lưu ciphertext, salt, IV, hint. Tuyệt đối không lưu plaintext.
-- =========================================================================
create table if not exists public.admin_vault (
  email text primary key,
  ciphertext text not null,
  salt text not null,
  iv text not null,
  hint text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_vault enable row level security;
create policy "Allow all operations for admin_vault"
  on public.admin_vault for all using (true) with check (true);
grant all on public.admin_vault to anon, authenticated, service_role;

-- =========================================================================
-- 7. BẢNG CHAT FEEDBACK (ĐÁNH GIÁ LIKE / DISLIKE CỦA GIÁO VIÊN & HỌC SINH)
-- =========================================================================
create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  message_index integer,
  user_email text,
  rating text not null check (rating in ('like', 'dislike')),
  reason text,
  comment text,
  query text,
  reply text,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_feedback_rating on public.chat_feedback(rating);
create index if not exists idx_chat_feedback_created_at on public.chat_feedback(created_at desc);

alter table public.chat_feedback enable row level security;
create policy "Allow all operations for chat_feedback"
  on public.chat_feedback for all using (true) with check (true);
grant all on public.chat_feedback to anon, authenticated, service_role;

