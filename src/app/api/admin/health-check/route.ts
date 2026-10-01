import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/zeroKnowledge";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface KeyHealthResult {
  index: number;
  provider: "gemini" | "openrouter";
  maskedKey: string;
  status: "healthy" | "rate_limited" | "invalid_key" | "not_configured" | "error";
  statusCode?: number;
  latencyMs: number;
  message: string;
  details?: any;
}

interface ServiceHealthResult {
  name: string;
  status: "healthy" | "degraded" | "error" | "not_configured";
  latencyMs: number;
  message: string;
  details?: any;
}

// Hàm kiểm tra 1 Gemini Key cụ thể
async function checkGeminiKey(key: string, idx: number): Promise<KeyHealthResult> {
  const masked = key.length > 12 ? `${key.slice(0, 8)}...${key.slice(-4)}` : `Key-${idx + 1}`;
  const t0 = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      {
        method: "GET",
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - t0;

    if (res.status === 200) {
      const data = await res.json().catch(() => ({}));
      const modelCount = Array.isArray(data.models) ? data.models.length : 0;
      return {
        index: idx + 1,
        provider: "gemini",
        maskedKey: masked,
        status: "healthy",
        statusCode: 200,
        latencyMs,
        message: "Sống khỏe • Sẵn sàng tạo sinh (200 OK)",
        details: { modelCount, primaryModel: "gemini-2.5-flash" },
      };
    } else if (res.status === 429) {
      return {
        index: idx + 1,
        provider: "gemini",
        maskedKey: masked,
        status: "rate_limited",
        statusCode: 429,
        latencyMs,
        message: "Chạm trần hạn mức (429 Quota Exceeded)",
      };
    } else if (res.status === 400 || res.status === 403) {
      return {
        index: idx + 1,
        provider: "gemini",
        maskedKey: masked,
        status: "invalid_key",
        statusCode: res.status,
        latencyMs,
        message: "Key không hợp lệ hoặc đã bị khóa",
      };
    } else {
      return {
        index: idx + 1,
        provider: "gemini",
        maskedKey: masked,
        status: "error",
        statusCode: res.status,
        latencyMs,
        message: `Phản hồi mã HTTP ${res.status}`,
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      index: idx + 1,
      provider: "gemini",
      maskedKey: masked,
      status: "error",
      latencyMs: Date.now() - t0,
      message: err.name === "AbortError" ? "Hết thời gian chờ (Timeout > 6s)" : err.message,
    };
  }
}

// Hàm kiểm tra 1 OpenRouter Key cụ thể
async function checkOpenRouterKey(key: string, idx: number): Promise<KeyHealthResult> {
  const masked = key.length > 14 ? `${key.slice(0, 10)}...${key.slice(-4)}` : `Key-${idx + 1}`;
  const t0 = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - t0;

    if (res.status === 200) {
      const json = await res.json().catch(() => ({}));
      const keyData = json.data || {};
      const isFree = Boolean(keyData.is_free_tier);
      const usage = typeof keyData.usage === "number" ? keyData.usage.toFixed(4) : "0";
      const limit = keyData.limit ?? "Không giới hạn";

      return {
        index: idx + 1,
        provider: "openrouter",
        maskedKey: masked,
        status: "healthy",
        statusCode: 200,
        latencyMs,
        message: "Sống khỏe • Dự phòng trực chiến (200 OK)",
        details: {
          label: keyData.label || `Pool Key #${idx + 1}`,
          usage: `$${usage}`,
          limit: limit === "Không giới hạn" ? limit : `$${limit}`,
          isFreeTier: isFree,
          rateLimit: keyData.rate_limit || null,
        },
      };
    } else if (res.status === 429) {
      return {
        index: idx + 1,
        provider: "openrouter",
        maskedKey: masked,
        status: "rate_limited",
        statusCode: 429,
        latencyMs,
        message: "Chạm giới hạn tần suất OpenRouter (429 Rate Limit)",
      };
    } else if (res.status === 401) {
      return {
        index: idx + 1,
        provider: "openrouter",
        maskedKey: masked,
        status: "invalid_key",
        statusCode: 401,
        latencyMs,
        message: "Key hết hạn hoặc không hợp lệ (401 Unauthorized)",
      };
    } else {
      return {
        index: idx + 1,
        provider: "openrouter",
        maskedKey: masked,
        status: "error",
        statusCode: res.status,
        latencyMs,
        message: `Phản hồi mã HTTP ${res.status}`,
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      index: idx + 1,
      provider: "openrouter",
      maskedKey: masked,
      status: "error",
      latencyMs: Date.now() - t0,
      message: err.name === "AbortError" ? "Hết thời gian chờ (Timeout > 6s)" : err.message,
    };
  }
}

// Hàm kiểm tra Upstash Redis
async function checkRedis(): Promise<ServiceHealthResult> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return {
      name: "Upstash Redis Cloud Cache",
      status: "not_configured",
      latencyMs: 0,
      message: "Chưa cấu hình biến UPSTASH_REDIS_REST_URL",
    };
  }

  const t0 = Date.now();
  try {
    const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });
    const latencyMs = Date.now() - t0;
    const data = await res.json().catch(() => ({}));
    if (data.result === "PONG") {
      return {
        name: "Upstash Redis Cloud Cache",
        status: "healthy",
        latencyMs,
        message: `Kết nối siêu tốc (${latencyMs}ms) • Cache 7 ngày & Rate Limit sẵn sàng`,
        details: { ping: "PONG" },
      };
    } else {
      return {
        name: "Upstash Redis Cloud Cache",
        status: "degraded",
        latencyMs,
        message: "Redis phản hồi không chuẩn",
        details: data,
      };
    }
  } catch (err: any) {
    return {
      name: "Upstash Redis Cloud Cache",
      status: "error",
      latencyMs: Date.now() - t0,
      message: "Lỗi kết nối Redis: " + err.message,
    };
  }
}

