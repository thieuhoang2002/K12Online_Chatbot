/**
 * Bộ lọc ý định câu hỏi (Intent Filter):
 * Nhận diện các câu chào hỏi, cảm ơn, xã giao phổ biến để phản hồi tức thì (<10ms)
 * mà không cần tốn thời gian truy vấn RAG hay gọi API LLM.
 */

export interface IntentResult {
  isCasual: boolean;
  reply?: string;
}

export function checkCasualIntent(message: string): IntentResult {
  const clean = message
    .toLowerCase()
    .trim()
    .replace(/[?.!,:;~^@#$%&*_+=-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 1. Chào hỏi
  const greetings = [
    "chao", "xin chao", "chao ban", "chao em", "chao bot", "chao tro ly",
    "chao ad", "chao admin", "hello", "hi", "alo", "helo", "hey",
    "ban oi", "ad oi", "tro ly oi", "k12 oi"
  ];
  if (greetings.includes(clean)) {
    return {
      isCasual: true,
      reply:
        "Xin chào bạn! Mình là Trợ lý AI hỗ trợ nghiệp vụ K12Online. Bạn đang cần hướng dẫn thao tác nào trên hệ thống (ví dụ: nhập đề thi từ Word, làm bài kiểm tra trực tuyến, điểm danh, xếp thời khóa biểu...) cứ nhắn mình hỗ trợ nhé!",
    };
  }

  // 2. Cảm ơn
  const thanks = [
    "cam on", "cam on ban", "cam on em", "cam on nha", "cam on tro ly",
    "thanks", "thank you", "thank", "tks", "ok cam on", "da cam on",
    "tuyet voi", "cam on nhieu", "ok cam on ban"
  ];
  // Chuyển sang không dấu để kiểm tra chính xác
  const cleanNoTone = clean
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  if (thanks.includes(cleanNoTone)) {
    return {
      isCasual: true,
      reply:
        "Dạ không có gì ạ! Rất vui được đồng hành cùng bạn. Chúc bạn có một ngày làm việc và giảng dạy thật thuận lợi! Nếu gặp bất kỳ vướng mắc nào khác trên K12Online, bạn cứ nhắn mình nhé.",
    };
  }

  // 3. Tạm biệt
  const goodbyes = [
    "tam biet", "bye", "bye bye", "goodbye", "hen gap lai", "chao nhe"
  ];
  if (goodbyes.includes(cleanNoTone)) {
    return {
      isCasual: true,
      reply:
        "Tạm biệt bạn nhé! Chúc bạn nhiều niềm vui. Bất cứ khi nào cần trợ giúp nghiệp vụ K12Online, mình luôn sẵn sàng ở đây hỗ trợ bạn!",
    };
  }

  // 4. Giới thiệu / Bạn là ai
  const identity = [
    "ban la ai", "may la ai", "em la ai", "ban ten gi", "may ten gi",
    "ai tao ra ban", "ban co the lam gi", "ban giup duoc gi", "gioi thieu ban than"
  ];
  if (identity.includes(cleanNoTone)) {
    return {
      isCasual: true,
      reply:
        "Mình là Trợ lý AI K12Online - một dự án phi thương mại vì cộng đồng giáo dục. Mình được huấn luyện để giải đáp các quy trình, thao tác nghiệp vụ trên K12Online dành cho Quý Thầy/Cô, Cán bộ IT và các bạn Học sinh. Bạn đang quan tâm đến tính năng nào của K12Online ạ?",
    };
  }

  return { isCasual: false };
}
