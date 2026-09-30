import fs from "fs";
import path from "path";

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
}

let cachedArticles: ArticleDoc[] = [];

/**
 * Tự động tải và phân tích dữ liệu từ file tổng hợp hoặc thư mục bài viết
 */
export function loadKnowledgeBase(): ArticleDoc[] {
  if (cachedArticles.length > 0) return cachedArticles;

  const dataDir = path.join(process.cwd(), "data");
  const mergedFile = path.join(dataDir, "k12_knowledge.txt");
  const articlesDir = path.join(dataDir, "articles");

  // Cách 1: Đọc từ thư mục articles nếu có
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".txt"));
    if (files.length > 0) {
      cachedArticles = files.map((file) => {
        const fullPath = path.join(articlesDir, file);
        const text = fs.readFileSync(fullPath, "utf-8");

        const titleMatch = text.match(/### BÀI VIẾT.*?:\s*(.*?)\n/);
        const catMatch = text.match(/- Chuyên mục:\s*(.*?)\n/);
        const linkMatch = text.match(/- Link gốc:\s*(.*?)\n/);

        const title = titleMatch ? titleMatch[1].trim() : file.replace(".txt", "");
        const category = catMatch ? catMatch[1].trim() : "Chung";
        const sourceUrl = linkMatch ? linkMatch[1].trim() : "https://hotro.k12online.vn";

        return {
          title,
          category,
          sourceUrl,
          content: text,
          raw: text.toLowerCase(),
        };
      });
      return cachedArticles;
    }
  }

  // Cách 2: Đọc từ file tổng hợp k12_knowledge.txt
  if (fs.existsSync(mergedFile)) {
    const rawContent = fs.readFileSync(mergedFile, "utf-8");
    const sections = rawContent.split("=".repeat(50));

    cachedArticles = sections
      .filter((s) => s.trim().length > 50)
      .map((sec) => {
        const titleMatch = sec.match(/### BÀI VIẾT.*?:\s*(.*?)\n/);
        const catMatch = sec.match(/- Chuyên mục:\s*(.*?)\n/);
        const linkMatch = sec.match(/- Link gốc:\s*(.*?)\n/);

        return {
          title: titleMatch ? titleMatch[1].trim() : "Bài viết K12Online",
          category: catMatch ? catMatch[1].trim() : "Chung",
          sourceUrl: linkMatch ? linkMatch[1].trim() : "https://hotro.k12online.vn",
          content: sec.trim(),
          raw: sec.toLowerCase(),
        };
      });
  }

  return cachedArticles;
}

/**
 * Tìm kiếm các bài viết liên quan nhất đến câu hỏi của người dùng
 */
export function searchKnowledge(query: string, topK: number = 3): SearchResult[] {
  const docs = loadKnowledgeBase();
  if (docs.length === 0) return [];

  // Tách từ khóa trong câu hỏi
  const keywords = query
    .toLowerCase()
    .replace(/[?,.!;:]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !["cách", "làm", "sao", "cho", "của", "và", "như", "thế", "nào", "được", "có"].includes(w));

  const scoredDocs: SearchResult[] = docs.map((doc) => {
    let score = 0;
    const titleLower = doc.title.toLowerCase();

    for (const kw of keywords) {
      if (titleLower.includes(kw)) {
        score += 8; // Điểm khớp tiêu đề cao hơn
      }
      const matches = (doc.raw.match(new RegExp(kw, "g")) || []).length;
      score += Math.min(matches, 5) * 1.5;
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
