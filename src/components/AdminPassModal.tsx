"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  createAdminVault,
  verifyAdminPassword,
  AdminVaultRecord,
} from "@/lib/zeroKnowledge";

interface AdminPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onUnlocked: () => void;
  isDarkMode?: boolean;
}

export default function AdminPassModal({
  isOpen,
  onClose,
  userEmail,
  onUnlocked,
  isDarkMode = true,
}: AdminPassModalProps) {
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [existingVault, setExistingVault] = useState<AdminVaultRecord | null>(null);

  // Form fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hint, setHint] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Kiểm tra vault đã tồn tại chưa khi modal mở
  useEffect(() => {
    if (!isOpen || !userEmail) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword("");
    setConfirmPassword("");
    setLoading(true);

    const checkVault = async () => {
      try {
        // 1. Kiểm tra localStorage trước
        const localData = localStorage.getItem(`k12_vault_${userEmail.toLowerCase().trim()}`);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            if (parsed.ciphertext && parsed.salt && parsed.iv) {
              setExistingVault(parsed);
              setIsFirstTime(false);
              setHint(parsed.hint || "");
              setLoading(false);
              return;
            }
          } catch (e) {}
        }

        // 2. Gọi API tra cứu từ server / Supabase
        const res = await fetch(`/api/admin/vault?email=${encodeURIComponent(userEmail)}`);
        const json = await res.json();

        if (json.success && json.vault) {
          setExistingVault(json.vault);
          setIsFirstTime(false);
          setHint(json.vault.hint || "");
          localStorage.setItem(
            `k12_vault_${userEmail.toLowerCase().trim()}`,
            JSON.stringify(json.vault)
          );
        } else {
          // Chưa có vault -> Lần đầu thiết lập
          setExistingVault(null);
          setIsFirstTime(true);
        }
      } catch (err) {
        // Mặc định coi là lần đầu nếu chưa có gì
        setIsFirstTime(true);
      } finally {
        setLoading(false);
      }
    };

    checkVault();
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  // Xử lý tạo Master Password lần đầu (Zero-Knowledge)
  async function handleCreateVault(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Mật khẩu Master phải có độ dài tối thiểu 6 ký tự!");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    try {
      // 1. Tạo Vault mã hóa AES-256-GCM + PBKDF2 100.000 vòng lặp hoàn toàn trên Client
      const vaultRecord = await createAdminVault(userEmail, password, hint);

      // 2. Lưu vào localStorage
      localStorage.setItem(
        `k12_vault_${userEmail.toLowerCase().trim()}`,
        JSON.stringify(vaultRecord)
      );

      // 3. Đồng bộ lên Server/Supabase
      await fetch("/api/admin/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vaultRecord),
      });

      // 4. Lưu session unlock tạm thời
      sessionStorage.setItem(
        "k12_admin_unlocked",
        JSON.stringify({
          email: userEmail.toLowerCase().trim(),
          unlockedAt: Date.now(),
        })
      );

      setSuccessMessage("Khởi tạo Zero-Knowledge Vault thành công!");
      setTimeout(() => {
        onUnlocked();
      }, 700);
    } catch (err: any) {
      setErrorMessage("Lỗi khi khởi tạo Vault: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Xử lý mở khóa Master Password (Zero-Knowledge Decrypt)
  async function handleUnlockVault(e: React.FormEvent) {
    e.preventDefault();
    if (!existingVault) return;
    setErrorMessage(null);

    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu Master!");
      return;
    }

    setLoading(true);
    try {
      // Xác thực bằng cách giải mã AES-256-GCM với PBKDF2
      const result = await verifyAdminPassword(password, existingVault);

      if (result.success) {
        setSuccessMessage("Mở khóa thành công! Đang chuyển hướng...");
        sessionStorage.setItem(
          "k12_admin_unlocked",
          JSON.stringify({
            email: userEmail.toLowerCase().trim(),
            unlockedAt: Date.now(),
          })
        );
        setTimeout(() => {
          onUnlocked();
        }, 600);
      } else {
        setErrorMessage(
          result.error || "Mật khẩu không chính xác! (Authentication Tag mismatch)"
        );
      }
    } catch (err: any) {
      setErrorMessage("Lỗi xác thực: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl transition border ${
          isDarkMode
            ? "bg-[#18191a] border-[#2d2f31] text-white"
            : "bg-white border-[#e3e3e3] text-[#1f1f1f]"
        }`}
      >
        {/* Nút Đóng */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-full transition ${
            isDarkMode
              ? "hover:bg-[#282a2c] text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          }`}
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold tracking-tight">
              {isFirstTime ? "Thiết Lập Khóa Quản Trị" : "Xác Thực Quản Trị Viên"}
            </h3>
            <p className="text-xs text-slate-400">
              Cơ chế Zero-Knowledge • AES-256-GCM • PBKDF2
            </p>
          </div>
        </div>

        {/* Thông tin tài khoản */}
        <div
          className={`p-3 rounded-xl mb-4 text-xs flex items-center justify-between border ${
            isDarkMode
              ? "bg-[#131314] border-[#2d2f31] text-slate-300"
              : "bg-slate-50 border-[#e3e3e3] text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <KeyRound className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="truncate font-medium">{userEmail}</span>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-[10px] border border-emerald-500/20">
            Admin Whitelisted
          </span>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <div>{successMessage}</div>
          </div>
        )}

        {/* FORM THIẾT LẬP LẦN ĐẦU (FIRST TIME) */}
        {isFirstTime ? (
          <form onSubmit={handleCreateVault} className="space-y-3.5">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs leading-relaxed">
              <span className="font-semibold block mb-1">
                🔒 Lần đầu đăng nhập quyền Admin:
              </span>
              Vui lòng thiết lập <strong>Master Password</strong> và <strong>Gợi ý (Hint)</strong>.
              Mật khẩu này được xử lý 100% tại trình duyệt bằng 100.000 vòng lặp PBKDF2. Server không lưu mật khẩu của bạn.
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-slate-400">
                Tạo Master Password (Tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu an toàn..."
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDarkMode
                      ? "bg-[#131314] border-[#2d2f31] text-white placeholder-slate-500"
                      : "bg-white border-[#e3e3e3] text-slate-900 placeholder-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-slate-400">
                Xác nhận lại Master Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
                required
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? "bg-[#131314] border-[#2d2f31] text-white placeholder-slate-500"
                    : "bg-white border-[#e3e3e3] text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-slate-400 flex items-center justify-between">
                <span>Gợi ý mật khẩu (Hint phòng khi quên)</span>
                <span className="text-[10px] text-slate-500">Khuyên dùng</span>
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Ví dụ: Tên trường đại học, biển số xe..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                  isDarkMode
                    ? "bg-[#131314] border-[#2d2f31] text-white placeholder-slate-500"
                    : "bg-white border-[#e3e3e3] text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition text-white shadow-lg shadow-sky-600/30 ${
                loading
                  ? "bg-sky-600/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang mã hóa PBKDF2 (100k rounds)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Lưu Vault & Vào Bảng Điều Khiển</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORM NHẬP MẬT KHẨU MỞ KHÓA (EXISTING VAULT) */
          <form onSubmit={handleUnlockVault} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-400">
                Nhập Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu Master..."
                  autoFocus
                  required
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border transition focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                    isDarkMode
                      ? "bg-[#131314] border-[#2d2f31] text-white placeholder-slate-500"
                      : "bg-white border-[#e3e3e3] text-slate-900 placeholder-slate-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hiển thị Hint nếu có */}
            {hint && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                  isDarkMode
                    ? "bg-[#131314]/80 border-[#2d2f31] text-slate-400"
                    : "bg-slate-50 border-[#e3e3e3] text-slate-600"
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Gợi ý (Hint):</strong> {hint}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition text-white shadow-lg shadow-sky-600/30 ${
                loading
                  ? "bg-sky-600/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang giải mã AES-256-GCM...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Mở Khóa Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Zero-Knowledge Explanation */}
        <div className="mt-5 pt-3 border-t border-slate-700/40 text-[11px] text-slate-500 text-center">
          Mật khẩu được tính toán cục bộ qua PBKDF2 (100.000 vòng) và mã hóa AES-256-GCM. Không dữ liệu thô nào được lưu trên máy chủ.
        </div>
      </div>
    </div>
  );
}