// Hàm kiểm tra Telegram
async function checkTelegram(): Promise<ServiceHealthResult> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return {
      name: "Telegram Bot Alert Webhook",
      status: "not_configured",
      latencyMs: 0,
      message: "Chưa cấu hình TELEGRAM_BOT_TOKEN",
    };
  }

  const t0 = Date.now();
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
    );
    const latencyMs = Date.now() - t0;
    const data = await res.json().catch(() => ({}));
    if (data.ok && data.result?.username) {
      return {
        name: "Telegram Bot Alert Webhook",
        status: "healthy",
        latencyMs,
        message: `Bot @${data.result.username} trực chiến 24/7`,
        details: {
          botName: data.result.first_name,
          username: `@${data.result.username}`,
          targetChatId: process.env.TELEGRAM_CHAT_ID ? "Đã cấu hình" : "Chưa có Chat ID",
        },
      };
    } else {
      return {
        name: "Telegram Bot Alert Webhook",
        status: "error",
        latencyMs,
        message: "Token Telegram không hợp lệ hoặc bị thu hồi",
      };
    }
  } catch (err: any) {
    return {
      name: "Telegram Bot Alert Webhook",
      status: "error",
      latencyMs: Date.now() - t0,
      message: "Lỗi kết nối Telegram: " + err.message,
    };
  }
}

