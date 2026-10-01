import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/zeroKnowledge";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface KeyHealthResult {
  index: number;
  provider: "gemini" | "openrouter";
  maskedKey: string;
  status: "healthy" | "rate_limited" | "invalid_key" | "error";
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

    const startTime = Date.now();

    // 1. Kiểm tra từng Google Gemini API Key
    const geminiRaw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    const geminiKeys = geminiRaw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const geminiResults: KeyHealthResult[] = await Promise.all(
      geminiKeys.map(async (key, idx) => {
        const masked =
          key.length > 12 ? `${key.slice(0, 8)}...${key.slice(-4)}` : `Key-${idx + 1}`;
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
      })
    );

    // 2. Kiểm tra từng OpenRouter API Key
    const openrouterRaw =
      process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || "";
    const openrouterKeys = openrouterRaw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const openrouterResults: KeyHealthResult[] = await Promise.all(
      openrouterKeys.map(async (key, idx) => {
        const masked =
          key.length > 14 ? `${key.slice(0, 10)}...${key.slice(-4)}` : `Key-${idx + 1}`;
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
      })
    );

    // 3. Kiểm tra Upstash Redis Cloud
    let redisResult: ServiceHealthResult = {
      name: "Upstash Redis Cloud Cache",
      status: "not_configured",
      latencyMs: 0,
      message: "Chưa cấu hình biến UPSTASH_REDIS_REST_URL",
    };

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
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
          redisResult = {
            name: "Upstash Redis Cloud Cache",
            status: "healthy",
            latencyMs,
            message: `Kết nối siêu tốc (${latencyMs}ms) • Cache 7 ngày & Rate Limit sẵn sàng`,
            details: { ping: "PONG" },
          };
        } else {
          redisResult = {
            name: "Upstash Redis Cloud Cache",
            status: "degraded",
            latencyMs,
            message: "Redis phản hồi không chuẩn",
            details: data,
          };
        }
      } catch (err: any) {
        redisResult = {
          name: "Upstash Redis Cloud Cache",
          status: "error",
          latencyMs: Date.now() - t0,
          message: "Lỗi kết nối Redis: " + err.message,
        };
      }
    }

    // 4. Kiểm tra Telegram Bot Webhook
    let telegramResult: ServiceHealthResult = {
      name: "Telegram Bot Alert Webhook",
      status: "not_configured",
      latencyMs: 0,
      message: "Chưa cấu hình TELEGRAM_BOT_TOKEN",
    };

    if (process.env.TELEGRAM_BOT_TOKEN) {
      const t0 = Date.now();
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
        );
        const latencyMs = Date.now() - t0;
        const data = await res.json().catch(() => ({}));
        if (data.ok && data.result?.username) {
          telegramResult = {
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
          telegramResult = {
            name: "Telegram Bot Alert Webhook",
            status: "error",
            latencyMs,
            message: "Token Telegram không hợp lệ hoặc bị thu hồi",
          };
        }
      } catch (err: any) {
        telegramResult = {
          name: "Telegram Bot Alert Webhook",
          status: "error",
          latencyMs: Date.now() - t0,
          message: "Lỗi kết nối Telegram: " + err.message,
        };
      }
    }

    // 5. Kiểm tra Supabase PostgreSQL
    let supabaseResult: ServiceHealthResult = {
      name: "Supabase PostgreSQL Database",
      status: "not_configured",
      latencyMs: 0,
      message: "Chưa cấu hình Supabase URL hoặc Anon Key",
    };

    if (supabase) {
      const t0 = Date.now();
      try {
        const { count, error } = await supabase
          .from("chat_sessions")
          .select("*", { count: "exact", head: true });
        const latencyMs = Date.now() - t0;

        if (!error) {
          supabaseResult = {
            name: "Supabase PostgreSQL Database",
            status: "healthy",
            latencyMs,
            message: `Đồng bộ Cloud thông suốt (${latencyMs}ms) • ${count ?? 0} phiên chat`,
            details: { totalSessions: count ?? 0 },
          };
        } else {
          supabaseResult = {
            name: "Supabase PostgreSQL Database",
            status: "degraded",
            latencyMs,
            message: `Lỗi truy vấn bảng: ${error.message}`,
          };
        }
      } catch (err: any) {
        supabaseResult = {
          name: "Supabase PostgreSQL Database",
          status: "error",
          latencyMs: Date.now() - t0,
          message: "Lỗi kết nối Supabase: " + err.message,
        };
      }
    }

    // 6. Tổng hợp KPI Sức Khỏe
    const allKeyResults = [...geminiResults, ...openrouterResults];
    const healthyKeyCount = allKeyResults.filter((k) => k.status === "healthy").length;
    const rateLimitedKeyCount = allKeyResults.filter((k) => k.status === "rate_limited").length;
    const invalidKeyCount = allKeyResults.filter((k) => k.status === "invalid_key" || k.status === "error").length;

    const totalDurationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalDurationMs,
      summary: {
        totalKeys: allKeyResults.length,
        healthyKeys: healthyKeyCount,
        rateLimitedKeys: rateLimitedKeyCount,
        invalidKeys: invalidKeyCount,
        allHealthy: rateLimitedKeyCount === 0 && invalidKeyCount === 0,
        geminiCount: geminiResults.length,
        openrouterCount: openrouterResults.length,
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
