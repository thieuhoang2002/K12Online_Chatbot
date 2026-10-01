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
  Info,
  Sun,
  Moon,
  Menu,
  X,
  Trash2,
  Github,
  PanelLeftClose,
  PanelLeft,
  PenSquare,
  ChevronDown,
} from "lucide-react";
import CloudflareTurnstile from "@/components/CloudflareTurnstile";
import AuthModal from "@/components/AuthModal";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { supabase } from "@/lib/supabase";

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

const QUICK_PROMPTS = [
  {
    title: "Nhập đề thi từ Word ABCD",
    desc: "Cách chuẩn hóa định dạng câu hỏi và đáp án",
    prompt: "Làm sao để nhập câu hỏi trắc nghiệm từ file Word dạng ABCD?",
  },
  {
    title: "Lưu ý kiểm tra & thi trực tuyến",
    desc: "Cần chuẩn bị gì trước khi học sinh làm bài thi",
    prompt: "Học sinh làm bài thi trực tuyến trên K12Online cần lưu ý những gì?",
  },
  {
    title: "Nộp bài tập trên K12Connect",
    desc: "Hướng dẫn phụ huynh và học sinh nộp bài tập",
    prompt: "Hướng dẫn phụ huynh và học sinh nộp bài tập về nhà trên K12Connect",
  },
  {
    title: "Phân công giám thị & ký duyệt sổ",
    desc: "Quy trình cấu hình và quản trị nhà trường",
    prompt: "Cách nhà trường cấu hình phân công giám thị và quản lý vi phạm",
  },
];

// Bộ nhớ đệm Client-side lưu câu trả lời ngay trên trình duyệt (phản hồi 0.01 giây khi hỏi lại)
const clientCache = new Map<string, { reply: string; sources: any; followUps?: string[] }>();

