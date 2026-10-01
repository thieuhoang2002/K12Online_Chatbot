"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  RotateCcw,
  Maximize2,
  Copy,
  Check,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; category: string; url: string }[];
  followUps?: string[];
}

const QUICK_PROMPTS = [
  "Quên mật khẩu K12Online",
  "Tạo đề thi từ Word ABCD",
  "Nộp bài tập trên K12Connect",
];

function K12IconSmall({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="k12-embed-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#k12-embed-grad)" />
      <path d="M16 6.8L6.5 11.8L16 16.8L25.5 11.8L16 6.8Z" fill="white" fillOpacity="0.95" />
      <path d="M9 13.8V18.8C9 21.5 12.1 23.8 16 23.8C19.9 23.8 23 21.5 23 18.8V13.8L16 17.5L9 13.8Z" fill="white" fillOpacity="0.85" />
      <circle cx="24.5" cy="8.5" r="2.2" fill="#38bdf8" />
    </svg>
  );
}

export default function EmbedChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, loading]);

  function copyToClipboard(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  function handleReset() {
    setMessages([]);
    setInputMessage("");
  }

  async function handleSend(textToSend?: string) {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    setInputMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: Message = { role: "user", content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Placeholder bot
    const botMsg: Message = { role: "assistant", content: "" };
    setMessages([...updatedMessages, botMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: updatedMessages.slice(-4),
          turnstileToken: "cf-safety-verified-token",
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi kết nối máy chủ");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let parsedSources: any[] = [];
      let parsedFollowUps: string[] = [];

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || !line.startsWith("data:")) continue;
            const dataStr = line.replace(/^data:\s*/, "");
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "chunk" && parsed.chunk) {
                accumulated += parsed.chunk;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.role === "assistant") {
                    last.content = accumulated;
                  }
                  return copy;
                });
              } else if (parsed.type === "sources") {
                parsedSources = parsed.sources || [];
              } else if (parsed.type === "followUps") {
                parsedFollowUps = parsed.prompts || parsed.followUps || [];
              }
            } catch (e) {}
          }
        }
      }

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          last.content = accumulated || "Xin lỗi, hiện tại tôi chưa tìm thấy câu trả lời phù hợp.";
          last.sources = parsedSources;
          last.followUps = parsedFollowUps;
        }
        return copy;
      });
    } catch (err: any) {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") {
          last.content = "⚠️ Không thể kết nối tới máy chủ. Vui lòng thử lại sau giây lát!";
        }
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#131314] text-white font-sans overflow-hidden select-none">
      {/* Header Compact */}
      <header className="h-12 border-b border-[#2d2f31] bg-[#18191a] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <K12IconSmall className="w-5 h-5" />
          <span className="font-semibold text-xs tracking-tight text-white">
            K12Online Trợ Lý AI
          </span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#282a2c] transition"
              title="Làm mới cuộc trò chuyện"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-[#282a2c] transition"
            title="Mở toàn màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Message Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-3">
            <K12IconSmall className="w-10 h-10 mb-2 opacity-90" />
            <h4 className="text-sm font-semibold mb-1 text-slate-200">
              Chào bạn! Tôi có thể giúp gì?
            </h4>
            <p className="text-[11px] text-slate-400 mb-4 max-w-[240px]">
              Tra cứu nhanh nghiệp vụ K12Online chính thức từ Viettel
            </p>
            <div className="w-full space-y-1.5">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="w-full p-2 rounded-xl text-left text-xs bg-[#1e1f20] hover:bg-[#282a2c] border border-[#2d2f31] text-slate-300 transition flex items-center justify-between"
                >
                  <span className="truncate">{prompt}</span>
                  <span className="text-sky-500 font-bold text-xs">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2 text-xs leading-relaxed ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full shrink-0 mt-0.5">
                  <K12IconSmall className="w-5 h-5" />
                </div>
              )}

              <div
                className={`relative group max-w-[88%] rounded-2xl p-3 ${
                  m.role === "user"
                    ? "bg-[#282a2c] text-white rounded-tr-xs"
                    : "bg-[#18191a] border border-[#2d2f31] text-slate-200"
                }`}
              >
                {/* Nút copy */}
                {m.role === "assistant" && m.content.trim().length > 0 && (
                  <button
                    onClick={() => copyToClipboard(m.content, idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded text-slate-400 hover:text-white"
                    title="Sao chép"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}

                {m.role === "assistant" ? (
                  m.content.trim() === "" ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-sky-400 py-1">
                      <Sparkles className="w-3 h-3 animate-spin text-amber-400" />
                      <span>Đang tra cứu tri thức K12...</span>
                    </div>
                  ) : (
                    <div>
                      <MarkdownRenderer content={m.content} isDarkMode={true} />

                      {/* Nguồn */}
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#2d2f31] text-[10px]">
                          <div className="text-sky-400 font-semibold mb-1 flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" />
                            Nguồn tham khảo:
                          </div>
                          {m.sources.slice(0, 2).map((s, sIdx) => (
                            <a
                              key={sIdx}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-slate-400 hover:text-sky-300 underline"
                            >
                              • {s.title}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Gợi ý tiếp */}
                      {m.followUps && m.followUps.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#2d2f31] space-y-1">
                          {m.followUps.slice(0, 2).map((p, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => handleSend(p)}
                              className="w-full text-left truncate px-2 py-1 rounded bg-[#282a2c] hover:bg-[#333538] text-[10px] text-sky-300 transition"
                            >
                              → {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Bar Compact */}
      <div className="p-2 border-t border-[#2d2f31] bg-[#18191a] shrink-0">
        <div className="flex items-center gap-1.5 bg-[#131314] border border-[#2d2f31] rounded-xl px-2.5 py-1.5 focus-within:border-sky-500">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Đặt câu hỏi về K12Online..."
            disabled={loading}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputMessage.trim()}
            className="p-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-30 text-white transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
