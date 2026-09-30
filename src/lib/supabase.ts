import { createClient } from "@supabase/supabase-js";

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
// Tự động chuẩn hóa URL nếu người dùng lỡ copy link Data API có đuôi /rest/v1
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
