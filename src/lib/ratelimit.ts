import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// Bộ nhớ RAM dự phòng nếu Redis tạm thời gặp sự cố
interface MemoryRecord {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, MemoryRecord>();

/**
 * Kiểm tra giới hạn tốc độ (Rate Limit) theo IP.
 * @param ip Địa chỉ IP người dùng
 * @param limit Số lượng request tối đa trong cửa sổ thời gian (mặc định 20)
 * @param windowSeconds Thời gian cửa sổ tính bằng giây (mặc định 60 giây)
 */
export async function checkRateLimit(
  ip: string,
  limit: number = 20,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  const safeIp = ip || "anonymous";
  const key = `ratelimit:chat:${safeIp}`;

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }
      const ttl = await redis.ttl(key);

      if (count > limit) {
        return {
          allowed: false,
          remaining: 0,
          resetInSeconds: ttl > 0 ? ttl : windowSeconds,
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - count),
        resetInSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    } catch (e: any) {
      console.warn("⚠️ [RateLimit] Lỗi Redis, dùng RAM dự phòng:", e.message);
    }
  }

  // RAM Fallback
  const now = Date.now();
  const record = memoryStore.get(safeIp);

  if (!record || now > record.resetAt) {
    memoryStore.set(safeIp, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  record.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  if (record.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
    resetInSeconds,
  };
}

const humanVerifiedStore = new Map<string, number>();

/**
 * Kiểm tra xem IP này đã được xác thực Cloudflare Turnstile gần đây chưa (trong vòng 30 phút)
 */
export async function isIpVerifiedHuman(ip: string): Promise<boolean> {
  const safeIp = ip || "anonymous";
  if (safeIp === "127.0.0.1" || safeIp === "::1" || safeIp === "localhost") {
    return true;
  }
  const key = `turnstile:verified:${safeIp}`;
  if (redis) {
    try {
      const val = await redis.get(key);
      if (val) return true;
    } catch (e) {}
  }
  const exp = humanVerifiedStore.get(safeIp);
  if (exp && exp > Date.now()) return true;
  return false;
}

/**
 * Đánh dấu IP đã vượt qua xác thực Turnstile (mặc định 30 phút = 1800s)
 */
export async function markIpVerifiedHuman(ip: string, ttlSeconds: number = 1800): Promise<void> {
  const safeIp = ip || "anonymous";
  const key = `turnstile:verified:${safeIp}`;
  if (redis) {
    try {
      await redis.set(key, "1", { ex: ttlSeconds });
    } catch (e) {}
  }
  humanVerifiedStore.set(safeIp, Date.now() + ttlSeconds * 1000);
}

