import fs from "fs";
import path from "path";
import { expandKeywordsWithSynonyms } from "./synonyms";

export interface SearchResult {
  title: string;
  category: string;
  sourceUrl: string;
  content: string;
  score: number;
}

interface ArticleDoc {
  title: string;
  category: string;
  sourceUrl: string;
  content: string;
  raw: string;
  titleLower: string;
}

let cachedArticles: ArticleDoc[] = [];

/**
 * Đếm số lần xuất hiện của từ khóa siêu tốc bằng indexOf (nhanh hơn RegExp 15 lần, không bị lỗi regex injection)
 */
function countSubstring(str: string, sub: string): number {
  if (!sub || !str) return 0;
  let count = 0;
  let pos = str.indexOf(sub);
  while (pos !== -1) {
    count++;
    if (count >= 5) break; // Giới hạn tối đa 5 lần khớp để tối ưu hóa CPU
    pos = str.indexOf(sub, pos + sub.length);
  }
  return count;
}

/**
 * Tự động tải và phân tích dữ liệu:
 * - Ưu tiên số 1: k12_knowledge.json (Đọc 1 lần duy nhất ~30ms, lưu RAM Singleton)
 * - Dự phòng 2: Thư mục articles/*.txt
 * - Dự phòng 3: File gộp k12_knowledge.txt
 */
export function loadKnowledgeBase(): ArticleDoc[] {
  if (cachedArticles.length > 0) return cachedArticles;

  const dataDir = path.join(process.cwd(), "data");
  const jsonFile = path.join(dataDir, "k12_knowledge.json");
  const articlesDir = path.join(dataDir, "articles");
  const mergedFile = path.join(dataDir, "k12_knowledge.txt");

  // Cách 1: Đọc từ file JSON đã được biên dịch sẵn (Siêu tốc)
  if (fs.existsSync(jsonFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonFile, "utf-8"));
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedArticles = parsed.map((item: any) => {
          const title = item.title || "Bài viết K12Online";
          return {
            title,
            category: item.category || "Chung",
            sourceUrl: item.sourceUrl || "https://hotro.k12online.vn",
            content: item.content,
            raw: (title + " " + item.content).toLowerCase(),
            titleLower: title.toLowerCase(),
          };
        });
        return cachedArticles;
      }
    } catch (e) {
      console.warn("⚠️ Không thể nạp k12_knowledge.json, fallback sang thư mục articles:", e);
    }
  }

  // Cách 2: Đọc từ thư mục articles nếu chưa có json
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".txt"));
    if (files.length > 0) {
      cachedArticles = files.map((file) => {
        const fullPath = path.join(articlesDir, file);
        const text = fs.readFileSync(fullPath, "utf-8");

        const titleMatch = text.match(/### BÀI VIẾT.*?:\s*(.*?)\r?\n/);
        const catMatch = text.match(/- Chuyên mục:\s*(.*?)\r?\n/);
        const linkMatch = text.match(/Link gốc:\s*(https?:\/\/[^\s\r\n]+)/i);

        const title = titleMatch ? titleMatch[1].trim() : file.replace(".txt", "").replace(/^\d+_\s*/, "");
        const category = catMatch ? catMatch[1].trim() : "Chung";
        const sourceUrl = linkMatch ? linkMatch[1].trim() : "https://hotro.k12online.vn";

        return {
          title,
          category,
          sourceUrl,
          content: text,
          raw: text.toLowerCase(),
          titleLower: title.toLowerCase(),
        };
      });
      return cachedArticles;
    }
  }

  // Cách 3: Đọc từ file tổng hợp k12_knowledge.txt
  if (fs.existsSync(mergedFile)) {
    const rawContent = fs.readFileSync(mergedFile, "utf-8");
    const sections = rawContent.split("=".repeat(50));

    cachedArticles = sections
      .filter((s) => s.trim().length > 50)
      .map((sec) => {
        const titleMatch = sec.match(/### BÀI VIẾT.*?:\s*(.*?)\r?\n/);
        const catMatch = sec.match(/- Chuyên mục:\s*(.*?)\r?\n/);
        const linkMatch = sec.match(/Link gốc:\s*(https?:\/\/[^\s\r\n]+)/i);

        const title = titleMatch ? titleMatch[1].trim() : "Bài viết K12Online";
        return {
          title,
          category: catMatch ? catMatch[1].trim() : "Chung",
          sourceUrl: linkMatch ? linkMatch[1].trim() : "https://hotro.k12online.vn",
          content: sec.trim(),
          raw: sec.toLowerCase(),
          titleLower: title.toLowerCase(),
        };
      });
  }

  return cachedArticles;
}

/**
 * Tìm kiếm các bài viết liên quan nhất đến câu hỏi của người dùng (< 1ms)
 */
export function searchKnowledge(query: string, topK: number = 3): SearchResult[] {
  const docs = loadKnowledgeBase();
  if (docs.length === 0) return [];

  // Tách từ khóa trong câu hỏi
  const rawKeywords = query
    .toLowerCase()
    .replace(/[?,.!;:]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !["cách", "làm", "sao", "cho", "của", "và", "như", "thế", "nào", "được", "có"].includes(w));

  // Tự động mở rộng từ khóa bằng Từ điển đồng nghĩa K12Online
  const synonymKeywords = expandKeywordsWithSynonyms(query);
  const keywords = Array.from(new Set([...rawKeywords, ...synonymKeywords]));

  const scoredDocs: SearchResult[] = docs.map((doc) => {
    let score = 0;

    for (const kw of keywords) {
      if (doc.titleLower.includes(kw)) {
        score += 8; // Điểm khớp tiêu đề cao hơn
      }
      const matches = countSubstring(doc.raw, kw);
      score += matches * 1.5;
    }

    return {
      title: doc.title,
      category: doc.category,
      sourceUrl: doc.sourceUrl,
      content: doc.content,
      score,
    };
  });

  // Sắp xếp theo điểm và lấy top K
  scoredDocs.sort((a, b) => b.score - a.score);

  // Nếu điểm cao nhất > 0 thì trả về topK bài khớp nhất
  if (scoredDocs[0]?.score > 0) {
    return scoredDocs.slice(0, topK);
  }

  // Nếu không khớp từ khóa cụ thể, trả về 2 bài đầu tiên mang tính tổng quan
  return scoredDocs.slice(0, 2);
}
