/**
 * Hybrid Caching Engine: Upstash Redis (Cloud) + RAM Cache (Fallback)
 * Tự động ghi nhớ câu trả lời của các câu hỏi trùng lặp.
 * Khi triển khai trên Vercel, Upstash Redis chia sẻ bộ nhớ đệm cho hàng nghìn người dùng,
 * phản hồi trong 30ms và tiết kiệm 100% token gọi AI.
 */

import { Redis } from "@upstash/redis";

interface CacheEntry {
  reply: string;
  sources: { title: string; category: string; url: string }[];
  timestamp: number;
}

const MAX_CACHE_SIZE = 5000;
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // Lưu cache 7 ngày

class HybridResponseCache {
  private localCache = new Map<string, CacheEntry>();
  private redis: Redis | null = null;

  constructor() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        console.log("🚀 [Cache] Đã kích hoạt Upstash Redis Cloud Cache thành công!");
      } catch (err: any) {
        console.warn("⚠️ [Cache] Không thể khởi tạo Redis, dùng RAM cache:", err.message);
      }
    } else {
      console.log("ℹ️ [Cache] Đang sử dụng RAM Cache (chưa cấu hình biến Upstash Redis).");
    }
  }

  /**
   * Chuẩn hóa câu hỏi: Chuyển chữ thường, bỏ dấu câu thừa, bỏ khoảng trắng dư
   */
  private normalizeKey(model: string, query: string): string {
    const cleanQuery = query
      .toLowerCase()
      .replace(/[?.,!;:"'“”_()[\]{}-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return `k12cache:${model}:${cleanQuery}`;
  }

  public async get(model: string, query: string): Promise<CacheEntry | null> {
    const key = this.normalizeKey(model, query);

    // 1. Thử lấy từ Upstash Redis Cloud trước (nếu có cấu hình)
    if (this.redis) {
      try {
        const cloudData = await this.redis.get<CacheEntry>(key);
        if (cloudData && cloudData.reply) {
          console.log(`⚡ [Redis Cloud Cache] Trúng cache: "${query.slice(0, 35)}..." (Phản hồi ~30ms)`);
          return cloudData;
        }
      } catch (err: any) {
        console.warn("⚠️ [Redis] Lỗi đọc Redis, chuyển sang RAM:", err.message);
      }
    }

    // 2. Dự phòng: Kiểm tra RAM cache nội bộ
    const localEntry = this.localCache.get(key);
    if (localEntry) {
      if (Date.now() - localEntry.timestamp > CACHE_TTL_SECONDS * 1000) {
        this.localCache.delete(key);
        return null;
      }
      console.log(`⚡ [RAM Cache] Trúng cache nội bộ: "${query.slice(0, 35)}..."`);
      return localEntry;
    }

    return null;
  }

  public async set(
    model: string,
    query: string,
    reply: string,
    sources: { title: string; category: string; url: string }[]
  ): Promise<void> {
    const key = this.normalizeKey(model, query);
    const entry: CacheEntry = {
      reply,
      sources,
      timestamp: Date.now(),
    };

    // 1. Lưu vào Upstash Redis (nếu có)
    if (this.redis) {
      try {
        await this.redis.set(key, entry, { ex: CACHE_TTL_SECONDS });
      } catch (err: any) {
        console.warn("⚠️ [Redis] Lỗi ghi Redis:", err.message);
      }
    }

    // 2. Luôn lưu vào RAM cache nội bộ
    if (this.localCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.localCache.keys().next().value;
      if (oldestKey) this.localCache.delete(oldestKey);
    }
    this.localCache.set(key, entry);
  }
}

export const responseCache = new HybridResponseCache();
