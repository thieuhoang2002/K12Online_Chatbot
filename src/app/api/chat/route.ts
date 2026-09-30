import { NextRequest, NextResponse } from "next/server";
import { keyRotator, ChatMessage } from "@/lib/openrouter";
import { searchKnowledge } from "@/lib/knowledge";
import { responseCache } from "@/lib/cache";
import { checkRateLimit } from "@/lib/ratelimit";
import { checkCasualIntent } from "@/lib/intent";

/**
 * Tạo Stream giả lập mượt mà cho câu trả lời từ Cache hoặc câu xã giao
 */
function createTextStream(
  text: string,
  sources: any[] = [],
  meta: any = { cached: true }
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      if (sources && sources.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
        );
      }
      const words = text.split(" ");
      let i = 0;
      while (i < words.length) {
        const batch = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: batch })}\n\n`)
        );
        i += 3;
        await new Promise((r) => setTimeout(r, 15));
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done", meta })}\n\n`)
      );
      controller.close();
    },
  });
}

/**
 * Chuyển tiếp luồng SSE từ OpenRouter tới Client và lưu Cache khi hoàn tất
 */
function createOpenRouterStream(
  openRouterBody: ReadableStream<Uint8Array>,
  sources: any[],
  onComplete: (fullText: string) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullAccumulated = "";

  return new ReadableStream({
    async start(controller) {
      if (sources && sources.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
        );
      }

      const reader = openRouterBody.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || !line.startsWith("data:")) continue;
            const dataStr = line.replace(/^data:\s*/, "");
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.delta?.reasoning ||
                "";
              if (delta) {
                fullAccumulated += delta;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: delta })}\n\n`)
                );
              }
            } catch (e) {}
          }
        }

        if (buffer.trim().startsWith("data:")) {
          const dataStr = buffer.trim().replace(/^data:\s*/, "");
          if (dataStr !== "[DONE]") {
            try {
              const parsed = JSON.parse(dataStr);
              const delta =
                parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.delta?.reasoning ||
                "";
              if (delta) {
                fullAccumulated += delta;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: delta })}\n\n`)
                );
              }
            } catch (e) {}
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done", meta: { cached: false } })}\n\n`)
        );
        controller.close();

        if (fullAccumulated.trim()) {
          onComplete(fullAccumulated).catch(() => {});
        }
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`)
        );
        controller.close();
      }
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      history = [],
      model = "qwen/qwen3.8-27b:free",
      turnstileToken,
    } = body;

    // 1. Kiểm tra đầu vào & giới hạn độ dài payload (chống flood token/memory)
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Vui lòng nhập nội dung câu hỏi." }, { status: 400 });
    }

    if (message.trim().length > 1500) {
      return NextResponse.json(
        { error: "Câu hỏi vượt quá giới hạn độ dài cho phép (tối đa 1.500 ký tự). Bạn vui lòng tóm tắt ngắn gọn hơn nhé!" },
        { status: 400 }
      );
    }

    const cacheKey = message.trim().toLowerCase();

    // 2. Trích xuất IP & Giới hạn tần suất gọi API (Rate Limit qua Upstash Redis / RAM)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateLimit = await checkRateLimit(ip, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Bạn đang gửi câu hỏi quá nhanh. Vui lòng đợi ${rateLimit.resetInSeconds} giây trước khi gửi tiếp nhé!`,
        },
        { status: 429 }
      );
    }

    // 3. Xác minh Cloudflare Turnstile nghiêm ngặt phía Server (siteverify)
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const isDevBypass =
        process.env.NODE_ENV !== "production" &&
        (turnstileToken === "cf-safety-verified-token" || turnstileToken === "cf-simulated-token");

      if (!isDevBypass) {
        if (!turnstileToken) {
          return NextResponse.json(
            { error: "Yêu cầu bị từ chối: Thiếu mã xác thực bảo mật Cloudflare Turnstile." },
            { status: 403 }
          );
        }

        try {
          const verifyFormData = new URLSearchParams();
          verifyFormData.append("secret", turnstileSecret);
          verifyFormData.append("response", turnstileToken);
          if (ip && ip !== "127.0.0.1") verifyFormData.append("remoteip", ip);

          const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: verifyFormData,
          });
          const cfData = await cfRes.json();
          if (!cfData.success) {
            console.warn("⚠️ [Cloudflare Turnstile] Siteverify từ chối token:", cfData["error-codes"]);
            return NextResponse.json(
              { error: "Xác minh bảo mật Cloudflare không hợp lệ hoặc đã hết hạn. Vui lòng tải lại trang." },
              { status: 403 }
            );
          }
          console.log("✅ [Cloudflare Turnstile] Siteverify thành công!");
        } catch (err: any) {
          console.warn("⚠️ [Cloudflare Turnstile] Lỗi kết nối siteverify:", err.message);
        }
      }
    }

    // 4. BỘ LỌC Ý ĐỊNH XÃ GIAO (Intent Filter): Phản hồi tức thì <10ms không cần tra cứu RAG hay gọi LLM
    const casual = checkCasualIntent(message);
    if (casual.isCasual && casual.reply) {
      console.log(`💬 [Intent Filter] Bắt câu hỏi xã giao: "${message}"`);
      const stream = createTextStream(casual.reply, [], { casual: true });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    }

    // 5. KIỂM TRA BỘ NHỚ RAM / REDIS CACHE
    const cached = await responseCache.get(model, cacheKey);
    if (cached) {
      console.log(`⚡ [Cache Hit] Trúng cache: "${message.slice(0, 35)}..." (Phản hồi stream)`);
      const stream = createTextStream(cached.reply, cached.sources, { cached: true });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    }

    // 6. Tìm kiếm dữ liệu liên quan từ kho tri thức K12Online
    const relevantDocs = searchKnowledge(message, 3);
    const contextText = relevantDocs
      .map((d, i) => `[TÀI LIỆU ${i + 1} - ${d.title} (Nguồn: ${d.sourceUrl})]\n${d.content}`)
      .join("\n\n---\n\n");

    const sources = relevantDocs.map((d) => ({
      title: d.title,
      category: d.category,
      url: d.sourceUrl,
    }));

    // 7. Xây dựng System Prompt chuẩn mực cho giáo dục
    const systemPrompt = `Bạn là Trợ lý AI Hỗ trợ Kỹ thuật K12Online - Một dự án phi lợi nhuận phục vụ cộng đồng.
QUY TẮC PHỤC VỤ:
1. Xưng hô thân thiện, lịch sự: gọi người dùng là "bạn", xưng là "mình" hoặc "Trợ lý K12".
2. Chỉ trả lời dựa trên CƠ SỞ TRI THỨC K12ONLINE được cung cấp dưới đây. Tuyệt đối không tự suy diễn hoặc bịa đặt tính năng không có thật.
3. Hướng dẫn chi tiết, rõ ràng theo từng bước (Bước 1: ..., Bước 2: ...) để bạn dễ dàng thao tác theo.
4. Ở cuối câu trả lời, LUÔN LUÔN đính kèm đường link bài viết gốc để bạn có thể bấm vào xem hình ảnh minh họa chi tiết.
5. Nếu trong tài liệu không có thông tin, hãy thành thật trả lời: "Hiện tại trong tài liệu hướng dẫn chưa có thông tin về vấn đề này. Bạn vui lòng liên hệ bộ phận hỗ trợ kỹ thuật hoặc tổng đài 18008000 (nhánh 2) để được hỗ trợ trực tiếp nhé."

CƠ SỞ TRI THỨC THAM KHẢO:
${contextText || "Chưa có tài liệu phù hợp."}`;

    // 8. Chuẩn bị hội thoại
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: message },
    ];

    // 9. Gọi OpenRouter STREAMING (Gõ chữ từng từ theo thời gian thực)
    const { responseStream } = await keyRotator.callChatCompletionStream(messages, model);

    const clientStream = createOpenRouterStream(
      responseStream,
      sources,
      async (finalText: string) => {
        await responseCache.set(model, cacheKey, finalText, sources);
      }
    );

    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
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
