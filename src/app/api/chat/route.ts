import { NextRequest, NextResponse } from "next/server";
import { keyRotator, ChatMessage } from "@/lib/openrouter";
import { geminiRotator } from "@/lib/gemini";
import { searchKnowledge } from "@/lib/knowledge";
import { responseCache } from "@/lib/cache";
import { checkRateLimit, isIpVerifiedHuman, markIpVerifiedHuman } from "@/lib/ratelimit";
import { checkCasualIntent } from "@/lib/intent";
import { generateFollowUpPrompts } from "@/lib/suggestions";

/**
 * Tạo Stream giả lập mượt mà cho câu trả lời từ Cache hoặc câu xã giao
 */
function createTextStream(
  text: string,
  sources: any[] = [],
  followUps: string[] = [],
  meta: any = { cached: true }
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      // 1. Gửi nguồn trước nếu có
      if (sources && sources.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
        );
      }

      // 2. Gửi từng cụm từ nhỏ tạo hiệu ứng gõ chữ
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

      // 3. Gửi danh sách câu hỏi gợi ý tiếp theo
      if (followUps && followUps.length > 0) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "followUps", prompts: followUps, followUps: followUps })}\n\n`
          )
        );
      }

      // 4. Kết thúc
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done", meta })}\n\n`)
      );
      controller.close();
    },
  });
}

/**
 * Chuyển tiếp luồng SSE từ Google Gemini tới Client và lưu Cache khi hoàn tất
 */
function createGeminiStream(
  geminiBody: ReadableStream<Uint8Array>,
  sources: any[],
  followUps: string[],
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

      const reader = geminiBody.getReader();
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
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              const chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (chunkText) {
                fullAccumulated += chunkText;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: chunkText })}\n\n`)
                );
              }
            } catch (e) {}
          }
        }

        // Gửi danh sách gợi ý câu hỏi tiếp theo
        if (followUps && followUps.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "followUps", prompts: followUps, followUps: followUps })}\n\n`
            )
          );
        }

        // Gửi thông báo hoàn tất
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done", meta: { cached: false, provider: "gemini" } })}\n\n`)
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

/**
 * Chuyển tiếp luồng SSE từ OpenRouter tới Client và lưu Cache khi hoàn tất
 */
