# 🎓 Trợ Lý AI K12Online - Cộng Đồng Giáo Dục (Phi Lợi Nhuận)

Ứng dụng Chatbot AI thông minh hỗ trợ Quý Thầy/Cô giáo và Cán bộ IT nhà trường tra cứu nhanh các quy trình, thao tác nghiệp vụ trên nền tảng **K12Online (Viettel)**.

🌐 **Địa chỉ truy cập chính thức:** [https://k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn)  
*(Địa chỉ dự phòng Vercel: [https://k12-online-chatbot.vercel.app](https://k12-online-chatbot.vercel.app))*

> **⚠️ Tuyên bố bản quyền & Miễn trừ trách nhiệm:**  
> Đây là dự án độc lập vì cộng đồng giáo dục, phi thương mại. Dự án không thuộc quyền quản lý hay đại diện chính thức cho Tập đoàn Viettel. Dữ liệu được trích xuất nhằm mục đích hỗ trợ học thuật và tra cứu công khai.

---

## 🌟 Điểm nổi bật của dự án

1. **Tra cứu tự do (Guest Mode):** Thầy/Cô vào web là có thể đặt câu hỏi ngay mà không bắt buộc phải đăng nhập.
2. **Kỹ năng Xoay Key & Chuyển vùng siêu tốc (Multi-Key Rotation & Fast Failover):**
   - Hỗ trợ khai báo nhiều API Key từ các tài khoản Google clone trên OpenRouter, tự động xoay vòng Round-Robin.
   - Khi model chính (`Qwen 3.8 27B`) chạm ngưỡng giới hạn nguồn chung (429 upstream pool), hệ thống tự động nhảy sang `NVIDIA Nemotron 3 Ultra 550B` hoặc `Google Gemma 4 31B` trong 0.1 giây mà không ngắt quãng.
3. **Bộ nhớ đệm kép siêu tốc (Upstash Redis + RAM Cache):**
   - Các câu hỏi trùng lặp được trả lời ngay tức thì (~30ms) từ Upstash Redis Cloud, tiết kiệm 100% token gọi AI.
4. **Cơ sở tri thức chuẩn xác (RAG Engine):**
   - Tích hợp 88+ bài viết nghiệp vụ chính thống của K12Online trong thư mục `data/articles/`, kèm đường link trích dẫn bài viết gốc của Viettel dưới mỗi câu trả lời.
5. **Bảo mật & Chống Spam đa tầng:**
   - **Cloudflare Turnstile:** Xác minh người thật, chặn bot quấy rối cả ở Frontend và Backend (403 Forbidden nếu không có token hợp lệ).
   - **Rate Limiting theo IP:** Tối đa 20 câu hỏi / phút / IP qua Upstash Redis (chặn 429 Too Many Requests).
   - **Giới hạn Payload:** Tối đa 1.500 ký tự / câu hỏi, ngăn chặn hành vi flood token.
6. **Đồng bộ đám mây (Supabase BaaS):** Hỗ trợ đăng nhập và đồng bộ lịch sử hội thoại khi người dùng có nhu cầu.

---

## 🚀 Khởi động nhanh (Quick Start cho Lập trình viên)

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
2. Cấu hình biến môi trường trong file `.env.local` (xem chi tiết tại [GUIDE.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/GUIDE.md)):
   ```env
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=...
   CLOUDFLARE_TURNSTILE_SECRET_KEY=...
   ```
3. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt tại địa chỉ: `http://localhost:3000`.

---

## 📚 Hệ thống Tài liệu Dự án

- [DATA_MANAGEMENT.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/DATA_MANAGEMENT.md): **Cẩm nang thêm, xóa, sửa dữ liệu bài viết nghiệp vụ K12Online.**
- [TODO.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TODO.md): Lộ trình phát triển và tiến độ các giai đoạn dự án.
- [TODOBUG.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TODOBUG.md): Nhật ký theo dõi lỗi kỹ thuật, kẽ hở bảo mật và các bản vá đã triển khai.
- [TECHSTACK.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TECHSTACK.md): Báo cáo chi tiết kiến trúc công nghệ toàn hệ thống.
- [HANDOVER.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/HANDOVER.md): Tài liệu bàn giao kiến trúc và luồng xử lý sản phẩm.
- [GUIDE.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/GUIDE.md): Cẩm nang hướng dẫn cài đặt và cấu hình chi tiết từ A - Z.