// Hàm kiểm tra Supabase
async function checkSupabase(): Promise<ServiceHealthResult> {
  if (!supabase) {
    return {
      name: "Supabase PostgreSQL Database",
      status: "not_configured",
      latencyMs: 0,
      message: "Chưa cấu hình Supabase URL hoặc Anon Key",
    };
  }

  const t0 = Date.now();
  try {
    const { count, error } = await supabase
      .from("chat_sessions")
      .select("*", { count: "exact", head: true });
    const latencyMs = Date.now() - t0;

    if (!error) {
      return {
        name: "Supabase PostgreSQL Database",
        status: "healthy",
        latencyMs,
        message: `Đồng bộ Cloud thông suốt (${latencyMs}ms) • ${count ?? 0} phiên chat`,
        details: { totalSessions: count ?? 0 },
      };
    } else {
      return {
        name: "Supabase PostgreSQL Database",
        status: "degraded",
        latencyMs,
        message: `Lỗi truy vấn bảng: ${error.message}`,
      };
    }
  } catch (err: any) {
    return {
      name: "Supabase PostgreSQL Database",
      status: "error",
      latencyMs: Date.now() - t0,
      message: "Lỗi kết nối Supabase: " + err.message,
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();
    const provider = searchParams.get("provider")?.toLowerCase().trim();
    const indexParam = searchParams.get("index");
    const targetIndex = indexParam ? parseInt(indexParam, 10) : undefined;

    if (!email || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Truy cập bị từ chối: Yêu cầu quyền Quản trị viên" },
        { status: 403 }
      );
    }

    // 1. Phân giải danh sách Gemini Keys với tất cả các tên biến môi trường có thể có
    const geminiRaw =
      process.env.GEMINI_API_KEYS ||
      process.env.GEMINI_API_KEY ||
      process.env.GEMINI_KEY ||
      process.env.GEMINI_KEYS ||
      process.env.GOOGLE_GEMINI_API_KEYS ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";
    const geminiKeys = geminiRaw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    // 2. Phân giải danh sách OpenRouter Keys
    const openrouterRaw =
      process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || "";
    const openrouterKeys = openrouterRaw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    // XỬ LÝ 1: KIỂM TRA ĐƠN LẺ TỪNG KEY HOẶC DỊCH VỤ (ON-DEMAND SINGLE CHECK)
    if (provider) {
      if (provider === "gemini") {
        if (geminiKeys.length === 0) {
          return NextResponse.json({
            success: true,
            keyResult: {
              index: 1,
              provider: "gemini",
              maskedKey: "Chưa cấu hình",
              status: "not_configured",
              latencyMs: 0,
              message: "Chưa cấu hình biến GEMINI_API_KEYS trong mục Environment Variables trên Vercel.",
            },
          });
        }
        const idx = targetIndex ? Math.max(0, targetIndex - 1) : 0;
        const keyToTest = geminiKeys[idx] || geminiKeys[0];
        const keyResult = await checkGeminiKey(keyToTest, idx);
        return NextResponse.json({ success: true, keyResult });
      }

      if (provider === "openrouter") {
        if (openrouterKeys.length === 0) {
          return NextResponse.json({
            success: true,
            keyResult: {
              index: 1,
              provider: "openrouter",
              maskedKey: "Chưa cấu hình",
              status: "not_configured",
              latencyMs: 0,
              message: "Chưa cấu hình biến OPENROUTER_API_KEYS trên Vercel.",
            },
          });
        }
        const idx = targetIndex ? Math.max(0, targetIndex - 1) : 0;
        const keyToTest = openrouterKeys[idx] || openrouterKeys[0];
        const keyResult = await checkOpenRouterKey(keyToTest, idx);
        return NextResponse.json({ success: true, keyResult });
      }

      if (provider === "redis") {
        const serviceResult = await checkRedis();
        return NextResponse.json({ success: true, serviceResult });
      }

      if (provider === "telegram") {
        const serviceResult = await checkTelegram();
        return NextResponse.json({ success: true, serviceResult });
      }

      if (provider === "supabase") {
        const serviceResult = await checkSupabase();
        return NextResponse.json({ success: true, serviceResult });
      }
    }

    // XỬ LÝ 2: KIỂM TRA TOÀN BỘ HỆ THỐNG (FULL CHECK)
    const startTime = Date.now();

    // Kiểm tra Gemini Keys (Nếu rỗng thì trả về thông báo hướng dẫn thay vì mảng trống)
    let geminiResults: KeyHealthResult[] = [];
    if (geminiKeys.length > 0) {
      geminiResults = await Promise.all(
        geminiKeys.map((key, idx) => checkGeminiKey(key, idx))
      );
    } else {
      geminiResults = [
        {
          index: 1,
          provider: "gemini",
          maskedKey: "Chưa cấu hình trên Vercel",
          status: "not_configured",
          latencyMs: 0,
          message: "Chưa phát hiện biến GEMINI_API_KEYS. Vui lòng thêm biến vào Vercel Settings > Environment Variables.",
        },
      ];
    }

    // Kiểm tra OpenRouter Keys
    let openrouterResults: KeyHealthResult[] = [];
    if (openrouterKeys.length > 0) {
      openrouterResults = await Promise.all(
        openrouterKeys.map((key, idx) => checkOpenRouterKey(key, idx))
      );
    } else {
      openrouterResults = [
        {
          index: 1,
          provider: "openrouter",
          maskedKey: "Chưa cấu hình",
          status: "not_configured",
          latencyMs: 0,
          message: "Chưa cấu hình biến OPENROUTER_API_KEYS.",
        },
      ];
    }

    // Kiểm tra các dịch vụ đám mây
    const [redisResult, telegramResult, supabaseResult] = await Promise.all([
      checkRedis(),
      checkTelegram(),
      checkSupabase(),
    ]);

    // Tổng hợp KPI
    const allKeyResults = [...geminiResults, ...openrouterResults];
    const healthyKeyCount = allKeyResults.filter((k) => k.status === "healthy").length;
    const rateLimitedKeyCount = allKeyResults.filter((k) => k.status === "rate_limited").length;
    const invalidKeyCount = allKeyResults.filter(
      (k) => k.status === "invalid_key" || k.status === "error"
    ).length;

    const totalDurationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalDurationMs,
      summary: {
        totalKeys: allKeyResults.filter((k) => k.status !== "not_configured").length,
        healthyKeys: healthyKeyCount,
        rateLimitedKeys: rateLimitedKeyCount,
        invalidKeys: invalidKeyCount,
        allHealthy: rateLimitedKeyCount === 0 && invalidKeyCount === 0,
        geminiCount: geminiKeys.length,
        openrouterCount: openrouterKeys.length,
      },
      gemini: geminiResults,
      openrouter: openrouterResults,
      infrastructure: {
        redis: redisResult,
        telegram: telegramResult,
        supabase: supabaseResult,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi thực thi kiểm tra sức khỏe hệ thống: " + err.message },
      { status: 500 }
    );
  }
}
