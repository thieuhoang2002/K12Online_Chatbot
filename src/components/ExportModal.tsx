"use client";

import React from "react";
import { Download, FileText, Printer, X, FileCode, Check } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; category: string; url: string }[];
  followUps?: string[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: ChatSession;
  isDarkMode?: boolean;
}

export default function ExportModal({
  isOpen,
  onClose,
  session,
  isDarkMode = true,
}: ExportModalProps) {
  if (!isOpen || !session) return null;

  const title = session.title || "Cuộc trò chuyện K12Online";
  const messages = session.messages || [];

  // 1. Xuất file Markdown (.md)
  function exportMarkdown() {
    let md = `# ${title}\n\n`;
    md += `*Thời gian tạo: ${new Date(session?.createdAt || Date.now()).toLocaleString("vi-VN")}*\n`;
    md += `*Trích xuất từ: K12Online AI Assistant (https://k12onlinechatbot.thhoang.io.vn/)*\n\n`;
    md += `---\n\n`;

    messages.forEach((m, idx) => {
      if (m.role === "user") {
        md += `### 👤 Người dùng:\n${m.content}\n\n`;
      } else {
        md += `### 🤖 Trợ lý K12Online:\n${m.content}\n\n`;
        if (m.sources && m.sources.length > 0) {
          md += `**Nguồn tài liệu tham khảo:**\n`;
          m.sources.forEach((s) => {
            md += `- [${s.title}](${s.url})\n`;
          });
          md += `\n`;
        }
      }
      md += `---\n\n`;
    });

    downloadBlob(md, `K12Online_${sanitizeFilename(title)}.md`, "text/markdown");
    onClose();
  }

  // 2. Xuất file Plain Text (.txt)
  function exportPlainText() {
    let txt = `========================================================\n`;
    txt += `${title.toUpperCase()}\n`;
    txt += `Thời gian: ${new Date(session?.createdAt || Date.now()).toLocaleString("vi-VN")}\n`;
    txt += `Nguồn: K12Online AI Assistant (https://k12onlinechatbot.thhoang.io.vn/)\n`;
    txt += `========================================================\n\n`;

    messages.forEach((m, idx) => {
      const sender = m.role === "user" ? "[NGƯỜI DÙNG]" : "[TRỢ LÝ K12ONLINE]";
      txt += `${sender}:\n${m.content}\n\n`;
      if (m.sources && m.sources.length > 0) {
        txt += `Nguồn tham khảo:\n`;
        m.sources.forEach((s) => {
          txt += `* ${s.title}: ${s.url}\n`;
        });
        txt += `\n`;
      }
      txt += `--------------------------------------------------------\n\n`;
    });

    downloadBlob(txt, `K12Online_${sanitizeFilename(title)}.txt`, "text/plain");
    onClose();
  }

  // 3. In ấn / Xuất file PDF bằng Print Dialog
  function exportPDF() {
    onClose();
    setTimeout(() => {
      window.print();
    }, 300);
  }

  function downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, "_")
      .slice(0, 35)
      .replace(/_+/g, "_");
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

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Xuất Lịch Sử Cuộc Trò Chuyện</h4>
            <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
              {title}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {/* Nút Markdown */}
          <button
            onClick={exportMarkdown}
            className={`w-full p-3 rounded-xl text-xs flex items-center justify-between transition border ${
              isDarkMode
                ? "bg-[#131314] hover:bg-[#282a2c] border-[#2d2f31] text-slate-200"
                : "bg-slate-50 hover:bg-slate-100 border-[#e3e3e3] text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-sky-500" />
              <div className="text-left">
                <div className="font-semibold">Tải file Markdown (.md)</div>
                <div className="text-[10px] text-slate-400">Giữ nguyên định dạng bảng, code & in đậm</div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Nút Plain Text */}
          <button
            onClick={exportPlainText}
            className={`w-full p-3 rounded-xl text-xs flex items-center justify-between transition border ${
              isDarkMode
                ? "bg-[#131314] hover:bg-[#282a2c] border-[#2d2f31] text-slate-200"
                : "bg-slate-50 hover:bg-slate-100 border-[#e3e3e3] text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-emerald-500" />
              <div className="text-left">
                <div className="font-semibold">Tải file Văn bản (.txt)</div>
                <div className="text-[10px] text-slate-400">Tương thích đọc trên mọi điện thoại & máy tính</div>
              </div>
            </div>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Nút In ấn / Xuất PDF */}
          <button
            onClick={exportPDF}
            className={`w-full p-3 rounded-xl text-xs flex items-center justify-between transition border ${
              isDarkMode
                ? "bg-[#131314] hover:bg-[#282a2c] border-[#2d2f31] text-slate-200"
                : "bg-slate-50 hover:bg-slate-100 border-[#e3e3e3] text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-indigo-500" />
              <div className="text-left">
                <div className="font-semibold">In hoặc Lưu ra PDF (.pdf)</div>
                <div className="text-[10px] text-slate-400">Trình bày trang in chuẩn cho giáo viên dán bàn</div>
              </div>
            </div>
            <Printer className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
