/**
 * Google Gemini API Engine & Multi-Key Rotator
 * Hỗ trợ xoay vòng nhiều API Key Gemini (Round-Robin), Streaming SSE thời gian thực,
 * và tự động chuyển đổi sang OpenRouter khi gặp lỗi hoặc nghẽn hạn ngạch.
 */

export interface GeminiHistoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

class GeminiRotator {
  private keys: string[] = [];
  private currentIndex: number = 0;

  // Danh sách model Google Gemini tốc độ cao & ổn định nhất
  private candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];

  constructor() {
    this.refreshKeys();
  }

  public refreshKeys() {
    const raw = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
    this.keys = raw
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (this.keys.length > 0) {
      console.log(`✨ [Google Gemini] Đã nạp ${this.keys.length} API Key vào bể xoay tua.`);
    }
  }

  public getKeyCount(): number {
    return this.keys.length;
  }

  /**
   * Gọi Google Gemini API ở chế độ STREAMING (Server-Sent Events)
   * Tự động xoay tua các Key trong bể khi gặp mã lỗi 429 / 503
   */
  public async callGeminiStream(
    systemPrompt: string,
    history: GeminiHistoryMessage[],
    userMessage: string
  ): Promise<{ responseStream: ReadableStream<Uint8Array>; keyIndexUsed: number; modelUsed: string }> {
    if (this.keys.length === 0) {
      throw new Error("Chưa cấu hình GEMINI_API_KEYS trong file .env.local");
    }

    // Chuẩn bị dữ liệu lịch sử hội thoại chuẩn định dạng của Gemini (user/model)
    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

    for (const msg of history) {
      if (msg.role === "system") continue;
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    // Thêm câu hỏi hiện tại của người dùng
    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const totalKeys = this.keys.length;

    for (const modelToUse of this.candidateModels) {
      let keyAttempts = 0;

      while (keyAttempts < totalKeys) {
        const activeIndex = this.currentIndex;
        const apiKey = this.keys[activeIndex];
        this.currentIndex = (this.currentIndex + 1) % totalKeys;
        keyAttempts++;

        const maskedKey = apiKey.slice(0, 6) + "..." + apiKey.slice(-4);
        console.log(
          `✨ [Gemini Stream] Thử Key #${activeIndex + 1}/${totalKeys} (${maskedKey}) | Model: ${modelToUse}`
        );

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:streamGenerateContent?alt=sse&key=${apiKey}`;

          const response = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: contents,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192,
              },
            }),
          });

          clearTimeout(timeoutId);

          if (response.status === 429 || response.status === 503) {
            console.warn(
              `⚠️ [Gemini Stream] HTTP ${response.status} với Key #${activeIndex + 1}. Tự động xoay sang Key kế tiếp...`
            );
            continue;
          }

          if (!response.ok || !response.body) {
            const errText = await response.text();
            console.warn(`⚠️ [Gemini Stream] HTTP ${response.status}: ${errText.slice(0, 150)}`);
            continue;
          }

          return {
            responseStream: response.body,
            keyIndexUsed: activeIndex + 1,
            modelUsed: modelToUse,
          };
        } catch (err: any) {
          console.warn(`❌ [Gemini Stream] Lỗi kết nối tới ${modelToUse}:`, err.message);
          continue;
        }
      }
    }

    throw new Error("Tất cả API Key của Google Gemini hiện đang quá tải hoặc tạm thời hết hạn ngạch.");
  }
}

export const geminiRotator = new GeminiRotator();