const AVAILABLE_MODELS = [
  { id: "qwen/qwen3.8-27b:free", name: "Qwen 3.8 27B", badge: "Siêu tốc ~1.9s", desc: "Mô hình khuyên dùng" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Nemotron 3 550B", badge: "Chi tiết", desc: "Mô hình chuyên sâu" },
  { id: "google/gemma-4-31b-it:free", name: "Google Gemma 4", badge: "Dự phòng", desc: "Open-weight Gemini" },
];

// Biểu tượng ngôi sao 4 cánh đa sắc chuẩn phong cách Google Gemini
function GeminiStar({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="gemini-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285f4" />
          <stop offset="35%" stopColor="#9b72cb" />
          <stop offset="70%" stopColor="#d96570" />
          <stop offset="100%" stopColor="#13b5ea" />
        </linearGradient>
      </defs>
      <path
        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
        fill="url(#gemini-star-grad)"
      />
    </svg>
  );
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Theme & Layout state
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals & User state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Ref cuộn độc lập bên trong container chat (CHỐNG LỖI MẤT HEADER TRÊN MOBILE)
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Khởi tạo Theme & Phiên làm việc ban đầu
  useEffect(() => {
    // 1. Theme
    const savedTheme = localStorage.getItem("k12_theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
      }
    } else {
      document.documentElement.classList.add("dark");
    }

    // 2. Chat sessions
    const savedSessions = localStorage.getItem("k12_chat_sessions");
    let hasLoaded = false;
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          hasLoaded = true;
        }
      } catch (e) {}
    }

    if (!hasLoaded) {
      const initialSession: ChatSession = {
        id: "chat_init",
        title: "Cuộc trò chuyện mới",
        messages: [],
        createdAt: Date.now(),
      };
      setSessions([initialSession]);
      setCurrentSessionId(initialSession.id);
    }

    // 3. Responsive: Trên màn hình nhỏ thì đóng sidebar mặc định
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // 4. Lắng nghe đăng nhập từ Supabase & Đồng bộ Cloud
  const fetchSupabaseSessions = React.useCallback(async (email: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_email", email)
        .order("updated_at", { ascending: false });

      if (error) {
        if (error.code !== "PGRST205") {
          console.warn("⚠️ [Supabase] Lỗi tải dữ liệu:", error.message);
        }
        return;
      }

      if (data && data.length > 0) {
        const cloudSessions: ChatSession[] = data.map((row: any) => ({
          id: row.id,
          title: row.title || "Cuộc trò chuyện",
          messages: Array.isArray(row.messages) ? row.messages : [],
          createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        }));
        setSessions(cloudSessions);
        if (cloudSessions.length > 0) {
          setCurrentSessionId(cloudSessions[0].id);
        }
      }
    } catch (e: any) {
      console.warn("⚠️ [Supabase] Lỗi đồng bộ đám mây:", e.message);
    }
  }, []);

  const syncSessionToSupabase = React.useCallback(
    async (sessionId: string, sessionMessages: Message[], customTitle?: string) => {
      if (!supabase || !userEmail) return;
      try {
        const target = sessions.find((s) => s.id === sessionId);
        const title =
          customTitle ||
          target?.title ||
          sessionMessages.find((m) => m.role === "user")?.content.slice(0, 30) ||
          "Cuộc trò chuyện mới";

        const { error } = await supabase.from("chat_sessions").upsert(
          {
            id: sessionId,
            user_email: userEmail,
            title: title,
            messages: sessionMessages,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (error && error.code !== "PGRST205") {
          console.warn("⚠️ [Supabase] Lỗi lưu phiên chat:", error.message);
        }
      } catch (e) {}
    },
    [userEmail, sessions]
  );

  async function deleteChat(sessionId: string) {
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (remaining.length > 0) {
      setSessions(remaining);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(remaining[0].id);
      }
    } else {
      const freshSession: ChatSession = {
        id: "chat_" + Date.now(),
        title: "Cuộc trò chuyện mới",
        messages: [],
        createdAt: Date.now(),
      };
      setSessions([freshSession]);
      setCurrentSessionId(freshSession.id);
    }

    if (supabase && userEmail) {
      try {
        await supabase
          .from("chat_sessions")
          .delete()
          .eq("id", sessionId)
          .eq("user_email", userEmail);
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        localStorage.setItem("k12_user_email", session.user.email);
        fetchSupabaseSessions(session.user.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user?.email) {
        setUserEmail(session.user.email);
        localStorage.setItem("k12_user_email", session.user.email);
        fetchSupabaseSessions(session.user.email);
      } else if (event === "SIGNED_OUT") {
        setUserEmail(null);
        localStorage.removeItem("k12_user_email");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSupabaseSessions]);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("k12_chat_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Cuộn mượt bên trong container chat, TUYỆT ĐỐI KHÔNG làm cuộn Window (giúp Header không bao giờ mất trên mobile)
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession?.messages || [];

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, loading]);

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

  function createNewChat() {
    if (loading) return;
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    const newSession: ChatSession = {
      id: "chat_" + Date.now(),
      title: "Cuộc trò chuyện mới",
      messages: [],
      createdAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (userEmail) {
      syncSessionToSupabase(newSession.id, newSession.messages, newSession.title);
    }
  }

  function handleLoginSuccess(email: string) {
    setUserEmail(email);
    localStorage.setItem("k12_user_email", email);
    fetchSupabaseSessions(email);
  }

  async function handleLogout() {
    setUserEmail(null);
    localStorage.removeItem("k12_user_email");
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  const handleTurnstileVerify = React.useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  async function handleSendMessage(textToSend?: string) {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    setInputMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const userMsg: Message = { role: "user", content: query };
    let targetSessionId = currentSessionId;

    if (!targetSessionId) {
      targetSessionId = "chat_" + Date.now();
      setCurrentSessionId(targetSessionId);
    }

    const updatedMessages = [...messages, userMsg];

    // Cập nhật câu hỏi người dùng lên UI
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            title: s.messages.length === 0 ? query.slice(0, 30) : s.title,
            messages: updatedMessages,
          };
        }
        return s;
      })
    );

    // Kiểm tra cache client
    const cachedResponse = clientCache.get(query.toLowerCase());
    if (cachedResponse) {
      const botMsg: Message = {
        role: "assistant",
        content: cachedResponse.reply,
        sources: cachedResponse.sources,
        followUps: cachedResponse.followUps,
      };
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              title: s.messages.length <= 1 ? query.slice(0, 30) : s.title,
              messages: [...updatedMessages, botMsg],
            };
          }
          return s;
        })
      );
      if (userEmail) {
        syncSessionToSupabase(targetSessionId, [...updatedMessages, botMsg]);
      }
      return;
    }

    // Tạo tin nhắn bot rỗng để kích hoạt hiệu ứng Thinking
    const initialBotMsg: Message = {
      role: "assistant",
      content: "",
      sources: [],
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            title: s.messages.length <= 1 ? query.slice(0, 30) : s.title,
            messages: [...updatedMessages, initialBotMsg],
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
          turnstileToken: turnstileToken,
        }),
      });

      // Refresh Turnstile ngầm
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cf-turnstile-refresh"));
      }

      if (!res.ok) {
        let errorMsgText = "Không thể kết nối đến máy chủ AI.";
        try {
          const errData = await res.json();
          if (errData.error) errorMsgText = errData.error;
        } catch (e) {}
        throw new Error(errorMsgText);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamedReply = "";
      let streamedSources: any[] = [];
      let streamedFollowUps: string[] = [];
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          let hasUpdated = false;

          for (const part of parts) {
            const lines = part.split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const jsonStr = trimmed.replace(/^data:\s*/, "").trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.type === "sources") {
                  streamedSources = parsed.sources;
                  hasUpdated = true;
                } else if (parsed.type === "follow_ups") {
                  streamedFollowUps = parsed.followUps;
                  hasUpdated = true;
                } else if (parsed.type === "text" || parsed.text !== undefined) {
                  streamedReply += parsed.text;
                  hasUpdated = true;
                }
              } catch (e) {}
            }
          }

          if (hasUpdated) {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === targetSessionId) {
                  const msgs = [...s.messages];
                  const lastIdx = msgs.length - 1;
                  if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
                    msgs[lastIdx] = {
                      role: "assistant",
                      content: streamedReply,
                      sources: streamedSources,
                      followUps: streamedFollowUps,
                    };
                  }
                  return { ...s, messages: msgs };
                }
                return s;
              })
            );
          }
        }
      }

      // Lưu cache client
      if (streamedReply.trim().length > 0) {
        clientCache.set(query.toLowerCase(), {
          reply: streamedReply,
          sources: streamedSources,
          followUps: streamedFollowUps,
        });
      }

      if (userEmail) {
        syncSessionToSupabase(targetSessionId, [
          ...updatedMessages,
          {
            role: "assistant",
            content: streamedReply,
            sources: streamedSources,
            followUps: streamedFollowUps,
          },
        ]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const fallbackReply = `⚠️ **Lỗi:** ${err.message || "Hệ thống gặp gián đoạn tạm thời. Bạn vui lòng thử lại sau giây lát nhé."}`;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === targetSessionId) {
            const msgs = [...s.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
              msgs[lastIdx] = {
                role: "assistant",
                content: fallbackReply,
                sources: [],
              };
            }
            return { ...s, messages: msgs };
          }
          return s;
        })
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

  const isDarkMode = theme === "dark";
  const isNewChat = messages.length === 0;
  const activeModelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div
      className={`fixed inset-0 h-[100dvh] max-h-[100dvh] w-full overflow-hidden flex transition-colors duration-200 ${
        isDarkMode ? "bg-[#131314] text-[#e3e3e3]" : "bg-[#ffffff] text-[#1f1f1f]"
      }`}
    >
      {/* 1. LỚP PHỦ MỜ (Backdrop) khi mở Drawer trên màn hình nhỏ */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* 2. SIDEBAR (Phong cách Gemini: Thu gọn / Mở rộng, Tối giản, Chứa nút Đăng nhập & Đổi theme) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r ${
          isDarkMode
            ? "bg-[#1e1f20] border-[#2d2f31]"
            : "bg-[#f0f4f9] border-[#e3e3e3]"
        } ${
          isSidebarOpen
            ? "w-72 max-w-[85vw] translate-x-0"
            : "-translate-x-full lg:w-0 lg:translate-x-0 lg:border-none lg:overflow-hidden"
        }`}
      >
        {/* Header Sidebar */}
        <div className="h-14 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <GeminiStar className="w-5 h-5 shrink-0" />
            <span
              className={`font-semibold text-base tracking-tight ${
                isDarkMode ? "text-white" : "text-[#1f1f1f]"
              }`}
            >
              K12Online AI
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className={`p-2 rounded-full transition ${
              isDarkMode
                ? "hover:bg-[#2d2f31] text-slate-400 hover:text-white"
                : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
            }`}
            title="Thu gọn thanh bên"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Nút Tạo Cuộc Trò Chuyện Mới */}
        <div className="p-3">
          <button
            onClick={createNewChat}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-full text-sm font-medium flex items-center gap-3 transition shadow-xs ${
              loading ? "opacity-40 cursor-not-allowed" : ""
            } ${
              isDarkMode
                ? "bg-[#131314] hover:bg-[#282a2c] text-white border border-[#2d2f31]"
                : "bg-white hover:bg-slate-50 text-slate-800 border border-[#e3e3e3]"
            }`}
          >
            <Plus className="w-4 h-4 text-sky-500" />
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>

        {/* Thân Sidebar: Thông báo "Đăng nhập để lưu hoạt động" HOẶC Lịch sử chat nếu đã đăng nhập */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {!userEmail ? (
            <div
              onClick={() => setIsAuthOpen(true)}
              className={`p-3 rounded-2xl cursor-pointer transition border text-xs flex items-start gap-2.5 ${
                isDarkMode
                  ? "bg-[#131314]/60 hover:bg-[#131314] border-[#2d2f31] text-slate-300"
                  : "bg-white hover:bg-slate-50 border-[#e3e3e3] text-slate-700"
              }`}
            >
              <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold underline decoration-dotted underline-offset-2">
                  Đăng nhập để lưu hoạt động
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Lưu trữ lịch sử câu hỏi trên đám mây để xem lại mọi lúc mọi nơi.
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Gần đây
              </div>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    if (loading) return;
                    setCurrentSessionId(s.id);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`group w-full p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                    loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                  } ${
                    s.id === currentSessionId
                      ? isDarkMode
                        ? "bg-[#282a2c] text-sky-400 font-medium"
                        : "bg-slate-200 text-sky-700 font-medium"
                      : isDarkMode
                      ? "text-slate-300 hover:bg-[#282a2c]/60"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{s.title || "Cuộc trò chuyện"}</span>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(s.id);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 transition"
                      title="Xóa cuộc trò chuyện này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chân Sidebar: Nút Sáng/Tối, Đăng nhập / Profile */}
        <div
          className={`p-3 border-t flex flex-col gap-2 shrink-0 ${
            isDarkMode ? "border-[#2d2f31]" : "border-[#e3e3e3]"
          }`}
        >
          {/* Nút bật tắt Chế độ Sáng / Tối */}
          <button
            onClick={toggleTheme}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition ${
              isDarkMode
                ? "hover:bg-[#282a2c] text-slate-300"
                : "hover:bg-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
              <span>Giao diện: {isDarkMode ? "Chế độ Tối" : "Chế độ Sáng"}</span>
            </div>
          </button>

          {/* Nút Đăng nhập hoặc Hồ sơ người dùng */}
          {!userEmail ? (
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2.5 transition ${
                isDarkMode
                  ? "bg-[#282a2c] hover:bg-[#333538] text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-900"
              }`}
            >
              <LogIn className="w-4 h-4 text-sky-500" />
              <span>Đăng nhập</span>
            </button>
          ) : (
            <div
              className={`p-2 rounded-xl flex items-center justify-between text-xs ${
                isDarkMode ? "bg-[#131314]" : "bg-white border border-[#e3e3e3]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center font-bold text-white text-[11px]">
                  {userEmail[0].toUpperCase()}
                </div>
                <div className="truncate font-medium">{userEmail}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1 hover:text-rose-500 text-slate-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 3. KHU VỰC CHÍNH (MAIN AREA) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* TOP BAR: Dính chặt cố định (Sticky top-0), KHÔNG BAO GIỜ bị cuộn mất trên Mobile/Tablet */}
        <header
          className={`h-14 shrink-0 border-b flex items-center justify-between px-3 md:px-6 z-30 transition-colors ${
            isDarkMode
              ? "bg-[#131314]/95 border-[#2d2f31] backdrop-blur-md"
              : "bg-white/95 border-[#e3e3e3] backdrop-blur-md"
          }`}
        >
          {/* Cụm bên trái: Nút mở sidebar & Tên ứng dụng */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Trên Mobile/Tablet: Nút Menu Hamburger mở Drawer */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-full transition lg:hidden ${
                isDarkMode ? "hover:bg-[#1e1f20] text-slate-300" : "hover:bg-slate-100 text-slate-700"
              }`}
              title="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Trên Desktop: Nút mở thanh bên khi thanh bên đang đóng */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`hidden lg:flex p-2 rounded-full transition ${
                  isDarkMode ? "hover:bg-[#1e1f20] text-slate-300" : "hover:bg-slate-100 text-slate-700"
                }`}
                title="Mở thanh bên"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            {/* Tên ứng dụng phong cách Gemini */}
            <div className="flex items-center gap-2 select-none">
              <GeminiStar className="w-5 h-5 hidden sm:block" />
              <span
                className={`font-semibold text-base sm:text-lg tracking-tight ${
                  isDarkMode ? "text-white" : "text-[#1f1f1f]"
                }`}
              >
                K12Online
              </span>
            </div>
          </div>

          {/* Cụm ở giữa: Dropdown chọn Model (Phong cách Gemini: Flash Mở rộng ▾) */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                isDarkMode
                  ? "bg-[#1e1f20] hover:bg-[#282a2c] text-slate-200 border-[#2d2f31]"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-[#e3e3e3]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span className="font-medium">{activeModelObj.name}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* Dropdown Menu Model */}
            {isModelDropdownOpen && (
              <div
                className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-64 rounded-2xl shadow-xl border p-1.5 z-50 ${
                  isDarkMode ? "bg-[#1e1f20] border-[#2d2f31]" : "bg-white border-[#e3e3e3]"
                }`}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition flex items-start justify-between ${
                      m.id === selectedModel
                        ? isDarkMode
                          ? "bg-[#282a2c] text-sky-400"
                          : "bg-slate-100 text-sky-700"
                        : isDarkMode
                        ? "text-slate-300 hover:bg-[#282a2c]/60"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.desc}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 font-medium">
                      {m.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cụm bên phải: Nút Đoạn chat mới (Mobile), Nút Đăng nhập Gemini Pill */}
          <div className="flex items-center gap-2">
            {/* Nút Tạo đoạn chat mới dạng icon cây bút trên Mobile (Ảnh 2) */}
            <button
              onClick={createNewChat}
              disabled={loading}
              className={`p-2 rounded-full transition lg:hidden ${
                isDarkMode ? "hover:bg-[#1e1f20] text-slate-300" : "hover:bg-slate-100 text-slate-700"
              }`}
              title="Cuộc trò chuyện mới"
            >
              <PenSquare className="w-5 h-5 text-sky-500" />
            </button>

            {/* Cloudflare Turnstile vô hình */}
            <CloudflareTurnstile onVerify={handleTurnstileVerify} />

            {/* Nút Đăng nhập dạng Pill màu xanh chuẩn Gemini (Desktop Hình 1) */}
            {!userEmail ? (
              <button
                onClick={() => setIsAuthOpen(true)}
                className={`hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition shadow-xs ${
                  isDarkMode
                    ? "bg-[#c2e7ff] hover:bg-[#a6d5f7] text-[#001d35]"
                    : "bg-[#0b57d0] hover:bg-[#0842a0] text-white"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                {userEmail[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* CONTAINER NỘI DUNG CHAT: Cuộn độc lập, không làm ảnh hưởng Header */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6 flex flex-col justify-between"
        >
          {/* TRƯỜNG HỢP 1: CUỘC HỘI THOẠI MỚI (Trang chào đón chuẩn Gemini Desktop & Mobile) */}
          {isNewChat ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full my-auto text-center px-4 animate-fade-in">
              {/* Ngôi sao 4 cánh Gemini gradient rực rỡ ở chính giữa (Ảnh 2) */}
              <div className="mb-6">
                <GeminiStar className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md" />
              </div>

              {/* Tiêu đề chào đón theo đúng ảnh người dùng gửi */}
              <h1
                className={`text-2xl sm:text-4xl font-normal tracking-tight mb-3 ${
                  isDarkMode ? "text-white" : "text-[#1f1f1f]"
                }`}
              >
                {userEmail
                  ? `Tôi có thể giúp gì cho bạn, ${userEmail.split("@")[0]}?`
                  : "Chúng ta nên bắt đầu từ đâu nhỉ?"}
              </h1>

              <p className="text-sm sm:text-base text-slate-400 mb-8 max-w-md">
                Trợ lý AI hỗ trợ nghiệp vụ K12Online chính xác và nhanh chóng.
              </p>

              {/* Lưới các gợi ý câu hỏi thường gặp (Quick Prompt Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => handleSendMessage(item.prompt)}
                    className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col justify-between group ${
                      isDarkMode
                        ? "bg-[#1e1f20]/60 hover:bg-[#1e1f20] border-[#2d2f31] hover:border-slate-600 text-slate-200"
                        : "bg-slate-50 hover:bg-white border-[#e3e3e3] hover:border-slate-400 text-slate-800 shadow-xs"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1 group-hover:text-sky-500 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11.5px] text-slate-400 leading-relaxed">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 2: DANH SÁCH TIN NHẮN ĐANG TRÒ CHUYỆN */
            <div className="max-w-3xl w-full mx-auto space-y-6 pb-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-sm leading-relaxed ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <GeminiStar className="w-6 h-6" />
                    </div>
                  )}

                  <div
                    className={`relative group max-w-[88%] sm:max-w-[82%] rounded-3xl p-4 transition-colors ${
                      m.role === "user"
                        ? isDarkMode
                          ? "bg-[#282a2c] text-white rounded-tr-sm"
                          : "bg-[#e9eef6] text-[#1f1f1f] rounded-tr-sm"
                        : "text-inherit"
                    }`}
                  >
                    {/* Nút Copy câu trả lời */}
                    {m.role === "assistant" && m.content.trim().length > 0 && (
                      <button
                        onClick={() => copyToClipboard(m.content, idx)}
                        title="Sao chép nội dung"
                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100 ${
                          isDarkMode
                            ? "text-slate-400 hover:text-white hover:bg-[#282a2c]"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {m.role === "assistant" ? (
                      m.content.trim() === "" ? (
                        /* Hiệu ứng Thinking khi đang suy nghĩ */
                        <div className="flex items-center gap-2.5 py-1 text-xs">
                          <div className="flex space-x-1 items-center">
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"></span>
                          </div>
                          <span className="font-medium text-sky-500 dark:text-sky-400 animate-pulse flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            Trợ lý K12 đang suy nghĩ và tra cứu câu trả lời...
                          </span>
                        </div>
                      ) : (
                        <div>
                          <MarkdownRenderer content={m.content} isDarkMode={isDarkMode} />
                          {/* Đang stream dở */}
                          {loading && idx === messages.length - 1 && (
                            <div className="flex items-center gap-2 mt-2 pt-2 text-xs text-sky-500 dark:text-sky-400 font-medium">
                              <span className="inline-block w-2 h-3.5 bg-sky-500 rounded-sm animate-pulse" />
                              <div className="flex items-center gap-1.5 animate-pulse">
                                <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                                <span>Trợ lý đang tiếp tục viết...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {m.content}
                      </div>
                    )}

                    {/* Danh sách nguồn bài viết gốc */}
                    {m.sources && m.sources.length > 0 && m.content.trim().length > 0 && (
                      <div
                        className={`mt-4 pt-3 border-t text-xs ${
                          isDarkMode ? "border-[#2d2f31]" : "border-[#e3e3e3]"
                        }`}
                      >
                        <div className="font-semibold text-sky-500 flex items-center gap-1 mb-2">
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
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition text-[11px] border ${
                                isDarkMode
                                  ? "bg-[#1e1f20] hover:bg-[#282a2c] border-[#2d2f31] text-slate-300 hover:text-sky-300"
                                  : "bg-slate-100 hover:bg-slate-200 border-[#e3e3e3] text-slate-700 hover:text-sky-600"
                              }`}
                            >
                              <span className="truncate max-w-[200px]">{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Câu hỏi gợi ý tiếp theo (Follow-ups) */}
                    {m.role === "assistant" &&
                      m.followUps &&
                      m.followUps.length > 0 &&
                      (!loading || idx < messages.length - 1) && (
                        <div
                          className={`mt-3.5 pt-3 border-t text-xs ${
                            isDarkMode ? "border-[#2d2f31]" : "border-[#e3e3e3]"
                          }`}
                        >
                          <div className="font-medium text-slate-400 flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Câu hỏi gợi ý liên quan:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {m.followUps.map((prompt, pIdx) => (
                              <button
                                key={pIdx}
                                disabled={loading}
                                onClick={() => handleSendMessage(prompt)}
                                className={`text-left inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition border ${
                                  loading ? "opacity-40 cursor-not-allowed" : ""
                                } ${
                                  isDarkMode
                                    ? "bg-[#1e1f20] hover:bg-[#282a2c] border-[#2d2f31] text-slate-300 hover:text-sky-400"
                                    : "bg-slate-100 hover:bg-slate-200 border-[#e3e3e3] text-slate-700 hover:text-sky-600"
                                }`}
                              >
                                <span className="text-sky-500 font-bold">→</span>
                                <span>{prompt}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gợi ý câu hỏi trôi nổi (khi đã có chat) */}
          {!isNewChat && (
            <div className="max-w-3xl w-full mx-auto my-2 overflow-x-auto flex gap-1.5 no-scrollbar py-1">
              {QUICK_PROMPTS.slice(0, 3).map((q, qIdx) => (
                <button
                  key={qIdx}
                  disabled={loading}
                  onClick={() => handleSendMessage(q.prompt)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition text-xs border shrink-0 ${
                    loading ? "opacity-40 cursor-not-allowed" : ""
                  } ${
                    isDarkMode
                      ? "bg-[#1e1f20] hover:bg-[#282a2c] text-slate-300 border-[#2d2f31]"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-[#e3e3e3]"
                  }`}
                >
                  {q.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. KHUNG NHẬP LIỆU FLOATING CAPSULE CHUẨN GEMINI (Hình 1 & Hình 2) */}
        <div className="shrink-0 px-3 md:px-6 pb-3 pt-1">
          <div className="max-w-3xl w-full mx-auto">
            {/* Thanh Capsule bo tròn floating */}
            <div
              className={`rounded-full border shadow-sm transition-all flex items-center px-3.5 py-2 ${
                isDarkMode
                  ? "bg-[#1e1f20] border-[#2d2f31] focus-within:border-sky-500"
                  : "bg-[#f0f4f9] border-[#e3e3e3] focus-within:border-sky-500 focus-within:bg-white"
              }`}
            >
              {/* Nút cộng bên trái */}
              <button
                onClick={createNewChat}
                className={`p-1.5 rounded-full transition mr-1 shrink-0 ${
                  isDarkMode
                    ? "hover:bg-[#282a2c] text-slate-400 hover:text-white"
                    : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}
                title="Tạo cuộc trò chuyện mới"
              >
                <Plus className="w-5 h-5 text-sky-500" />
              </button>

              {/* Ô gõ tin nhắn */}
              <textarea
                ref={textareaRef}
                value={inputMessage}
                disabled={loading}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) {
                      handleSendMessage();
                    }
                  }
                }}
                rows={1}
                placeholder={
                  loading
                    ? "Trợ lý K12 đang soạn thảo câu trả lời..."
                    : "Hỏi K12Online..."
                }
                className={`flex-1 bg-transparent px-2.5 py-1 text-sm focus:outline-none resize-none max-h-28 ${
                  loading ? "cursor-not-allowed opacity-60" : ""
                } ${
                  isDarkMode
                    ? "text-white placeholder-slate-400"
                    : "text-slate-900 placeholder-slate-500"
                }`}
              />

              {/* Nút gửi tin nhắn tròn màu xanh */}
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ml-1 shadow-xs ${
                  loading || !inputMessage.trim()
                    ? isDarkMode
                      ? "bg-[#282a2c] text-slate-600 cursor-not-allowed"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-sky-600 hover:bg-sky-500 text-white"
                }`}
                title={loading ? "Đang xử lý..." : "Gửi câu hỏi"}
              >
                {loading ? (
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Dòng chữ bản quyền & liên kết tinh gọn thay thế footer cũ (Phong cách Gemini) */}
            <div className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 flex-wrap">
              <span>Dự án cộng đồng độc lập (phi lợi nhuận)</span>
              <span>•</span>
              <a
                href="https://hotro.k12online.vn"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-sky-500 transition-colors inline-flex items-center gap-0.5"
              >
                <span>Trang hỗ trợ K12Online</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span>•</span>
              <a
                href="https://github.com/thieuhoang2002/K12Online_Chatbot"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-sky-500 transition-colors inline-flex items-center gap-0.5"
              >
                <span>GitHub</span>
                <Github className="w-2.5 h-2.5" />
              </a>
              <span>•</span>
              <span>Trợ lý AI có thể mắc sai sót.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CỬA SỔ ĐĂNG NHẬP / ĐĂNG KÝ MODAL */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
