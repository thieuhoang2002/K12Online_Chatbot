/**
 * TELEGRAM WEBHOOK ALERT MODULE - K12ONLINE CHATBOT
 * -------------------------------------------------------------
 * Tự động gửi tin nhắn cảnh báo tức thì về Telegram khi:
 * 1. Có IP vượt ngưỡng Rate Limit (Spam 20 req/phút).
 * 2. Động cơ AI chuyển vùng (Gemini 429 Failover sang OpenRouter).
 * 3. Người dùng gửi đánh giá Chưa hài lòng (Dislike kèm lý do).
 * 4. Phát hiện lỗi nghiêm trọng 500 hoặc sự cố hệ thống.
 */

interface AlertDetails {
  [key: string]: any;
}

export async function sendTelegramAlert(
  title: string,
  details: AlertDetails = {},
  level: "error" | "warning" | "info" | "feedback" = "info"
): Promise<{ success: boolean; mocked?: boolean; error?: string }> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID || "").trim();

  // Xác định biểu tượng theo mức độ nghiêm trọng
  let icon = "ℹ️";
  if (level === "error") icon = "🚨";
  if (level === "warning") icon = "⚠️";
  if (level === "feedback") icon = "💬";

  const timeStr = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  // Soạn nội dung tin nhắn HTML đẹp mắt chuẩn Telegram Bot
  let message = `${icon} <b>[K12ONLINE SYSTEM ALERT]</b>\n`;
  message += `📌 <b>Sự kiện:</b> <code>${escapeHtml(title)}</code>\n`;
  message += `⏰ <b>Thời gian:</b> <i>${timeStr} (GMT+7)</i>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;

  for (const [key, value] of Object.entries(details)) {
    if (value !== undefined && value !== null && value !== "") {
      const valStr = typeof value === "object" ? JSON.stringify(value) : String(value);
      message += `• <b>${escapeHtml(key)}:</b> <code>${escapeHtml(valStr)}</code>\n`;
    }
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🔗 <i>K12Online AI Assistant • Internal Monitoring</i>`;

  // 1. Nếu chưa cấu hình TELEGRAM_BOT_TOKEN hoặc CHAT_ID -> Ghi log server (Mock mode)
  if (!botToken || !chatId) {
    console.log(`📱 [Telegram Alert Mock (${level.toUpperCase()})]:`, title, details);
    return { success: true, mocked: true };
  }

  // 2. Gửi thật qua Telegram Bot API
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn("⚠️ [Telegram Alert Error]:", data.description || "Gửi thất bại");
      return { success: false, error: data.description };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("⚠️ [Telegram Alert Network Error]:", err.message);
    return { success: false, error: err.message };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
