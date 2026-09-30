# 📖 HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH (GUIDE) - K12ONLINE CHATBOT

Tài liệu hướng dẫn từng bước từ lúc tải mã nguồn đến khi triển khai hoàn chỉnh.

---

## 1. Yêu cầu môi trường
- Đã cài đặt **Node.js** phiên bản `>= 18.x` (máy bạn hiện tại là v24.18.0 rất tốt).
- Tối thiểu 1 API Key từ [OpenRouter](https://openrouter.ai/keys) (hoàn toàn miễn phí).

---

## 2. Các bước cấu hình ban đầu

### Bước 1: Khai báo API Key vào file môi trường
1. Mở file `.env.local` trong thư mục dự án bằng Notepad hoặc VS Code.
2. Dán các API Key của bạn vào dòng `OPENROUTER_API_KEYS`:
   ```env
   # Nếu bạn có 1 key:
   OPENROUTER_API_KEYS=sk-or-v1-abc123xxxx

   # Nếu bạn có nhiều tài khoản clone để xoay tua chống Rate limit:
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2,sk-or-v1-key3
   ```
3. Lưu file lại.

### Bước 2: Cài đặt thư viện & Khởi động
Bạn chỉ cần nhấp đúp chuột vào file **`run.bat`** (hoặc mở Command Prompt gõ):
```bash
npm install
npm run dev
```

Sau khi màn hình hiện `Ready in ...ms`, mở trình duyệt truy cập:
👉 **`http://localhost:3000`**

---

## 3. Hướng dẫn thiết lập Supabase (Để lưu lịch sử chat qua Cloud)

*Nếu bạn chỉ muốn thử nghiệm Chế độ Khách (Guest Mode) thì bước này không bắt buộc.*

1. Đăng ký tài khoản miễn phí tại [supabase.com](https://supabase.com).
2. Tạo một **Project** mới (chọn khu vực Singapore để có tốc độ nhanh nhất về Việt Nam).
3. Vào mục **Settings > API**, copy 2 thông số:
   - `Project URL`
   - `Project API anon key`
4. Dán vào file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

## 4. Hướng dẫn thiết lập Cloudflare Turnstile (Chống Bot độc hại)

1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com).
2. Vào mục **Turnstile** ở thanh menu bên trái > Bấm **Add Widget**.
3. Đặt tên widget (Ví dụ: `K12-Chatbot`), nhập tên miền của bạn (hoặc `localhost` để test).
4. Copy `Site Key` và dán vào `.env.local`:
   ```env
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA...
   ```
