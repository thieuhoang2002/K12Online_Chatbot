import { NextRequest, NextResponse } from "next/server";
import { keyRotator, ChatMessage } from "@/lib/openrouter";
import { searchKnowledge } from "@/lib/knowledge";
import { responseCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], model = "nvidia/nemotron-3-ultra-550b-a55b:free" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Vui lòng nhập nội dung câu hỏi." }, { status: 400 });
    }

    // 1. KIỂM TRA BỘ NHỚ RAM CACHE (Nếu câu hỏi đã từng trả lời trước đó)
    // Nếu chỉ có 1 câu hỏi độc lập (không phụ thuộc ngữ cảnh trò chuyện dài), lấy thẳng từ RAM
    if (history.length === 0) {
      const cached = responseCache.get(model, message);
      if (cached) {
        return NextResponse.json({
          reply: cached.reply,
          sources: cached.sources,
          meta: {
            cached: true,
            keyIndexUsed: 0,
            totalKeysInPool: keyRotator.getKeyCount(),
          },
        });
      }
    }

    // 2. Tìm kiếm dữ liệu liên quan từ kho tri thức K12Online
    const relevantDocs = searchKnowledge(message, 3);
    const contextText = relevantDocs
      .map((d, i) => `[TÀI LIỆU ${i + 1} - ${d.title} (Nguồn: ${d.sourceUrl})]\n${d.content}`)
      .join("\n\n---\n\n");

    // 3. Xây dựng System Prompt chuẩn mực cho giáo dục
    const systemPrompt = `Bạn là Trợ lý AI Hỗ trợ Kỹ thuật K12Online - Một dự án phi lợi nhuận phục vụ cộng đồng.
QUY TẮC PHỤC VỤ:
1. Xưng hô thân thiện, lịch sự: gọi người dùng là "bạn", xưng là "mình" hoặc "Trợ lý K12".
2. Chỉ trả lời dựa trên CƠ SỞ TRI THỨC K12ONLINE được cung cấp dưới đây. Tuyệt đối không tự suy diễn hoặc bịa đặt tính năng không có thật.
3. Hướng dẫn chi tiết, rõ ràng theo từng bước (Bước 1: ..., Bước 2: ...) để bạn dễ dàng thao tác theo.
4. Ở cuối câu trả lời, LUÔN LUÔN đính kèm đường link bài viết gốc để bạn có thể bấm vào xem hình ảnh minh họa chi tiết.
5. Nếu trong tài liệu không có thông tin, hãy thành thật trả lời: "Hiện tại trong tài liệu hướng dẫn chưa có thông tin về vấn đề này. Bạn vui lòng liên hệ bộ phận hỗ trợ kỹ thuật hoặc tổng đài 18008000 (nhánh 2) để được hỗ trợ trực tiếp nhé."

CƠ SỞ TRI THỨC THAM KHẢO:
${contextText || "Chưa có tài liệu phù hợp."}`;

    // 4. Chuẩn bị hội thoại
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4), // Giữ lại 4 lượt chat gần nhất để nhớ ngữ cảnh
      { role: "user", content: message },
    ];

    // 5. Gọi OpenRouter thông qua Engine Xoay Key (Round-Robin & Failover)
    const { content, keyIndexUsed } = await keyRotator.callChatCompletion(messages, model);

    const sources = relevantDocs.map((d) => ({
      title: d.title,
      category: d.category,
      url: d.sourceUrl,
    }));

    // 6. LƯU VÀO BỘ NHỚ RAM CACHE CHO CÁC LẦN HỎI SAU
    responseCache.set(model, message, content, sources);

    return NextResponse.json({
      reply: content,
      sources,
      meta: {
        cached: false,
        keyIndexUsed,
        totalKeysInPool: keyRotator.getKeyCount(),
      },
    });
  } catch (error: any) {
    console.error("Lỗi API Chat:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi trong quá trình xử lý yêu cầu." },
      { status: 500 }
    );
  }
}
