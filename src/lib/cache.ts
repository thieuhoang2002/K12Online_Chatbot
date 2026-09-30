/**
 * In-Memory Response Caching Engine (RAM Cache)
 * Tự động ghi nhớ câu trả lời của các câu hỏi trùng lặp, phản hồi tức thì trong 1ms
 * và tiết kiệm 100% token gọi AI.
 */

interface CacheEntry {
  reply: string;
  sources: { title: string; category: string; url: string }[];
  timestamp: number;
}

const MAX_CACHE_SIZE = 5000; // Giới hạn tối đa 5.000 câu hỏi trong RAM (~5-8 MB)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Thời gian sống của cache: 24 giờ

class ResponseCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Chuẩn hóa câu hỏi: Chuyển chữ thường, bỏ dấu câu thừa, bỏ khoảng trắng dư
   * Ví dụ: "Cách nộp bài K12Connect???" và "cách nộp bài k12connect" sẽ ra cùng 1 key
   */
  private normalizeKey(model: string, query: string): string {
    const cleanQuery = query
      .toLowerCase()
      .replace(/[?.,!;:"'“”_()[\]{}-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return `${model}:::${cleanQuery}`;
  }

  public get(model: string, query: string): CacheEntry | null {
    const key = this.normalizeKey(model, query);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Kiểm tra hết hạn (TTL)
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    console.log(`⚡ [RAM Cache] Khớp câu hỏi đã có sẵn trong bộ nhớ: "${query.slice(0, 40)}..." (Phản hồi tức thì 1ms)`);
    return entry;
  }

  public set(
    model: string,
    query: string,
    reply: string,
    sources: { title: string; category: string; url: string }[]
  ): void {
    const key = this.normalizeKey(model, query);

    // Nếu bộ nhớ đầy, xóa phần tử cũ nhất (FIFO/LRU cơ bản)
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      reply,
      sources,
      timestamp: Date.now(),
    });
  }

  public size(): number {
    return this.cache.size;
  }
}

export const responseCache = new ResponseCache();
