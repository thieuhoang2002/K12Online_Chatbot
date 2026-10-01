import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/zeroKnowledge";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Yêu cầu quyền Quản trị viên để thực hiện thử nghiệm" },
        { status: 403 }
      );
    }

    const hasBotToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID);

    if (!hasBotToken || !hasChatId) {
      return NextResponse.json({
        success: false,
        error: "Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong biến môi trường (.env.local / Vercel)",
      });
    }

    const result = await sendTelegramAlert(
      "Thử Nghiệm Kết Nối Telegram Webhook",
      {
        "Người thực hiện": email,
        "Trạng thái": "Kết nối thành công 100%",
        "Ghi chú": "Hệ thống sẵn sàng nhận cảnh báo sự cố tự động!",
      },
      "info"
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || "Gửi tin nhắn qua Telegram thất bại",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Đã gửi tin nhắn thử nghiệm thành công tới Telegram của bạn!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi thực thi Telegram: " + err.message },
      { status: 500 }
    );
  }
}
