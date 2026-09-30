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
   * Gọi OpenRouter API với cơ chế xoay vòng và tự động nhảy Key khi bị 429
   */
  public async callChatCompletion(
    messages: ChatMessage[],
    model: string = "nvidia/nemotron-3-ultra-550b-a55b:free"
  ): Promise<{ content: string; keyIndexUsed: number }> {
    if (this.keys.length === 0) {
      throw new Error("Chưa cấu hình OPENROUTER_API_KEYS trong file môi trường .env.local.");
    }

    const totalKeys = this.keys.length;
    let attempts = 0;

    while (attempts < totalKeys) {
      const activeIndex = this.currentIndex;
      const apiKey = this.keys[activeIndex];

      // Di chuyển con trỏ sang key tiếp theo cho lượt sau (Round-Robin)
      this.currentIndex = (this.currentIndex + 1) % totalKeys;

      const maskedKey = apiKey.slice(0, 8) + "..." + apiKey.slice(-4);
      console.log(`[OpenRouter] Sử dụng Key #${activeIndex + 1}/${totalKeys} (${maskedKey}) | Model: ${model}`);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://k12online-assistant.edu.vn",
            "X-Title": "K12Online Community AI Assistant",
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.3,
          }),
        });

        // Nếu dính Rate Limit (429) hoặc Quota hết (402), tự động thử key kế tiếp
        if (response.status === 429 || response.status === 402) {
          console.warn(`⚠️ [OpenRouter] Key #${activeIndex + 1} bị Rate Limit (${response.status}). Tự động nhảy sang Key kế tiếp...`);
          attempts++;
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter trả về mã lỗi ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "Không có phản hồi từ mô hình.";

        return {
          content: reply,
          keyIndexUsed: activeIndex + 1,
        };
      } catch (err: any) {
        console.error(`❌ [OpenRouter] Lỗi khi gọi với Key #${activeIndex + 1}:`, err.message);
        attempts++;
        if (attempts >= totalKeys) {
          throw new Error(`Tất cả ${totalKeys} API Key đều bị lỗi hoặc hết hạn mức: ${err.message}`);
        }
      }
    }

    throw new Error("Không thể hoàn thành yêu cầu sau khi thử toàn bộ danh sách API Key.");
  }
}

export const keyRotator = new KeyRotator();
