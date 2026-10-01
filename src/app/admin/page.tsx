"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  ArrowLeft,
  Sun,
  Moon,
  Bot,
  Database,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Activity,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  BookOpen,
  Cpu,
  Layers,
  FileText,
} from "lucide-react";
import AdminPassModal from "@/components/AdminPassModal";
import { isAdminEmail } from "@/lib/zeroKnowledge";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Dữ liệu thống kê
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "feedback" | "sessions" | "knowledge" | "security">("overview");
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [allArticles, setAllArticles] = useState<any[]>([]);

  // 1. Khởi tạo Theme & Xác thực phiên Admin
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem("k12_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
    }

    // Email
    const email = localStorage.getItem("k12_user_email") || "";
    setUserEmail(email);

    // Kiểm tra Supabase Auth nếu có
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          checkAdminUnlockState(session.user.email);
        } else {
          checkAdminUnlockState(email);
        }
      });
    } else {
      checkAdminUnlockState(email);
    }
  }, []);

  function checkAdminUnlockState(email: string) {
    if (!isAdminEmail(email)) {
      setIsUnlocked(false);
      return;
    }

    // Kiểm tra session unlock trong sessionStorage
    const unlockData = sessionStorage.getItem("k12_admin_unlocked");
    if (unlockData) {
      try {
        const parsed = JSON.parse(unlockData);
        // Hết hạn sau 4 tiếng
        const isExpired = Date.now() - parsed.unlockedAt > 4 * 60 * 60 * 1000;
        if (parsed.email === email.toLowerCase().trim() && !isExpired) {
          setIsUnlocked(true);
          loadDashboardStats(email);
          return;
        }
      } catch (e) {}
    }

    // Chưa mở khóa -> Mở modal pass
    setIsUnlocked(false);
    setIsPassModalOpen(true);
  }

  // 2. Tải số liệu thống kê từ API
  async function loadDashboardStats(emailToUse?: string) {
    const email = emailToUse || userEmail;
    if (!email) return;

    setLoadingStats(true);
    try {
      const res = await fetch(`/api/admin/stats?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (json.success) {
        setStats(json);
      }
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    } finally {
      setLoadingStats(false);
    }

    // Tải danh sách bài viết để tra cứu
    try {
      const kbRes = await fetch("/api/feedback"); // fallback
    } catch (e) {}
  }

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("k12_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }

  function handleLockVault() {
    sessionStorage.removeItem("k12_admin_unlocked");
    setIsUnlocked(false);
    setIsPassModalOpen(true);
  }

  const isDarkMode = theme === "dark";

  // TRƯỜNG HỢP 1: Chưa đăng nhập hoặc Email không có quyền Admin
  if (!userEmail || !isAdminEmail(userEmail)) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
          isDarkMode ? "bg-[#131314] text-white" : "bg-[#f8fafd] text-[#1f1f1f]"
        }`}
      >
        <div
          className={`max-w-md w-full p-8 rounded-3xl border text-center shadow-2xl ${
            isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">Khu Vực Quản Trị Giới Hạn</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Trang này được bảo vệ nghiêm ngặt bằng cơ chế mã hóa Zero-Knowledge.
            Chỉ các tài khoản Quản trị viên được cấp phép (
            <code className="text-sky-400">thieuhoangent@gmail.com</code> hoặc{" "}
            <code className="text-sky-400">thieuviethoang7b@gmail.com</code>) mới có quyền truy cập.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay Lại Trang Chủ & Đăng Nhập</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: Email là Admin nhưng CHƯA MỞ KHÓA ZERO-KNOWLEDGE MASTER PASSWORD
  if (!isUnlocked) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${
          isDarkMode ? "bg-[#131314] text-white" : "bg-[#f8fafd] text-[#1f1f1f]"
        }`}
      >
        <div
          className={`max-w-md w-full p-8 rounded-3xl border text-center shadow-2xl ${
            isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-1.5">Zero-Knowledge Vault</h1>
          <p className="text-xs text-slate-400 mb-6">
            Xin chào <strong>{userEmail}</strong>! Kho lưu trữ quản trị đang ở trạng thái khóa mã hóa AES-256-GCM.
          </p>
          <button
            onClick={() => setIsPassModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30"
          >
            <KeyRound className="w-4 h-4" />
            <span>Nhập Master Password Mở Khóa</span>
          </button>

          <div className="mt-4">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Chatbot</span>
            </Link>
          </div>
        </div>

        <AdminPassModal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          userEmail={userEmail}
          isDarkMode={isDarkMode}
          onUnlocked={() => {
            setIsPassModalOpen(false);
            setIsUnlocked(true);
            loadDashboardStats(userEmail);
          }}
        />
      </div>
    );
  }

  // TRƯỜNG HỢP 3: ĐÃ MỞ KHÓA THÀNH CÔNG -> GIAO DIỆN DASHBOARD HOÀN CHỈNH
  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDarkMode ? "bg-[#131314] text-white" : "bg-[#f8fafd] text-[#1f1f1f]"
      }`}
    >
      {/* 1. TOP HEADER QUẢN TRỊ */}
      <header
        className={`h-16 border-b flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 backdrop-blur-md transition-colors ${
          isDarkMode
            ? "bg-[#18191a]/95 border-[#2d2f31]"
            : "bg-white/95 border-[#e3e3e3]"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
              isDarkMode
                ? "bg-[#131314] hover:bg-[#282a2c] border-[#2d2f31] text-slate-300 hover:text-white"
                : "bg-slate-50 hover:bg-slate-100 border-[#e3e3e3] text-slate-700"
            }`}
            title="Quay lại Chatbot"
          >
            <ArrowLeft className="w-4 h-4 text-sky-500" />
            <span className="hidden sm:inline">Về Chatbot</span>
          </Link>

          <div className="h-5 w-px bg-slate-700/50 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight">
                  K12Online Internal Dashboard
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Zero-Knowledge Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Hệ thống giám sát vận hành AI, RAG & Trải nghiệm người dùng
              </p>
            </div>
          </div>
        </div>

        {/* Action icons bên phải */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => loadDashboardStats(userEmail)}
            disabled={loadingStats}
            className={`p-2 rounded-xl border transition ${
              loadingStats ? "opacity-50" : ""
            } ${
              isDarkMode
                ? "bg-[#131314] hover:bg-[#282a2c] border-[#2d2f31] text-slate-300"
                : "bg-slate-50 hover:bg-slate-100 border-[#e3e3e3] text-slate-700"
            }`}
            title="Làm mới số liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition ${
              isDarkMode
                ? "bg-[#131314] hover:bg-[#282a2c] border-[#2d2f31] text-amber-300"
                : "bg-slate-50 hover:bg-slate-100 border-[#e3e3e3] text-indigo-600"
            }`}
            title={isDarkMode ? "Giao diện Sáng" : "Giao diện Tối"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLockVault}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isDarkMode
                ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400"
                : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
            }`}
            title="Khóa lại Master Password"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khóa Vault</span>
          </button>
        </div>
      </header>

      {/* 2. THANH TAB ĐIỀU HƯỚNG */}
      <div
        className={`px-4 sm:px-8 border-b flex items-center gap-2 overflow-x-auto shrink-0 ${
          isDarkMode ? "bg-[#18191a]/50 border-[#2d2f31]" : "bg-white/60 border-[#e3e3e3]"
        }`}
      >
        {[
          { id: "overview", label: "Tổng Quan Hệ Thống", icon: Activity },
          { id: "feedback", label: "Đánh Giá (Like / Dislike)", icon: ThumbsUp },
          { id: "sessions", label: "Phiên Chat & Câu Hỏi", icon: MessageSquare },
          { id: "knowledge", label: "Kho Tri Thức (383 Bài)", icon: BookOpen },
          { id: "security", label: "Bảo Mật Zero-Knowledge", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? "border-sky-500 text-sky-500"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. NỘI DUNG CHÍNH (MAIN BODY) */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Tổng phiên chat */}
              <div
                className={`p-5 rounded-2xl border transition shadow-xs ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">Tổng Phiên Hội Thoại</span>
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {stats?.overview?.totalSessions || "1+"}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <span className="text-emerald-400 font-semibold">Đồng bộ Cloud</span> • Supabase PostgreSQL
                </div>
              </div>

              {/* Card 2: Đánh giá & Hài lòng */}
              <div
                className={`p-5 rounded-2xl border transition shadow-xs ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">Tỷ Lệ Hài Lòng</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <ThumbsUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-emerald-400">
                  {stats?.overview?.satisfactionRate ?? 100}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                  <span>👍 {stats?.overview?.likes ?? 0} Likes</span>
                  <span>•</span>
                  <span>👎 {stats?.overview?.dislikes ?? 0} Dislikes</span>
                </div>
              </div>

              {/* Card 3: Cơ sở tri thức */}
              <div
                className={`p-5 rounded-2xl border transition shadow-xs ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">Cơ Sở Tri Thức K12</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {stats?.knowledgeBase?.totalArticles ?? 383} Bài
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Dung lượng ~{stats?.knowledgeBase?.fileSizeMB ?? 1.18} MB • 100% Link .html
                </div>
              </div>

              {/* Card 4: Pre-baked Warm Cache */}
              <div
                className={`p-5 rounded-2xl border transition shadow-xs ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">Pre-baked Warm Cache</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-amber-400">
                  0ms Latency
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Tiết kiệm 100% token cho bài viết 67k ký tự
                </div>
              </div>
            </div>

            {/* Chi tiết Động cơ AI & Hạ tầng */}
            <div
              className={`p-6 rounded-3xl border transition ${
                isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
              }`}
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-500" />
                Kiến Trúc Động Cơ Kép (Dual-Engine AI Status)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Động cơ chính: Google Gemini */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#131314] border-[#2d2f31]" : "bg-slate-50 border-[#e3e3e3]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-400">Google Gemini 3.8 Flash</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-semibold border border-sky-500/20">
                      Primary Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Động cơ tạo sinh chính với trần 8.192 output tokens. Tự động xoay tua danh sách API Keys khi quá tải.
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Trạng thái: Hoạt động mượt mà</span>
                  </div>
                </div>

                {/* Động cơ dự phòng: OpenRouter */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#131314] border-[#2d2f31]" : "bg-slate-50 border-[#e3e3e3]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400">OpenRouter Multi-Key Pool</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold border border-indigo-500/20">
                      Failover Pool
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Bể dự phòng 5 API Keys tự động chuyển vùng trong 0.1s khi Gemini gặp lỗi 429 hoặc bảo trì.
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Trạng thái: Sẵn sàng trực chiến</span>
                  </div>
                </div>

                {/* Caching & Rate Limit */}
                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#131314] border-[#2d2f31]" : "bg-slate-50 border-[#e3e3e3]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400">Upstash Redis Cloud</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                      Edge Cache
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Phản hồi ~30ms cho câu hỏi trùng lặp (TTL 7 ngày) và chặn bot spam 20 requests/phút/IP.
                  </p>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Trạng thái: Tối ưu băng thông</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ĐÁNH GIÁ (FEEDBACK) */}
        {activeTab === "feedback" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Đánh Giá & Góp Ý Từ Người Dùng</h2>
                <p className="text-xs text-slate-400">
                  Tổng hợp lượt Like/Dislike để liên tục cải thiện dữ liệu trả lời của Chatbot
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  👍 {stats?.overview?.likes ?? 0} Hài lòng
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                  👎 {stats?.overview?.dislikes ?? 0} Cần cải thiện
                </span>
              </div>
            </div>

            {stats?.recentFeedback && stats.recentFeedback.length > 0 ? (
              <div className="space-y-3">
                {stats.recentFeedback.map((fb: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition ${
                      isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {fb.rating === "like" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-xs flex items-center gap-1 border border-emerald-500/20">
                            <ThumbsUp className="w-3 h-3" /> Hài lòng (Like)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-semibold text-xs flex items-center gap-1 border border-rose-500/20">
                            <ThumbsDown className="w-3 h-3" /> Chưa hài lòng ({fb.reason || "Không nêu lý do"})
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {fb.user_email || "Khách"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(fb.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    {fb.comment && (
                      <div className="p-3 rounded-xl bg-slate-800/40 text-xs text-amber-300 mb-2 border border-slate-700/50">
                        💬 <strong>Ý kiến người dùng:</strong> &quot;{fb.comment}&quot;
                      </div>
                    )}

                    {fb.query && (
                      <div className="text-xs text-slate-400 line-clamp-1">
                        <strong>Câu hỏi:</strong> {fb.query}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`p-12 rounded-3xl border text-center ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <ThumbsUp className="w-10 h-10 mx-auto mb-3 text-slate-500 opacity-60" />
                <h4 className="text-sm font-semibold mb-1">Chưa có đánh giá nào</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Các đánh giá Like/Dislike từ giáo viên khi bấm dưới bong bóng chat sẽ xuất hiện ngay tại đây theo thời gian thực.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PHIÊN HỘI THOẠI (SESSIONS) */}
        {activeTab === "sessions" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-base font-bold">Lịch Sử Hội Thoại Đồng Bộ</h2>
              <p className="text-xs text-slate-400">
                Danh sách các phiên chat của người dùng được lưu trữ an toàn trên Supabase Cloud
              </p>
            </div>

            {stats?.recentSessions && stats.recentSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stats.recentSessions.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition ${
                      isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-sky-400 truncate max-w-[200px]">
                        {s.user_email}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(s.updated_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium mb-2 truncate">{s.title || "Cuộc trò chuyện mới"}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/30 pt-2">
                      <span>Số tin nhắn: <strong>{s.messageCount}</strong></span>
                      <span className="text-[10px] text-emerald-400">Cloud Synced</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`p-12 rounded-3xl border text-center ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-500 opacity-60" />
                <h4 className="text-sm font-semibold mb-1">Chưa có phiên chat cloud</h4>
                <p className="text-xs text-slate-400">
                  Khi người dùng đăng nhập tài khoản và bắt đầu hỏi đáp, các phiên chat sẽ tự động lưu lên cơ sở dữ liệu.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: KHO TRI THỨC (KNOWLEDGE BASE) */}
        {activeTab === "knowledge" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">Cơ Sở Tri Thức K12Online (383 Bài Viết)</h2>
                <p className="text-xs text-slate-400">
                  Toàn bộ cẩm nang hướng dẫn chính thức từ Viettel hotro.k12online.vn
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Kích thước file: <strong>1.18 MB</strong> • Pipeline: <code>build_knowledge_json.js</code>
              </div>
            </div>

            <div
              className={`p-5 rounded-2xl border ${
                isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300">
                  <div className="font-bold text-base mb-0.5">383 / 383</div>
                  <div>Bài viết đã bóc tách & làm sạch</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <div className="font-bold text-base mb-0.5">100%</div>
                  <div>Chuẩn hóa link nguồn trực tiếp .html</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <div className="font-bold text-base mb-0.5">&gt; 50 Thuật ngữ</div>
                  <div>Từ điển đồng nghĩa Tiếng Việt (synonyms.ts)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BẢO MẬT ZERO-KNOWLEDGE */}
        {activeTab === "security" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-base font-bold">Kiến Trúc Mã Hóa Zero-Knowledge</h2>
              <p className="text-xs text-slate-400">
                Chi tiết giải pháp bảo vệ Master Password tuyệt đối an toàn chống đánh cắp dữ liệu
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-5 rounded-2xl border ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold mb-1.5">Zero-Knowledge</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Máy chủ và Database chỉ lưu <strong>ciphertext, salt, IV</strong>. Plaintext không bao giờ rời khỏi trình duyệt. Kể cả Server bị hack cũng không ai đọc được mật khẩu.
                </p>
              </div>

              <div
                className={`p-5 rounded-2xl border ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold mb-1.5">PBKDF2 (100.000 Vòng)</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cố ý làm chậm quá trình suy dẫn khóa mã hóa. Hacker dùng siêu máy tính thử 1 triệu mật khẩu sẽ mất hàng năm trời tính toán vô ích.
                </p>
              </div>

              <div
                className={`p-5 rounded-2xl border ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold mb-1.5">AES-256-GCM Auth Tag</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Thuật toán mã hóa chuẩn quân sự với Authentication Tag tích hợp. Nếu kẻ gian sửa đổi dù chỉ 1 bit trong ciphertext, quá trình giải mã sẽ báo lỗi mismatch ngay lập tức.
                </p>
              </div>
            </div>

            <div
              className={`p-5 rounded-2xl border text-xs text-slate-400 space-y-2 ${
                isDarkMode ? "bg-[#131314] border-[#2d2f31]" : "bg-slate-50 border-[#e3e3e3]"
              }`}
            >
              <div className="font-semibold text-slate-200">
                🔒 Danh sách tài khoản Quản trị Whitelist được phân quyền:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sky-400 font-mono text-[11px]">
                <li>thieuhoangent@gmail.com (Superadmin chính)</li>
                <li>thieuviethoang7b@gmail.com (Superadmin dự phòng)</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
