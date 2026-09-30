# 🤝 TÀI LIỆU BÀN GIAO DỰ ÁN (HANDOVER) - K12ONLINE CHATBOT

## 1. Tổng quan Sản phẩm Bàn giao
- **Tên dự án:** Trợ Lý AI Hỗ Trợ Nghiệp Vụ K12Online (Dự án Cộng đồng Phi Lợi Nhuận).
- **Tên miền Production:** [https://k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn)
- **Tên miền dự phòng Vercel:** [https://k12-online-chatbot.vercel.app](https://k12-online-chatbot.vercel.app)
- **Kho mã nguồn GitHub:** `https://github.com/thieuhoang2002/K12Online_Chatbot.git` (Nhánh `main`)
- **Mã nguồn cục bộ:** `C:\Users\thhoang\Desktop\K12Online_Chatbot`

---

## 2. Các Thành phần Hệ thống đã Hoàn thiện

### 2.1. Động cơ AI & Xoay Khóa Tự động
- **Mã nguồn:** `src/lib/openrouter.ts`
- **Tính năng:**
  - Hỗ trợ xoay tua nhiều khóa API OpenRouter (`OPENROUTER_API_KEYS=key1,key2,key3`).
  - Tự động nhận diện lỗi quá tải tài nguyên dùng chung (429 upstream pool) và chuyển đổi tức thì sang mô hình dự phòng `Nemotron 550B` hoặc `Gemma 31B` trong 0.1s.

### 2.2. Cơ sở Tri thức & Tìm kiếm Ngữ cảnh (RAG)
- **Mã nguồn:** `src/lib/knowledge.ts`
- **Thư mục dữ liệu:** `data/articles/` (chứa 88+ bài viết nghiệp vụ chuẩn của Viettel K12Online).
- **Quy trình quản lý dữ liệu:** Xem chi tiết tại [DATA_MANAGEMENT.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/DATA_MANAGEMENT.md).

### 2.3. Bộ nhớ Đệm & Tăng tốc (Hybrid Caching)
- **Mã nguồn:** `src/lib/cache.ts`
- **Dịch vụ sử dụng:** Upstash Redis Cloud (`UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`).
- **Hiệu quả:** Phản hồi câu hỏi đã có sẵn trong 30ms, tiết kiệm 100% chi phí và hạn ngạch gọi AI.

### 2.4. Hệ thống Phòng thủ & Chống Spam (Security)
- **Mã nguồn:** `src/app/api/chat/route.ts` & `src/lib/ratelimit.ts`
- **Các tầng bảo vệ:**
  1. **Cloudflare Turnstile:** Bắt buộc xác minh hợp lệ phía server (trả về 403 Forbidden nếu cố tình vượt mặt giao diện).
  2. **Rate Limiting:** Giới hạn 20 câu hỏi / phút cho mỗi địa chỉ IP thông qua Upstash Redis (trả về 429 Too Many Requests).
  3. **Payload Limit:** Khống chế độ dài tối đa 1.500 ký tự / câu hỏi (trả về 400 Bad Request).

---

## 3. Danh sách Biến Môi trường Cần thiết (.env.local)

```env
# OpenRouter API Keys (cách nhau bởi dấu phẩy)
OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2,sk-or-v1-key3

# Upstash Redis Cloud Cache & Rate Limiting
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Cloudflare Turnstile
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA...
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA...

# Supabase Auth & BaaS
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 4. Hướng dẫn Vận hành & Cập nhật Dự án

1. **Khởi động chạy thử tại máy cục bộ:**
   ```powershell
   npm run dev
   ```
   Truy cập `http://localhost:3000`.

2. **Cập nhật tính năng hoặc dữ liệu mới:**
   Chỉnh sửa code hoặc thêm file trong `data/articles/`, sau đó chạy:
   ```powershell
   git add .
   git commit -m "Nội dung cập nhật"
   git push origin main
   ```
   Vercel sẽ tự động build và cập nhật trực tiếp lên trang web production sau 1 phút.
