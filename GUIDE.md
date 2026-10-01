# 📖 CẨM NANG CÀI ĐẶT & VẬN HÀNH (GUIDE) - K12ONLINE CHATBOT

Tài liệu hướng dẫn chi tiết từ lúc khởi tạo mã nguồn, cấu hình các dịch vụ bên thứ ba (Google Gemini, OpenRouter, Cloudflare, Upstash, Supabase) cho đến khi đưa lên môi trường Production.

---

## 1. Yêu cầu Môi trường
- Đã cài đặt **Node.js** phiên bản `>= 18.x` (khuyên dùng Node.js 20 hoặc 22 LTS).
- Trình quản lý gói **npm** đi kèm.
- Công cụ **Git**.

---

## 2. Hướng dẫn Lấy Khóa & Cấu hình Biến Môi trường (.env.local)

Tạo file `.env.local` tại thư mục gốc của dự án (`C:\Users\thhoang\Desktop\K12Online_Chatbot\.env.local`) và cấu hình các tham số sau:

### 2.1. Cấu hình Google Gemini (Động cơ AI chính)
1. Truy cập [Google AI Studio](https://aistudio.google.com/).
2. Đăng nhập tài khoản Google và bấm **Get API key** > **Create API key**.
3. Nếu bạn có nhiều tài khoản Google, hãy tạo mỗi tài khoản 1 Key rồi dán cách nhau bằng dấu phẩy để hệ thống tự động xoay vòng hạn ngạch:
   ```env
   GEMINI_API_KEYS=AIzaSyA...Key1,AIzaSyB...Key2
   ```

### 2.2. Cấu hình OpenRouter (Động cơ AI dự phòng)
1. Đăng ký tài khoản tại [openrouter.ai](https://openrouter.ai).
2. Vào mục **Keys** tạo API Key mới.
3. Nhập danh sách các Key phân tách bằng dấu phẩy:
   ```env
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2,sk-or-v1-key3
   ```

### 2.3. Cấu hình Upstash Redis (Bộ nhớ đệm & Chống spam)
1. Đăng nhập [console.upstash.com](https://console.upstash.com) (miễn phí).
2. Bấm **Create Database** > Chọn khu vực Singapore hoặc gần nhất.
3. Cuộn xuống mục **REST API**, chọn tab `.env` và copy 2 biến:
   ```env
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```

### 2.4. Cấu hình Cloudflare Turnstile (Xác minh chống bot)
1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com) > Chọn mục **Turnstile** > **Add Widget**.
2. Thêm domain của bạn (ví dụ: `k12onlinechatbot.thhoang.io.vn` và `localhost`).
3. Lấy `Site Key` và `Secret Key`:
   ```env
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA...
   CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA...
   ```

### 2.5. Cấu hình Supabase (Đăng nhập & Lưu trữ)
1. Đăng nhập [supabase.com](https://supabase.com) > Tạo project mới.
2. Vào **Project Settings > API** copy `URL` và `anon public key`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

---

## 3. Khởi chạy dưới máy tính cá nhân (Localhost)

```powershell
# 1. Cài đặt các gói thư viện
npm install

# 2. Biên dịch dữ liệu tri thức 383 bài viết (nếu có thay đổi)
node scripts/build_knowledge_json.js

# 3. Khởi chạy server phát triển
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:3000`.

---

## 4. Biên dịch & Triển khai lên Production (Vercel)

```powershell
# 1. Kiểm tra build cục bộ
npm run build

# 2. Đẩy mã nguồn lên GitHub
git add .
git commit -m "feat: cập nhật tính năng mới"
git push origin dev
```

Hệ thống CI/CD của Vercel sẽ tự động:
1. Chạy lệnh `prebuild` (`node scripts/build_knowledge_json.js`) để nạp 383 bài viết vào file JSON.
2. Chạy `next build` tối ưu hóa static pages và serverless routes.
3. Xuất bản phiên bản mới lên tên miền [https://k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn).
