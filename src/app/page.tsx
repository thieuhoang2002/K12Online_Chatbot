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
  "Làm sao để nhập câu hỏi trắc nghiệm từ file Word dạng ABCD?",
  "Học sinh làm bài thi trực tuyến trên K12Online cần lưu ý những gì?",
  "Hướng dẫn phụ huynh và học sinh nộp bài tập về nhà trên K12Connect",
  "Cách nhà trường cấu hình phân công giám thị và quản lý vi phạm",
];

// Bộ nhớ đệm Client-side lưu câu trả lời ngay trên trình duyệt (phản hồi 0.01 giây khi hỏi lại)
const clientCache = new Map<string, { reply: string; sources: any; followUps?: string[] }>();

const AVAILABLE_MODELS = [
  { id: "qwen/qwen3.8-27b:free", name: "Qwen 3.8 27B (Phản hồi siêu tốc ~1.9s - Khuyên dùng)", badge: "Siêu tốc" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "NVIDIA Nemotron 3 Ultra (550B - Siêu chi tiết)", badge: "Chi tiết" },
  { id: "google/gemma-4-31b-it:free", name: "Google Gemma 4 31B (Open-weight - Free)", badge: "Dự phòng" },
];

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);

  // Theme & Layout state
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals & User state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const defaultSession: ChatSession = {
        id: "chat_" + Date.now(),
        title: "Cuộc trò chuyện mới",
        messages: [
          {
            role: "assistant",
            content:
              "Xin chào bạn! Mình là Trợ lý AI hỗ trợ nghiệp vụ K12Online.\n\nBạn có thể hỏi mình bất kỳ vấn đề gì về: nhập đề thi từ Word, làm bài trực tuyến, quản lý bài tập K12Connect, điểm danh, xếp thời khóa biểu... Mình sẽ hướng dẫn từng bước chi tiết nhất nhé!",
          },
        ],
        createdAt: Date.now(),
      };
      setSessions([defaultSession]);
      setCurrentSessionId(defaultSession.id);
    }

    // 3. User email
    const savedUser = localStorage.getItem("k12_user_email");
    if (savedUser) setUserEmail(savedUser);
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
        console.log(`☁️ [Supabase] Đã tải ${cloudSessions.length} phiên chat từ đám mây!`);
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
    setSessions(remaining);
    if (remaining.length > 0) {
      if (currentSessionId === sessionId) {
        setCurrentSessionId(remaining[0].id);
      }
    } else {
      createNewChat();
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, currentSessionId, loading]);

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
            "Xin chào bạn! Mình là Trợ lý AI hỗ trợ nghiệp vụ K12Online.\n\nBạn có thể hỏi mình bất kỳ vấn đề gì về: nhập đề thi từ Word, làm bài trực tuyến, quản lý bài tập K12Connect, điểm danh, xếp thời khóa biểu... Mình sẽ hướng dẫn từng bước chi tiết nhất nhé!",
        },
      ],
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

    // Đảm bảo luôn có 1 phiên chat hợp lệ
    let targetSessionId = currentSession?.id;
    let baseMessages = messages;

    if (!targetSessionId) {
      targetSessionId = "chat_" + Date.now();
      const fallbackSession: ChatSession = {
        id: targetSessionId,
        title: query.slice(0, 30) + "...",
        messages: [],
        createdAt: Date.now(),
      };
      setSessions([fallbackSession]);
      setCurrentSessionId(targetSessionId);
      baseMessages = [];
    }

    // Cập nhật câu hỏi của người dùng
    const userMsg: Message = { role: "user", content: query };
    const updatedMessages = [...baseMessages, userMsg];

    // KIỂM TRA BỘ NHỚ ĐỆM TỨC THÌ TRÊN TRÌNH DUYỆT (0 GIÂY)
    const normalizedKey = query.toLowerCase();
    const cachedResponse = clientCache.get(normalizedKey);
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
              title: s.messages.length <= 1 ? query.slice(0, 30) + "..." : s.title,
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

    // Hiển thị tin nhắn người dùng và bật trạng thái tải
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === targetSessionId) {
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
          turnstileToken: turnstileToken,
        }),
      });

      if (!res.ok) {
        let errorMsgText = "Không thể kết nối đến máy chủ AI.";
        try {
          const errData = await res.json();
          if (errData.error) errorMsgText = errData.error;
        } catch (e) {}
        throw new Error(errorMsgText);
      }

      // Tạo trước tin nhắn bot rỗng để đón streaming
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
              messages: [...updatedMessages, initialBotMsg],
            };
          }
          return s;
        })
      );

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
                } else if (parsed.type === "chunk") {
                  streamedReply += parsed.text;
                  hasUpdated = true;
                } else if (parsed.type === "followUps") {
                  streamedFollowUps = parsed.prompts || [];
                  hasUpdated = true;
                } else if (parsed.type === "error") {
                  throw new Error(parsed.error);
                }
              } catch (e) {}
            }
          }

          if (hasUpdated) {
            setLoading(false);
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
                      followUps: streamedFollowUps.length > 0 ? streamedFollowUps : undefined,
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

      // Lưu câu trả lời vào Client Cache để lần sau hỏi lại phản hồi trong 0.01 giây
      clientCache.set(normalizedKey, {
        reply: streamedReply,
        sources: streamedSources,
        followUps: streamedFollowUps.length > 0 ? streamedFollowUps : undefined,
      });

      // ĐỒNG BỘ LÊN SUPABASE
      if (userEmail) {
        syncSessionToSupabase(targetSessionId, [
          ...updatedMessages,
          {
            role: "assistant",
            content: streamedReply,
            sources: streamedSources,
            followUps: streamedFollowUps.length > 0 ? streamedFollowUps : undefined,
          },
        ]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        role: "assistant",
        content: `Hệ thống đang gặp gián đoạn tạm thời: ${err.message}. Bạn vui lòng thử lại sau giây lát nhé.`,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === targetSessionId ? { ...s, messages: [...updatedMessages, errorMsg] } : s
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

  const isDarkMode = theme === "dark";

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-800"
      }`}
    >
      {/* SIDEBAR LỊCH SỬ CHAT: CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP */}
      {userEmail && isSidebarOpen && (
        <aside
          className={`w-72 flex flex-col shrink-0 border-r transition-colors duration-200 ${
            isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          {/* Header Sidebar */}
          <div
            className={`p-4 border-b flex items-center justify-between ${
              isDarkMode ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-sky-600 to-indigo-500 rounded-xl shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2
                  className={`text-sm font-bold tracking-tight ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  K12Online AI
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                  Phi Lợi Nhuận
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition`}
              title="Đóng sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nút Tạo Hội Thoại Mới */}
          <div className="p-3">
            <button
              onClick={createNewChat}
              className={`w-full py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition shadow-sm border ${
                isDarkMode
                  ? "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/60 text-slate-200"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <Plus className="w-4 h-4 text-sky-500" />
              Đoạn chat mới
            </button>
          </div>

          {/* Danh sách các đoạn chat */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Lịch sử tra cứu của bạn
            </div>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`group w-full p-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                  s.id === currentSessionId
                    ? isDarkMode
                      ? "bg-sky-600/15 text-sky-300 font-medium border border-sky-500/30"
                      : "bg-sky-50 text-sky-700 font-semibold border border-sky-200"
                    : isDarkMode
                    ? "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{s.title}</span>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(s.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition"
                    title="Xóa cuộc trò chuyện này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer Sidebar: User Profile & Logout */}
          <div
            className={`p-3 border-t text-xs ${
              isDarkMode
                ? "border-slate-800 bg-slate-900/60"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div
              className={`flex items-center justify-between p-2 rounded-lg ${
                isDarkMode ? "bg-slate-800/50" : "bg-white border border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center font-bold text-white text-xs">
                  {userEmail[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <div
                    className={`font-medium truncate ${
                      isDarkMode ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    {userEmail}
                  </div>
                  <div className="text-[10px] text-emerald-500">Đã đồng bộ lịch sử</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1 hover:text-rose-500 text-slate-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* KHUNG NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP BAR */}
        <header
          className={`h-14 border-b px-4 md:px-6 flex items-center justify-between backdrop-blur-md transition-colors duration-200 ${
            isDarkMode
              ? "bg-slate-900/60 border-slate-800/80"
              : "bg-white/90 border-slate-200 shadow-xs"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Nút mở sidebar nếu đã đăng nhập và đang đóng */}
            {userEmail && !isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-600 dark:hover:text-white transition ${
                  isDarkMode ? "border-slate-800 bg-slate-800/50" : "border-slate-200 bg-white"
                }`}
                title="Mở lịch sử chat"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {/* Logo thu nhỏ khi ở chế độ khách */}
            {!userEmail && (
              <div className="p-1.5 bg-gradient-to-tr from-sky-600 to-indigo-500 rounded-lg shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-semibold flex items-center gap-1.5 ${
                  isDarkMode ? "text-slate-200" : "text-slate-800"
                }`}
              >
                <BookOpen className="w-4 h-4 text-sky-500" />
                <span>Chatbot hỗ trợ K12Online</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                Phi Lợi Nhuận
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Nút Đoạn chat mới (luôn tiện lợi ở topbar) */}
            <button
              onClick={createNewChat}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition ${
                isDarkMode
                  ? "bg-slate-800/60 hover:bg-slate-700/60 border-slate-700/60 text-slate-300"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              }`}
              title="Tạo cuộc hội thoại mới"
            >
              <Plus className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden md:inline">Đoạn chat mới</span>
            </button>

            {/* Nút chuyển đổi Chế độ Sáng / Tối */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition ${
                isDarkMode
                  ? "bg-slate-800/60 hover:bg-slate-700/60 border-slate-700/60 text-amber-300"
                  : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
              }`}
              title={isDarkMode ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Xác minh Cloudflare */}
            <CloudflareTurnstile onVerify={handleTurnstileVerify} />

            {/* Nút Đăng nhập cho Chế độ khách */}
            {!userEmail ? (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-full text-xs font-semibold shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className={`p-1.5 rounded-full border text-slate-400 hover:text-rose-500 transition ${
                  isDarkMode ? "border-slate-800 bg-slate-800/40" : "border-slate-200 bg-white"
                }`}
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
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
                className={`relative group max-w-[85%] rounded-2xl p-4 transition-colors ${
                  m.role === "user"
                    ? "bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/20"
                    : isDarkMode
                    ? "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-sm"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm"
                }`}
              >
                {/* Nút copy câu trả lời */}
                {m.role === "assistant" && (
                  <button
                    onClick={() => copyToClipboard(m.content, idx)}
                    title="Sao chép nội dung"
                    className={`absolute top-3 right-3 p-1 rounded-md transition opacity-0 group-hover:opacity-100 ${
                      isDarkMode
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {m.role === "assistant" ? (
                  <MarkdownRenderer content={m.content} isDarkMode={isDarkMode} />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed">
                    {m.content}
                  </div>
                )}

                {/* Danh sách nguồn tham khảo trích dẫn */}
                {m.sources && m.sources.length > 0 && (
                  <div
                    className={`mt-3.5 pt-3 border-t text-xs ${
                      isDarkMode ? "border-slate-800/80" : "border-slate-100"
                    }`}
                  >
                    <div className="font-semibold text-sky-500 flex items-center gap-1 mb-1.5">
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
                              ? "bg-slate-800 hover:bg-slate-700/80 border-slate-700/50 text-slate-300 hover:text-sky-300"
                              : "bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 hover:text-sky-600"
                          }`}
                        >
                          <span className="truncate max-w-[220px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gợi ý câu hỏi liên quan tiếp theo (Follow-up Prompts) */}
                {m.role === "assistant" && m.followUps && m.followUps.length > 0 && !loading && (
                  <div
                    className={`mt-3 pt-3 border-t text-xs ${
                      isDarkMode ? "border-slate-800/80" : "border-slate-100"
                    }`}
                  >
                    <div className="font-semibold text-slate-400 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Câu hỏi gợi ý liên quan:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.followUps.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(prompt)}
                          className={`text-left inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition border group/btn ${
                            isDarkMode
                              ? "bg-slate-800/80 hover:bg-sky-950/60 border-slate-700/60 hover:border-sky-500/50 text-slate-300 hover:text-sky-300"
                              : "bg-slate-50 hover:bg-sky-50 border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700"
                          }`}
                        >
                          <span className="text-sky-500 group-hover/btn:translate-x-0.5 transition-transform font-bold">→</span>
                          <span>{prompt}</span>
                        </button>
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
              <div
                className={`p-4 border rounded-2xl rounded-tl-none flex items-center gap-2 text-xs ${
                  isDarkMode
                    ? "bg-slate-900 border-slate-800 text-slate-400"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></div>
                Đang tra cứu cơ sở tri thức K12Online và soạn thảo câu trả lời...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* GỢI Ý CÂU HỎI THƯỜNG GẶP */}
        <div
          className={`px-4 md:px-6 py-2 border-t transition-colors ${
            isDarkMode ? "bg-slate-950/80 border-slate-800/40" : "bg-slate-50/80 border-slate-200"
          }`}
        >
          <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto pb-1 text-xs">
            <span
              className={`whitespace-nowrap self-center font-medium flex items-center gap-1 ${
                isDarkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Bạn có thể hỏi:
            </span>
            {QUICK_PROMPTS.map((q, qIdx) => (
              <button
                key={qIdx}
                onClick={() => handleSendMessage(q)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition text-[11.5px] border ${
                  isDarkMode
                    ? "bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800"
                    : "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 shadow-xs"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* KHUNG NHẬP LIỆU FOOTER */}
        <div
          className={`p-4 md:p-6 border-t transition-colors ${
            isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="max-w-4xl mx-auto space-y-2">
            <div
              className={`relative flex items-center border focus-within:border-sky-500 rounded-2xl shadow-inner transition p-1 ${
                isDarkMode
                  ? "bg-slate-800/90 border-slate-700/80"
                  : "bg-slate-50 border-slate-300 focus-within:bg-white"
              }`}
            >
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
                placeholder="Bạn hãy nhập câu hỏi vào đây (Ví dụ: Cách duyệt bài tập về nhà trên K12Connect?)..."
                className={`flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none resize-none max-h-32 ${
                  isDarkMode
                    ? "text-slate-100 placeholder-slate-400"
                    : "text-slate-900 placeholder-slate-400"
                }`}
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
            <div
              className={`flex items-center justify-center text-[11px] px-1 gap-1 text-center ${
                isDarkMode ? "text-slate-500" : "text-slate-500"
              }`}
            >
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Dự án phi lợi nhuận độc lập của cộng đồng giáo dục. Không thuộc sở hữu chính thức của Tập đoàn Viettel.
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
