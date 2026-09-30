"use client";

import React from "react";
import { Coffee, Heart, X, Sparkles } from "lucide-react";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 overflow-hidden bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
              Mời Tác Giả Ly Cà Phê ☕
            </h3>
            <p className="text-xs text-slate-400">Chung tay duy trì máy chủ cộng đồng 0đ</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Dự án <strong className="text-sky-400">Trợ Lý K12Online</strong> được phát triển hoàn toàn vì cộng đồng giáo dục, phi lợi nhuận nhằm hỗ trợ Thầy/Cô và Cán bộ IT tra cứu nhanh chóng, chính xác.
          </p>
          <p className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs">
            Mọi sự ủng hộ (dù chỉ là 10.000đ - một ly trà đá) đều được dùng 100% để duy trì chi phí máy chủ, tên miền và kết nối API AI cho toàn thể cộng đồng sử dụng miễn phí.
          </p>

          <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 text-center space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Thông tin chuyển khoản ủng hộ
            </div>
            <div className="text-base font-bold text-white tracking-wide">
              Ngân hàng Quân Đội (MB Bank)
            </div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              0988.xxx.xxx
            </div>
            <div className="text-xs text-slate-400">Chủ tài khoản: THIỆU VIỆT HOÀNG</div>
            <div className="text-xs text-amber-300/90 font-medium">Nội dung: Ung ho K12 AI Assistant</div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-500">
          <span className="flex items-center gap-1 text-slate-400">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Trân trọng cảm ơn Quý Thầy/Cô!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
