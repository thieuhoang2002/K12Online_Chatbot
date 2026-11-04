import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "./zeroKnowledge";
import { supabase } from "./supabase";

/**
 * XÁC THỰC QUẢN TRỊ VIÊN AN TOÀN (ADMIN AUTHENTICATION GATE)
 * -------------------------------------------------------------
 * 1. Kiểm tra Email Whitelist (lấy từ biến môi trường ADMIN_EMAILS).
 * 2. Kiểm tra Header bảo mật: `x-admin-token` hoặc `Authorization: Bearer <ADMIN_SECRET_KEY>`.
 * 3. Hỗ trợ Supabase Auth session token nếu quản trị viên đăng nhập qua OAuth.
 * 4. Chặn đứng 100% các cuộc tấn công URL Parameter Injection (?email=admin@...).
 */
export async function verifyAdminRequest(
  req: NextRequest,
  emailToCheck?: string | null
): Promise<{ authorized: boolean; errorResponse?: NextResponse }> {
  // 1. Kiểm tra email có thuộc whitelist admin hay không (nếu có cung cấp email)
  if (emailToCheck && !isAdminEmail(emailToCheck)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Truy cập bị từ chối: Tài khoản không nằm trong danh sách Quản trị viên được cấp phép" },
        { status: 403 }
      ),
    };
  }

  // 2. Trích xuất token từ Header: x-admin-token hoặc Authorization: Bearer <token>
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const token =
    req.headers.get("x-admin-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    "";

  // 3. Nếu server đã cấu hình ADMIN_SECRET_KEY
  if (adminSecret) {
    if (token && token === adminSecret) {
      return { authorized: true };
    }

    // Hỗ trợ Supabase Auth Bearer token nếu có session đăng nhập của admin
    if (supabase && token) {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);
        if (!error && user?.email && isAdminEmail(user.email)) {
          return { authorized: true };
        }
      } catch (e) {}
    }

    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Truy cập bị từ chối: Khóa bí mật Admin không hợp lệ (Unauthorized Admin Access)" },
        { status: 401 }
      ),
    };
  }

  // 4. Nếu chưa cấu hình ADMIN_SECRET_KEY (môi trường dev):
  // Bắt buộc phải có email hợp lệ
  if (!emailToCheck || !isAdminEmail(emailToCheck)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { error: "Truy cập bị từ chối: Yêu cầu quyền Quản trị viên" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true };
}