function createOpenRouterStream(
  openRouterBody: ReadableStream<Uint8Array>,
  sources: any[],
  followUps: string[],
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
      let isThinking = false;

      const processDelta = (rawDelta: string) => {
        if (!rawDelta) return;
        let cleanText = "";
        let remaining = rawDelta;

        while (remaining.length > 0) {
          if (isThinking) {
            const endIdx = remaining.indexOf("</think>");
            if (endIdx !== -1) {
              isThinking = false;
              remaining = remaining.slice(endIdx + 8);
            } else {
              remaining = "";
            }
          } else {
            const startIdx = remaining.indexOf("<think>");
            if (startIdx !== -1) {
              cleanText += remaining.slice(0, startIdx);
              isThinking = true;
              remaining = remaining.slice(startIdx + 7);
            } else {
              cleanText += remaining;
              remaining = "";
            }
          }
        }

        if (cleanText) {
          fullAccumulated += cleanText;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "chunk", text: cleanText })}\n\n`)
          );
        }
      };

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
              // CHỈ trích xuất content thực tế, loại bỏ hoàn toàn delta.reasoning để tránh lộ suy nghĩ nội tâm
              const delta = parsed.choices?.[0]?.delta?.content || "";
              processDelta(delta);
            } catch (e) {}
          }
        }

        if (buffer.trim().startsWith("data:")) {
          const dataStr = buffer.trim().replace(/^data:\s*/, "");
          if (dataStr !== "[DONE]") {
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              processDelta(delta);
            } catch (e) {}
          }
        }

        // Gửi danh sách gợi ý câu hỏi tiếp theo
        if (followUps && followUps.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "followUps", prompts: followUps, followUps: followUps })}\n\n`
            )
          );
        }

        // Gửi thông báo hoàn tất
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

    // 3. Xác minh Cloudflare Turnstile thông minh (nhớ phiên người dùng đã xác thực 30 phút)
    const turnstileSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const isLocalDev = ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
      const isDevBypass =
        (process.env.NODE_ENV !== "production" &&
          (turnstileToken === "cf-safety-verified-token" || turnstileToken === "cf-simulated-token")) ||
        isLocalDev;

      const alreadyVerified = await isIpVerifiedHuman(ip);

      if (!isDevBypass) {
        // Nếu người dùng đã vượt qua xác thực Turnstile gần đây, cho phép tiếp tục trò chuyện
        if (alreadyVerified) {
          await markIpVerifiedHuman(ip, 1800);
        } else {
          if (!turnstileToken) {
            return NextResponse.json(
              { error: "Yêu cầu bị từ chối: Thiếu mã xác thực bảo mật Cloudflare Turnstile. Vui lòng tải lại trang." },
              { status: 403 }
            );
          }

          try {
            const verifyFormData = new URLSearchParams();
            verifyFormData.append("secret", turnstileSecret);
            verifyFormData.append("response", turnstileToken);
            if (ip && !isLocalDev) verifyFormData.append("remoteip", ip);

            const cfRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
              method: "POST",
              body: verifyFormData,
            });
            const cfData = await cfRes.json();

            if (cfData.success) {
              console.log("✅ [Cloudflare Turnstile] Siteverify thành công! Đánh dấu người dùng hợp lệ 30 phút.");
              await markIpVerifiedHuman(ip, 1800);
            } else {
              const errCodes: string[] = cfData["error-codes"] || [];
              console.warn("⚠️ [Cloudflare Turnstile] Siteverify thông báo mã lỗi:", errCodes);

              // Token Turnstile chỉ dùng được 1 lần. Nếu đã qua xác thực hoặc là token trùng lặp do hỏi tiếp:
              if (errCodes.includes("timeout-or-duplicate")) {
                console.log(`🛡️ [Cloudflare Turnstile] Bỏ qua lỗi duplicate/timeout cho IP ${ip} (tiếp tục hội thoại).`);
                await markIpVerifiedHuman(ip, 1800);
              } else {
                return NextResponse.json(
                  { error: "Xác minh bảo mật Cloudflare không hợp lệ hoặc đã hết hạn. Vui lòng tải lại trang." },
                  { status: 403 }
                );
              }
            }
          } catch (err: any) {
            console.warn("⚠️ [Cloudflare Turnstile] Lỗi mạng khi kết nối siteverify:", err.message);
            // Không ngắt đoạn chat của người dùng nếu chính Cloudflare API bị chập chờn
            await markIpVerifiedHuman(ip, 300);
          }
        }
      }
    }

    // 4. BỘ LỌC Ý ĐỊNH XÃ GIAO (Intent Filter): Phản hồi tức thì <10ms không cần tra cứu RAG hay gọi LLM
    const casual = checkCasualIntent(message);
    if (casual.isCasual && casual.reply) {
      console.log(`💬 [Intent Filter] Bắt câu hỏi xã giao: "${message}"`);
      const casualFollowUps = [
        "Làm sao để nhập câu hỏi trắc nghiệm từ file Word dạng ABCD?",
        "Học sinh làm bài thi trực tuyến cần lưu ý những gì?",
        "Hướng dẫn phụ huynh và học sinh nộp bài tập về nhà trên K12Connect",
      ];
      const stream = createTextStream(casual.reply, [], casualFollowUps, { casual: true });
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
      const cachedFollowUps = generateFollowUpPrompts(message, cached.sources || []);
      const stream = createTextStream(cached.reply, cached.sources, cachedFollowUps, { cached: true });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    }

    // 6. Tìm kiếm dữ liệu liên quan từ kho tri thức K12Online (kèm Từ điển đồng nghĩa)
    const relevantDocs = searchKnowledge(message, 3);
    const contextText = relevantDocs
      .map((d, i) => `[TÀI LIỆU ${i + 1} - ${d.title} (Nguồn: ${d.sourceUrl})]\n${d.content}`)
      .join("\n\n---\n\n");

    const sources = relevantDocs.map((d) => ({
      title: d.title,
      category: d.category,
      url: d.sourceUrl,
    }));

    const followUps = generateFollowUpPrompts(message, relevantDocs);

    // 7. Xây dựng System Prompt chuẩn mực cho giáo dục
    const systemPrompt = `Bạn là Trợ lý AI Hỗ trợ Kỹ thuật K12Online - Một dự án phi lợi nhuận phục vụ cộng đồng.
QUY TẮC PHỤC VỤ:
1. Xưng hô thân thiện, lịch sự: gọi người dùng là "bạn", xưng là "mình" hoặc "Trợ lý K12".
2. Trả lời dựa trên CƠ SỞ TRI THỨC K12ONLINE được cung cấp dưới đây. Hướng dẫn chi tiết, rõ ràng theo từng bước (Bước 1: ..., Bước 2: ...) để người dùng dễ dàng thao tác theo.
3. Ở cuối câu trả lời, LUÔN LUÔN đính kèm đường link bài viết gốc để bạn có thể bấm vào xem chi tiết nếu tài liệu có đường dẫn.
4. Nếu trong tài liệu hoàn toàn không có thông tin và không thể giải đáp, hãy thành thật trả lời: "Hiện tại trong tài liệu hướng dẫn chưa có thông tin chi tiết về vấn đề này. Bạn vui lòng liên hệ bộ phận hỗ trợ kỹ thuật hoặc tổng đài 18008000 (nhánh 2) để được hỗ trợ trực tiếp nhé."
5. QUAN TRỌNG: TUYỆT ĐỐI KHÔNG xuất các đoạn suy nghĩ nội tâm (reasoning/thought), không giải thích bằng tiếng Anh hay viết "The user is asking...". Chỉ trả lời trực tiếp nội dung bằng tiếng Việt chuẩn mực cho người dùng.

CƠ SỞ TRI THỨC THAM KHẢO:
${contextText || "Chưa có tài liệu phù hợp."}`;

    // 8. Chuẩn bị hội thoại
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: message },
    ];

    // 9. CHIẾN LƯỢC ĐA ĐỘNG CƠ AI (Multi-Provider Dual Engine)
    // Ưu tiên #1: Gọi Google Gemini nếu đã cấu hình Key (siêu tốc, hạn ngạch ngày lớn)
    if (geminiRotator.getKeyCount() > 0) {
      try {
        const geminiRes = await geminiRotator.callGeminiStream(
          systemPrompt,
          history.slice(-4),
          message
        );

        const clientStream = createGeminiStream(
          geminiRes.responseStream,
          sources,
          followUps,
          async (finalText: string) => {
            await responseCache.set("gemini", cacheKey, finalText, sources);
          }
        );

        return new Response(clientStream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-AI-Provider": "google-gemini",
            "X-AI-Model": geminiRes.modelUsed,
          },
        });
      } catch (geminiErr: any) {
        console.warn(
          `⚠️ [Multi-Provider Failover] Google Gemini tạm thời nghẽn (${geminiErr.message}). Tự động kích hoạt Bể OpenRouter dự phòng...`
        );
      }
    }

    // Dự phòng #2: Bể 5 Key OpenRouter (Qwen)
    const { responseStream, rateLimitInfo } = await keyRotator.callChatCompletionStream(messages, model);

    const clientStream = createOpenRouterStream(
      responseStream,
      sources,
      followUps,
      async (finalText: string) => {
        await responseCache.set(model, cacheKey, finalText, sources);
      }
    );

    const resHeaders: Record<string, string> = {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-AI-Provider": "openrouter",
      "X-AI-Model": model,
    };
    if (rateLimitInfo?.limit) resHeaders["x-ratelimit-limit"] = rateLimitInfo.limit;
    if (rateLimitInfo?.remaining) resHeaders["x-ratelimit-remaining"] = rateLimitInfo.remaining;
    if (rateLimitInfo?.reset) resHeaders["x-ratelimit-reset"] = rateLimitInfo.reset;

    return new Response(clientStream, { headers: resHeaders });
  } catch (error: any) {
    console.error("Lỗi API Chat:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi trong quá trình xử lý yêu cầu." },
      { status: 500 }
    );
  }
}
