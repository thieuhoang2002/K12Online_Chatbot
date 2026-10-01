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
   *(Hệ thống hỗ trợ tự động các alias biến môi trường trên Vercel: `GEMINI_API_KEYS`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`)*.

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
3. Chạy file SQL khởi tạo cấu trúc bảng (`supabase/schema.sql`) trong mục **SQL Editor** trên Supabase Dashboard để tạo các bảng `chat_sessions`, `chat_messages`, `chat_feedback` và `admin_vault`.

### 2.6. Cấu hình Telegram Bot (Cảnh báo Lỗi Tự động)
1. Mở ứng dụng Telegram, tìm bot **@BotFather**.
2. Gửi lệnh `/newbot`, đặt tên bot (ví dụ: `K12Online Alert Bot`) và username (ví dụ: `k12online_alert_bot`).
3. Copy chuỗi mã **HTTP API Token** được cấp:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
   ```
4. Để lấy `TELEGRAM_CHAT_ID`:
   - **Gửi về tin nhắn riêng:** Tìm bot **@userinfobot**, bấm Start, bot sẽ trả về số `Id` của bạn (ví dụ: `123456789`).
   - **Gửi về nhóm giám sát:** Tạo một nhóm Telegram, mời Bot của bạn vào nhóm, sau đó add bot **@RawDataBot** để lấy `chat_id` của nhóm (thường có dạng số âm bắt đầu bằng `-100...`).
   ```env
   TELEGRAM_CHAT_ID=-1001234567890
   ```
5. Đừng quên thêm 2 biến này vào cả **Environment Variables trên Vercel Project Settings** để hệ thống Production tự động gửi thông báo.

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

## 4. Hướng dẫn Quản trị Dashboard Zero-Knowledge (`/admin`)

Hệ thống cung cấp trang quản trị nội bộ bảo vệ đa tầng tại đường dẫn `/admin`:

1. **Điều kiện truy cập:**
   - Bạn phải đăng nhập tài khoản nằm trong Whitelist: `thieuhoangent@gmail.com` hoặc `thieuviethoang7b@gmail.com`.
   - Sau khi đăng nhập thành công, nút **Admin** sẽ tự động hiển thị ở thanh Header (cạnh nút chuyển sáng/tối) và trong Sidebar bên trái.
2. **Khóa Mã hóa Zero-Knowledge:**
   - Khi bấm vào nút Admin hoặc truy cập `/admin`, modal bảo mật **Zero-Knowledge Lock** sẽ xuất hiện.
   - **Lần đầu sử dụng:** Nhập mật mã Master Password muốn thiết lập và gợi ý (Hint). Mật khẩu được sinh khóa PBKDF2 (100.000 vòng SHA-256) và mã hóa AES-256-GCM trực tiếp trên trình duyệt rồi mới gửi ciphertext lên database `admin_vault`.
   - **Các lần sau:** Nhập đúng Master Password để giải mã ciphertext cục bộ. Nếu nhập sai hoặc ciphertext bị sửa đổi dù 1 bit, Authentication Tag sẽ báo lỗi ngay lập tức.
3. **Các tính năng trên Dashboard:**
   - **Thống kê Tổng quan (KPIs):** Tổng phiên chat, tổng tin nhắn, đánh giá Like/Dislike, tỷ lệ hài lòng (%).
   - **Quản lý Đánh giá (Feedback):** Xem chi tiết ý kiến đóng góp của giáo viên, lọc theo Like / Dislike, tìm kiếm theo lý do và nội dung góp ý.
   - **Tra cứu Tri thức (Knowledge Base Inspector):** Xem trực tiếp toàn bộ 383 bài viết nghiệp vụ, tìm kiếm nhanh theo tiêu đề/chuyên mục và click xem link gốc trên cổng Viettel.
   - **Mã nhúng Widget:** Tạo và sao chép sẵn đoạn mã `<script>` để nhúng vào website trường học kèm khung xem trước.
   - **Kiểm tra Cảnh báo Telegram:** Nút bấm thử nghiệm gửi ngay 1 tin nhắn test đến Telegram để kiểm tra kết nối webhook.

---

## 5. Hướng dẫn Nhúng Widget vào Website Trường học

Để tích hợp Chatbot K12Online vào cổng thông tin hoặc website trường học:

Chỉ cần sao chép đoạn mã sau và dán vào trước thẻ đóng `</body>` của website trường:

```html
<!-- K12Online AI Chatbot Widget -->
<script src="https://k12onlinechatbot.thhoang.io.vn/widget.js" async></script>
```

- Bong bóng chat tròn sẽ tự động hiển thị ở góc dưới cùng bên phải.
- Khi người dùng bấm vào, cửa sổ chat mượt mà sẽ mở lên mà không ảnh hưởng tới layout trang web hiện tại.
- Chuẩn hóa Responsive hoàn hảo trên cả điện thoại (tự động bung full màn hình) và máy tính.

---

## 6. Biên dịch & Triển khai lên Production (Vercel)

```powershell
# 1. Kiểm tra build cục bộ
npm run build

# 2. Đẩy mã nguồn lên GitHub (nhánh dev)
git add .
git commit -m "feat: cập nhật tính năng mới"
git push origin dev

# 3. Đồng bộ sang nhánh main (cho Vercel Production)
git checkout main
git merge dev
git push origin main
git checkout dev
```

Hệ thống CI/CD của Vercel sẽ tự động:
1. Chạy lệnh `prebuild` (`node scripts/build_knowledge_json.js`) để nạp 383 bài viết vào file JSON.
2. Chạy `next build` tối ưu hóa static pages và serverless routes.
3. Xuất bản phiên bản mới lên tên miền [https://k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn).

---

## 7. Hướng dẫn Chạy Kiểm thử Tự động (Automation Testing)

Để kiểm tra độ ổn định và tính toàn vẹn của toàn bộ hệ thống sau mỗi lần nâng cấp code hoặc cập nhật dữ liệu:

```powershell
npm test
# hoặc
node tests/run_all_tests.js
```

- Hệ thống sẽ tự động thực thi **40 Test Cases** bao phủ từ RAG, Mật mã Zero-Knowledge, Rate Limiting, API Routes, nhúng Widget đến Webhook Telegram.
- Báo cáo kết quả kiểm thử chuẩn Markdown với đầy đủ thông số đo lường độ trễ (latency benchmarks) sẽ tự động được cập nhật tại [tests/test_report.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/tests/test_report.md).

