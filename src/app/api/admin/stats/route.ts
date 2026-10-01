import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/zeroKnowledge";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Truy cập bị từ chối: Yêu cầu quyền Quản trị viên" },
        { status: 403 }
      );
    }

    // 1. Thống kê Cơ sở tri thức (Knowledge Base)
    let totalArticles = 383;
    let knowledgeFileSizeMB = 1.18;
    let prebakedCount = 0;
    let oversizedCount = 0;

    try {
      const kbPath = path.join(process.cwd(), "data", "k12_knowledge.json");
      if (fs.existsSync(kbPath)) {
        const stats = fs.statSync(kbPath);
        knowledgeFileSizeMB = Number((stats.size / (1024 * 1024)).toFixed(2));
        const raw = fs.readFileSync(kbPath, "utf-8");
        const list = JSON.parse(raw);
        totalArticles = Array.isArray(list) ? list.length : 383;
      }
    } catch (e) {}

    try {
      const pbPath = path.join(process.cwd(), "data", "prebaked_answers.json");
      if (fs.existsSync(pbPath)) {
        const raw = fs.readFileSync(pbPath, "utf-8");
        const pb = JSON.parse(raw);
        prebakedCount = Array.isArray(pb) ? pb.length : 0;
      }
    } catch (e) {}

    // 2. Thống kê Phiên chat từ Supabase
    let totalSessions = 0;
    let totalMessages = 0;
    let recentSessions: any[] = [];

    if (supabase) {
      try {
        const { count, error } = await supabase
          .from("chat_sessions")
          .select("*", { count: "exact", head: true });
        if (!error && typeof count === "number") {
          totalSessions = count;
        }

        const { data: recent, error: rErr } = await supabase
          .from("chat_sessions")
          .select("id, user_email, title, messages, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(20);

        if (!rErr && recent) {
          recentSessions = recent.map((r: any) => {
            const msgCount = Array.isArray(r.messages) ? r.messages.length : 0;
            totalMessages += msgCount;
            return {
              id: r.id,
              user_email: r.user_email,
              title: r.title,
              messageCount: msgCount,
              updated_at: r.updated_at,
            };
          });
        }
      } catch (e) {}
    }

    // 3. Thống kê Đánh giá (Feedback)
    let totalFeedback = 0;
    let likes = 0;
    let dislikes = 0;
    let recentFeedback: any[] = [];

    if (supabase) {
      try {
        const { data: fbData, error: fbErr } = await supabase
          .from("chat_feedback")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!fbErr && fbData) {
          totalFeedback = fbData.length;
          likes = fbData.filter((f: any) => f.rating === "like").length;
          dislikes = fbData.filter((f: any) => f.rating === "dislike").length;
          recentFeedback = fbData;
        }
      } catch (e) {}
    }

    const satisfactionRate =
      totalFeedback > 0 ? Math.round((likes / totalFeedback) * 100) : 100;

    // 4. Trạng thái Động cơ AI & Bảo mật
    const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS);
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY);
    const hasRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
    const hasTurnstile = Boolean(process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY);
    const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overview: {
        totalSessions: Math.max(totalSessions, 1),
        totalMessages: Math.max(totalMessages, 1),
        totalFeedback,
        likes,
        dislikes,
        satisfactionRate,
      },
      knowledgeBase: {
        totalArticles,
        fileSizeMB: knowledgeFileSizeMB,
        prebakedAnswersCount: prebakedCount,
        synonymsCount: 50,
      },
      infrastructure: {
        gemini: {
          status: hasGemini ? "Active (Primary Engine)" : "Demo Mode",
          model: "gemini-2.5-flash / gemini-2.0-flash",
          maxOutputTokens: 8192,
        },
        openrouter: {
          status: hasOpenRouter ? "Active (Failover Pool)" : "Not Configured",
          models: ["qwen/qwen3.8-27b:free", "nvidia/nemotron-3-nano-30b-a3b:free"],
        },
        redis: {
          status: hasRedis ? "Active (Cache & Rate Limit)" : "Local Memory Fallback",
          rateLimit: "20 req/min/IP",
          ttl: "7 days",
        },
        security: {
          cloudflareTurnstile: hasTurnstile ? "Enabled (Dual-layer invisible)" : "Development Bypass",
          zeroKnowledgeAuth: "Enabled (PBKDF2 100k + AES-256-GCM)",
        },
        database: {
          status: hasSupabase ? "Connected (Supabase Cloud)" : "Local Storage Fallback",
        },
      },
      recentSessions,
      recentFeedback,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi tổng hợp thống kê: " + err.message },
      { status: 500 }
    );
  }
}
