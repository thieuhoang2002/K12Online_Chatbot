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
