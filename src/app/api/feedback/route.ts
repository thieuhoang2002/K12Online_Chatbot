import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Bộ nhớ đệm tạm thời cho feedback trên RAM server phòng trường hợp chưa chạy SQL Supabase
const memoryFeedbacks: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      messageIndex,
      userEmail,
      rating,
      reason,
      comment,
      query,
      reply,
    } = body;

    if (!rating || !["like", "dislike"].includes(rating)) {
      return NextResponse.json(
        { error: "Định dạng đánh giá không hợp lệ (phải là like hoặc dislike)" },
        { status: 400 }
      );
    }

    const feedbackItem = {
      id: "fb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      session_id: sessionId || null,
      message_index: typeof messageIndex === "number" ? messageIndex : null,
      user_email: userEmail || "anonymous",
      rating,
      reason: reason || null,
      comment: comment || null,
      query: (query || "").slice(0, 500),
      reply: (reply || "").slice(0, 1000),
      created_at: new Date().toISOString(),
    };

    // 1. Lưu vào Supabase nếu có
    if (supabase) {
      try {
        const { error } = await supabase.from("chat_feedback").insert(feedbackItem);
        if (error && error.code !== "PGRST205") {
          console.warn("⚠️ [Supabase Feedback] Ghi database cảnh báo:", error.message);
        }
      } catch (dbErr) {
        console.warn("⚠️ [Supabase Feedback] Không thể ghi bảng chat_feedback:", dbErr);
      }
    }

    // 2. Lưu vào RAM bộ nhớ đệm (giữ tối đa 200 bản ghi gần nhất)
    memoryFeedbacks.unshift(feedbackItem);
    if (memoryFeedbacks.length > 200) {
      memoryFeedbacks.pop();
    }

    return NextResponse.json({ success: true, feedback: feedbackItem });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi xử lý đánh giá: " + err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    let feedbacks = [...memoryFeedbacks];

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("chat_feedback")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          feedbacks = data;
        }
      } catch (e) {}
    }

    const total = feedbacks.length;
    const likes = feedbacks.filter((f) => f.rating === "like").length;
    const dislikes = feedbacks.filter((f) => f.rating === "dislike").length;
    const satisfactionRate = total > 0 ? Math.round((likes / total) * 100) : 100;

    return NextResponse.json({
      success: true,
      total,
      likes,
      dislikes,
      satisfactionRate,
      feedbacks: feedbacks.slice(0, 50),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi tải danh sách feedback: " + err.message },
      { status: 500 }
    );
  }
}
