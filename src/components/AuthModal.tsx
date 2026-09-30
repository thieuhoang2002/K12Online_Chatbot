"use client";

import React, { useState } from "react";
import { LogIn, X, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userEmail: string) => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    if (!isSupabaseConfigured || !supabase) {
      // Chế độ Demo khi chưa cấu hình Supabase Key
      setIsSuccess(true);
      setMessage(`Đã đăng nhập chế độ Demo với email: ${email}`);
      setTimeout(() => {
        onLoginSuccess(email);
        onClose();
      }, 1000);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      setMessage("Liên kết đăng nhập bảo mật đã được gửi tới hộp thư của bạn. Vui lòng kiểm tra email!");
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.message || "Đã xảy ra lỗi đăng nhập.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured || !supabase) {
      onLoginSuccess("giaovien@moet.edu.vn");
      onClose();
      return;
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Đăng Nhập Tài Khoản</h3>
            <p className="text-xs text-slate-400">Lưu lại toàn bộ lịch sử hỏi đáp vĩnh viễn</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Tiếp tục với Google (Email ngành)
          </button>

          <div className="flex items-center my-3">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="px-3 text-xs text-slate-500 font-medium uppercase">Hoặc dùng Email</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Địa chỉ Email của bạn:
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com..."
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              {loading ? "Đang gửi liên kết..." : "Nhận link đăng nhập qua Email (Không cần mật khẩu)"}
            </button>
          </form>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                isSuccess
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
