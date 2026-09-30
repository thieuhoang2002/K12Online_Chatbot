"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Bot,
  User,
  LogIn,
  LogOut,
  ExternalLink,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  Info,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import CloudflareTurnstile from "@/components/CloudflareTurnstile";
import AuthModal from "@/components/AuthModal";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; category: string; url: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const QUICK_PROMPTS = [
  "Làm sao để nhập câu hỏi trắc nghiệm từ file Word dạng ABCD?",
  "Học sinh làm bài thi trực tuyến trên K12Online cần lưu ý những gì?",
  "Hướng dẫn phụ huynh và học sinh nộp bài tập về nhà trên K12Connect",
  "Cách nhà trường cấu hình phân công giám thị và quản lý vi phạm",
];

const AVAILABLE_MODELS = [
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "NVIDIA Nemotron 3 Ultra (550B - Free)", badge: "Khuyên dùng" },
  { id: "qwen/qwen3.8-27b:free", name: "Qwen 3.8 27B (Tiếng Việt xuất sắc - Free)", badge: "Nhanh" },
  { id: "google/gemma-4-31b-it:free", name: "Google Gemma 4 31B (Open-weight - Free)", badge: "Mới" },
];

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);

  // Modals & User state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Khởi tạo phiên làm việc ban đầu
  useEffect(() => {
    const savedSessions = localStorage.getItem("k12_chat_sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {}
    }

    const savedUser = localStorage.getItem("k12_user_email");
    if (savedUser) setUserEmail(savedUser);

    if (!savedSessions || JSON.parse(savedSessions).length === 0) {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("k12_chat_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSessionId, loading]);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  function createNewChat() {
    const newSession: ChatSession = {
      id: "chat_" + Date.now(),
      title: "Cuộc trò chuyện mới",
      messages: [
        {
          role: "assistant",
          content:
            "Kính chào Quý Thầy/Cô giáo và Cán bộ IT nhà trường! Em là Trợ lý AI hỗ trợ nghiệp vụ K12Online.\n\nThầy/Cô có thể hỏi em bất kỳ vấn đề gì về: nhập đề thi từ Word, làm bài trực tuyến, quản lý bài tập K12Connect, điểm danh, xếp thời khóa biểu... Em sẽ hướng dẫn từng bước chi tiết nhất ạ!",
        },
      ],
      createdAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }

  function handleLoginSuccess(email: string) {
    setUserEmail(email);
    localStorage.setItem("k12_user_email", email);
  }

  function handleLogout() {
    setUserEmail(null);
    localStorage.removeItem("k12_user_email");
  }

  async function handleSendMessage(textToSend?: string) {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    setInputMessage("");

    // Cập nhật câu hỏi của người dùng
    const userMsg: Message = { role: "user", content: query };
    const updatedMessages = [...messages, userMsg];

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            title: s.messages.length <= 1 ? query.slice(0, 30) + "..." : s.title,
            messages: updatedMessages,
          };
        }
        return s;
      })
    );

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: updatedMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể kết nối đến máy chủ AI.");
      }

      const botMsg: Message = {
        role: "assistant",
        content: data.reply,
        sources: data.sources,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id ? { ...s, messages: [...updatedMessages, botMsg] } : s
        )
      );
    } catch (err: any) {
      const errorMsg: Message = {
        role: "assistant",
        content: `Dạ thưa Thầy/Cô, hệ thống đang gặp gián đoạn tạm thời: ${err.message}. Thầy/Cô vui lòng thử lại sau giây lát ạ.`,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id ? { ...s, messages: [...updatedMessages, errorMsg] } : s
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* SIDEBAR LỊCH SỬ CHAT */}
      <aside className="w-72 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0">
        {/* Header Sidebar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-sky-600 to-indigo-500 rounded-xl shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">K12Online AI</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                Phi Lợi Nhuận
              </span>
            </div>
          </div>
        </div>

        {/* Nút Tạo Hội Thoại Mới */}
        <div className="p-3">
          <button
            onClick={createNewChat}
            className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-sm font-medium text-slate-200 flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            Đoạn chat mới
          </button>
        </div>

        {/* Danh sách các đoạn chat */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Lịch sử tra cứu
          </div>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-2.5 transition truncate ${
                s.id === currentSessionId
                  ? "bg-sky-600/15 text-sky-300 font-medium border border-sky-500/30"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Footer Sidebar: User / Login Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-xs">
          {userEmail ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center font-bold text-white text-xs">
                  {userEmail[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="font-medium text-slate-200 truncate">{userEmail}</div>
                  <div className="text-[10px] text-emerald-400">Đã đồng bộ lịch sử</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1 hover:text-rose-400 text-slate-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/40 text-slate-400 text-[11px] leading-relaxed">
                Thầy/Cô đang ở <strong>Chế độ Khách</strong> (Tra cứu tự do không cần đăng nhập).
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium flex items-center justify-center gap-1.5 transition text-xs"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                Đăng nhập để lưu vĩnh viễn
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* KHUNG NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* TOP BAR */}
        <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-400" />
              Trung Tâm Hỗ Trợ Nghiệp Vụ K12Online
            </span>
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-medium border border-sky-500/20">
              Cộng Đồng Giáo Dục
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Xác minh Cloudflare */}
            <CloudflareTurnstile />
          </div>
        </header>

        {/* KHUNG CUỘN CHAT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl w-full mx-auto">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-sm leading-relaxed ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                  m.role === "user"
                    ? "bg-sky-600 text-white"
                    : "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                }`}
              >
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`relative group max-w-[85%] rounded-2xl p-4 ${
                  m.role === "user"
                    ? "bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-900/20"
                    : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm"
                }`}
              >
                {/* Nút copy câu trả lời */}
                {m.role === "assistant" && (
                  <button
                    onClick={() => copyToClipboard(m.content, idx)}
                    title="Sao chép nội dung"
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition opacity-0 group-hover:opacity-100"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <div className="whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed">
                  {m.content}
                </div>

                {/* Danh sách nguồn tham khảo trích dẫn */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="font-semibold text-sky-400 flex items-center gap-1 mb-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Nguồn bài viết gốc K12Online (Viettel):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-slate-300 hover:text-sky-300 transition text-[11px]"
                        >
                          <span className="truncate max-w-[220px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></div>
                Đang tra cứu cơ sở tri thức K12Online và soạn thảo câu trả lời...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* GỢI Ý CÂU HỎI THƯỜNG GẶP */}
        <div className="px-6 py-2 bg-slate-950/80 border-t border-slate-800/40">
          <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 whitespace-nowrap self-center font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Thầy/Cô hay hỏi:
            </span>
            {QUICK_PROMPTS.map((q, qIdx) => (
              <button
                key={qIdx}
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-full whitespace-nowrap transition text-[11.5px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* KHUNG NHẬP LIỆU FOOTER */}
        <div className="p-4 md:p-6 bg-slate-900/60 border-t border-slate-800/80">
          <div className="max-w-4xl mx-auto space-y-2">
            <div className="relative flex items-center bg-slate-800/90 border border-slate-700/80 focus-within:border-sky-500 rounded-2xl shadow-inner transition p-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="Thầy/Cô hãy nhập câu hỏi vào đây (Ví dụ: Cách duyệt bài tập về nhà trên K12Connect?)..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-32"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-30 disabled:hover:bg-sky-600 text-white rounded-xl transition shadow-md shrink-0 mr-1"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Dòng tuyên bố miễn trừ trách nhiệm & Bản quyền cộng đồng */}
            <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 px-1 gap-1">
              <span className="flex items-center gap-1 text-center sm:text-left">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Dự án phi lợi nhuận độc lập của cộng đồng giáo dục. Không thuộc sở hữu chính thức của Tập đoàn Viettel.
              </span>
              <span className="text-slate-400">
                Bộ não AI: <strong>OpenRouter Engine (Xoay Key Tự Động)</strong>
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* CÁC CỬA SỔ MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
