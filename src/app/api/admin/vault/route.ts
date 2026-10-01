import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdminEmail, AdminVaultRecord } from "@/lib/zeroKnowledge";

// Bộ nhớ dự phòng server nếu Supabase chưa chạy script migration
const memoryVaults = new Map<string, AdminVaultRecord>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Tài khoản không nằm trong danh sách Quản trị viên được cấp phép" },
        { status: 403 }
      );
    }

    // 1. Thử lấy từ Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("admin_vault")
          .select("email, ciphertext, salt, iv, hint, updated_at")
          .eq("email", email)
          .maybeSingle();

        if (!error && data) {
          return NextResponse.json({ success: true, vault: data });
        }
      } catch (e) {}
    }

    // 2. Thử lấy từ memory cache
    const mem = memoryVaults.get(email);
    return NextResponse.json({ success: true, vault: mem || null });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi kiểm tra Vault: " + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, ciphertext, salt, iv, hint } = body;

    const normalizedEmail = (email || "").toLowerCase().trim();
    if (!normalizedEmail || !isAdminEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Tài khoản không được cấp phép khởi tạo Vault Quản trị" },
        { status: 403 }
      );
    }

    if (!ciphertext || !salt || !iv) {
      return NextResponse.json(
        { error: "Dữ liệu mã hóa Zero-Knowledge không đầy đủ (thiếu ciphertext, salt hoặc iv)" },
        { status: 400 }
      );
    }

    const record: AdminVaultRecord = {
      email: normalizedEmail,
      ciphertext,
      salt,
      iv,
      hint: hint || "",
      updated_at: new Date().toISOString(),
    };

    // 1. Lưu vào Supabase nếu có
    if (supabase) {
      try {
        const { error } = await supabase.from("admin_vault").upsert(record, {
          onConflict: "email",
        });
        if (error && error.code !== "PGRST205") {
          console.warn("⚠️ [Supabase Vault] Lưu cảnh báo:", error.message);
        }
      } catch (dbErr) {
        console.warn("⚠️ [Supabase Vault] Lỗi upsert bảng admin_vault:", dbErr);
      }
    }

    // 2. Lưu vào memory cache
    memoryVaults.set(normalizedEmail, record);

    return NextResponse.json({ success: true, message: "Lưu Vault thành công" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Lỗi lưu Vault: " + err.message },
      { status: 500 }
    );
  }
}
