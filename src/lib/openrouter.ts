/**
 * OpenRouter Key Rotation & Failover Engine
 * Hỗ trợ xoay vòng nhiều API Key (Round-Robin) và tự động Failover khi gặp lỗi 429 (Rate Limit)
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

class KeyRotator {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.refreshKeys();
  }

  public refreshKeys() {
    const rawKeys = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || "";
    this.keys = rawKeys
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (this.keys.length === 0) {
      console.warn("⚠️ [OpenRouter] Chưa có API Key nào được cấu hình trong .env.local!");
    } else {
      console.log(`🔑 [OpenRouter] Đã nạp ${this.keys.length} API Key vào bể xoay tua (Key Pool).`);
    }
  }

  public getKeyCount(): number {
    return this.keys.length;
  }

  /**
   * Danh sách model miễn phí chất lượng cao để tự động fallback khi model chính bị nghẽn
   */
  private fallbackModels = [
    "qwen/qwen3.8-27b:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "google/gemma-4-31b-it:free",
  ];

  /**
   * Gọi OpenRouter API với cơ chế xoay vòng Key và tự động fallback Model nếu dính 429 upstream
   */
  public async callChatCompletion(
    messages: ChatMessage[],
    requestedModel: string = "qwen/qwen3.8-27b:free"
  ): Promise<{ content: string; keyIndexUsed: number }> {
    if (this.keys.length === 0) {
      throw new Error("Chưa cấu hình OPENROUTER_API_KEYS trong file môi trường .env.local.");
    }

    const candidateModels = [
      requestedModel,
      ...this.fallbackModels.filter((m) => m !== requestedModel),
    ];

    const totalKeys = this.keys.length;

    for (const modelToUse of candidateModels) {
      let keyAttempts = 0;

      while (keyAttempts < totalKeys) {
        const activeIndex = this.currentIndex;
        const apiKey = this.keys[activeIndex];
        this.currentIndex = (this.currentIndex + 1) % totalKeys;
        keyAttempts++;

        const maskedKey = apiKey.slice(0, 8) + "..." + apiKey.slice(-4);
        console.log(
          `[OpenRouter] Đang thử Key #${activeIndex + 1}/${totalKeys} (${maskedKey}) | Model: ${modelToUse}`
        );

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://k12online-assistant.edu.vn",
              "X-Title": "K12Online Community AI Assistant",
            },
            body: JSON.stringify({
              model: modelToUse,
              messages: messages,
              temperature: 0.3,
            }),
          });

          clearTimeout(timeoutId);

          if (response.status === 429 || response.status === 402) {
            let isSharedPoolThrottled = false;
            try {
              const errBody = await response.json();
              const rawMsg = errBody?.metadata?.raw || errBody?.message || "";
              if (
                errBody?.metadata?.limit_source === "upstream_provider_shared_pool" ||
                rawMsg.toLowerCase().includes("rate-limited upstream")
              ) {
                isSharedPoolThrottled = true;
              }
            } catch (e) {}

            if (isSharedPoolThrottled) {
              console.warn(
                `⚠️ [OpenRouter] Model ${modelToUse} đang bị nghẽn upstream (shared pool). Tự động chuyển ngay sang model dự phòng kế tiếp!`
              );
              break;
            }

            console.warn(
              `⚠️ [OpenRouter] HTTP ${response.status} với Key #${activeIndex + 1}. Thử Key kế...`
            );
            continue;
          }

          if (!response.ok) {
            const errText = await response.text();
            console.warn(`⚠️ [OpenRouter] HTTP ${response.status}: ${errText.slice(0, 150)}`);
            continue;
          }

          const data = await response.json();

          // OpenRouter thường trả HTTP 200 nhưng bên trong có object error (429 upstream rate-limit)
          if (data.error) {
            console.warn(
              `⚠️ [OpenRouter] Lỗi từ upstream cho ${modelToUse}:`,
              data.error.message || JSON.stringify(data.error)
            );
            // Model này đang bị nghẽn upstream, thoát vòng lặp key để chuyển sang model kế tiếp
            break;
          }

          const messageObj = data.choices?.[0]?.message;
          const reply = (messageObj?.content || messageObj?.reasoning || "").trim();

          if (!reply) {
            console.warn(`⚠️ [OpenRouter] Model ${modelToUse} trả về nội dung trống, thử tiếp...`);
            continue;
          }

          return {
            content: reply,
            keyIndexUsed: activeIndex + 1,
          };
        } catch (err: any) {
          console.warn(`❌ [OpenRouter] Ngoại lệ khi gọi model ${modelToUse}:`, err.message);
          continue;
        }
      }
    }

    throw new Error(
      "Các mô hình AI miễn phí hiện đang trong giờ cao điểm hoặc tạm thời nghẽn. Bạn vui lòng thử lại sau 1-2 phút nhé!"
    );
  }
}

export const keyRotator = new KeyRotator();
