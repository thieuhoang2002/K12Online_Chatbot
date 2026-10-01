import fs from "fs";
import path from "path";

export interface PrebakedAnswer {
  id: string;
  triggers: string[];
  keywords_combination?: string[][];
  reply: string;
  sources: { title: string; category: string; url: string }[];
  followUps: string[];
}

let cachedAnswers: PrebakedAnswer[] | null = null;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,?!:;'"(){}\[\]/\\–—_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tải danh sách câu trả lời Pre-baked từ file JSON
 */
function loadPrebakedData(): PrebakedAnswer[] {
  if (cachedAnswers) return cachedAnswers;

  const jsonPath = path.join(process.cwd(), "data", "prebaked_answers.json");
  if (!fs.existsSync(jsonPath)) {
    console.warn(`[Pre-baked] Không tìm thấy file: ${jsonPath}`);
    cachedAnswers = [];
    return cachedAnswers;
  }

  try {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    cachedAnswers = JSON.parse(raw);
    return cachedAnswers || [];
  } catch (err: any) {
    console.error("[Pre-baked] Lỗi khi đọc file prebaked_answers.json:", err.message);
    cachedAnswers = [];
    return cachedAnswers;
  }
}

/**
 * Tìm câu trả lời làm sẵn (Pre-baked) cho câu hỏi của người dùng
 * Hỗ trợ so khớp chính xác, so khớp cụm từ và tổ hợp từ khóa cốt lõi
 */
export function findPrebakedAnswer(query: string): PrebakedAnswer | null {
  if (!query || typeof query !== "string") return null;

  const cleanQuery = normalize(query);
  if (cleanQuery.length < 5) return null;

  const answers = loadPrebakedData();

  for (const item of answers) {
    // 1. So khớp trực tiếp qua danh sách trigger
    for (const trigger of item.triggers) {
      const cleanTrigger = normalize(trigger);
      if (
        cleanQuery === cleanTrigger ||
        cleanQuery.includes(cleanTrigger) ||
        (cleanTrigger.length >= 15 && cleanTrigger.includes(cleanQuery))
      ) {
        return item;
      }
    }

    // 2. So khớp qua tổ hợp từ khóa (Keywords combination)
    if (item.keywords_combination && item.keywords_combination.length > 0) {
      for (const combo of item.keywords_combination) {
        const allPresent = combo.every((kw) => cleanQuery.includes(normalize(kw)));
        if (allPresent) {
          return item;
        }
      }
    }
  }

  return null;
}
