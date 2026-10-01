"use client";

import React, { useState } from "react";
import { ThumbsDown, X, Send, CheckCircle2, MessageSquare } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, comment: string) => Promise<void>;
  isDarkMode?: boolean;
}

const PRESET_REASONS = [
  "Hướng dẫn sai các bước thao tác trên K12Online",
  "Đường dẫn bài viết gốc không khớp nội dung",
  "Thiếu thông tin quan trọng cần thiết",
  "Nội dung quá chung chung hoặc khó hiểu",
  "Khác",
];

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  isDarkMode = true,
}: FeedbackModalProps) {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(selectedReason, comment);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1000);
    } catch (e) {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className={`relative w-full max-w-sm rounded-2xl p-5 shadow-2xl transition border ${
          isDarkMode
            ? "bg-[#1e1f20] border-[#2d2f31] text-white"
            : "bg-white border-[#e3e3e3] text-[#1f1f1f]"
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-3.5 right-3.5 p-1 rounded-full transition ${
            isDarkMode
              ? "hover:bg-[#282a2c] text-slate-400 hover:text-white"
              : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <ThumbsDown className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Góp ý câu trả lời</h4>
            <p className="text-[11px] text-slate-400">
              Giúp đội ngũ nâng cao độ chính xác của Trợ lý AI
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-emerald-400">
              Cảm ơn thầy/cô đã gửi góp ý!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Vấn đề gặp phải:
              </label>
              <div className="space-y-1.5">
                {PRESET_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition ${
                      selectedReason === r
                        ? isDarkMode
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-300 font-medium"
                          : "bg-rose-50 border-rose-200 text-rose-700 font-medium"
                        : isDarkMode
                        ? "bg-[#131314] border-[#2d2f31] text-slate-300 hover:bg-[#282a2c]"
                        : "bg-slate-50 border-[#e3e3e3] text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={selectedReason === r}
                      onChange={() => setSelectedReason(r)}
                      className="text-rose-500 focus:ring-rose-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Chi tiết bổ sung (không bắt buộc):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ví dụ: Ở bước 2 nút này đã đổi tên thành..."
                rows={2}
                className={`w-full p-2 rounded-xl text-xs border transition focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isDarkMode
                    ? "bg-[#131314] border-[#2d2f31] text-white placeholder-slate-500"
                    : "bg-white border-[#e3e3e3] text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              {submitting ? (
                <span>Đang gửi...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Phản Hồi</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
