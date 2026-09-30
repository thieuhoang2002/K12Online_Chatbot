# 📖 CẨM NANG CÀI ĐẶT & VẬN HÀNH (GUIDE) - K12ONLINE CHATBOT

Tài liệu hướng dẫn chi tiết từ lúc khởi tạo mã nguồn, cấu hình các dịch vụ bên thứ ba (OpenRouter, Cloudflare, Upstash, Supabase) cho đến khi đưa lên môi trường Production.

---

## 1. Yêu cầu Môi trường
- Đã cài đặt **Node.js** phiên bản `>= 18.x`.
- Trình quản lý gói **npm** đi kèm.
- Công cụ **Git**.

---

## 2. Hướng dẫn Lấy Khóa & Cấu hình Biến Môi trường (.env.local)

Tạo file `.env.local` tại thư mục gốc của dự án và điền các tham số sau:

### 2.1. Cấu hình OpenRouter (Bộ não AI)
1. Đăng ký tài khoản tại [openrouter.ai](https://openrouter.ai).
2. Vào mục **Keys** tạo API Key mới.
3. Nếu bạn có nhiều tài khoản Google, hãy tạo mỗi tài khoản 1 Key rồi dán cách nhau bằng dấu phẩy:
   ```env
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2,sk-or-v1-key3
   ```

### 2.2. Cấu hình Upstash Redis (Bộ nhớ đệm & Chống spam)
1. Đăng nhập [console.upstash.com](https://console.upstash.com) (hoàn toàn miễn phí).
2. Bấm **Create Database** > Chọn khu vực Singapore hoặc gần nhất.
3. Cuộn xuống mục **REST API**, chọn tab `.env` và copy 2 biến:
   ```env
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=...
   ```

### 2.3. Cấu hình Cloudflare Turnstile (Xác minh chống bot)
1. Đăng nhập [dash.cloudflare.com](https://dash.cloudflare.com) > Chọn mục **Turnstile** > **Add Widget**.
2. Thêm domain của bạn (ví dụ: `k12onlinechatbot.thhoang.io.vn` và `localhost`).
3. Lấy `Site Key` và `Secret Key`:
   ```env
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA...
   CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA...
   ```

### 2.4. Cấu hình Supabase (Đăng nhập & Lưu trữ)
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

# 2. Khởi chạy server phát triển
npm run dev
```

Mở trình duyệt tại: 👉 **`http://localhost:3000`**

---

## 4. Triển khai lên Vercel & Gắn Tên miền Riêng (Custom Domain)

1. Đẩy toàn bộ mã nguồn lên GitHub của bạn:
   ```powershell
   git add .
   git commit -m "Deploy project"
   git push origin main
   ```
2. Đăng nhập [vercel.com](https://vercel.com) > Bấm **Add New... > Project** > Chọn kho mã nguồn `K12Online_Chatbot`.
3. Trong phần **Environment Variables**, thêm đầy đủ các biến từ file `.env.local` ở bước 2.
4. Bấm **Deploy**.
5. Để gắn tên miền riêng:
   - Vào mục **Settings > Domains** trên trang dự án Vercel.
   - Thêm tên miền: `k12onlinechatbot.thhoang.io.vn`.
   - Vào trang quản lý DNS tên miền của bạn, tạo bản ghi `CNAME` trỏ về: `cname.vercel-dns.com`.
