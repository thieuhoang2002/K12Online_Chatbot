# 🎓 Trợ Lý AI K12Online - Cộng Đồng Giáo Dục (Phi Lợi Nhuận)

Ứng dụng Chatbot AI thông minh hỗ trợ Quý Thầy/Cô giáo và Cán bộ IT nhà trường tra cứu nhanh các quy trình, thao tác nghiệp vụ trên nền tảng **K12Online (Viettel)**.

> **⚠️ Tuyên bố bản quyền & Miễn trừ trách nhiệm:**
> Đây là dự án độc lập vì cộng đồng giáo dục, phi thương mại. Dự án không thuộc quyền quản lý hay đại diện chính thức cho Tập đoàn Viettel. Dữ liệu được trích xuất nhằm mục đích hỗ trợ học thuật và tra cứu công khai.

---

## 🌟 Điểm nổi bật của dự án

1. **Tra cứu tự do (Guest Mode):** Thầy/Cô vào web là có thể đặt câu hỏi ngay mà không bắt buộc phải đăng nhập.
2. **Kỹ năng Xoay Key (Multi-Key Rotation):** Hỗ trợ khai báo nhiều API Key từ các tài khoản Google clone trên OpenRouter, tự động xoay vòng Round-Robin và Failover khi gặp lỗi 429, giúp duy trì hệ thống chạy 24/7 hoàn toàn 0đ.
3. **Cơ sở tri thức chuẩn xác (RAG Engine):** Tích hợp hơn 88 bài viết nghiệp vụ chính thống của K12Online, kèm đường link trích dẫn bài viết gốc của Viettel dưới mỗi câu trả lời.
4. **Văn phong chuẩn mực:** Xưng hô kính cẩn ("Thầy/Cô - Em"), hướng dẫn từng bước 1, 2, 3 ngắn gọn, dễ hiểu.
5. **Bảo mật Cloudflare Turnstile:** Xác minh người dùng thông minh, chống bot quấy rối.
6. **Sẵn sàng mở rộng (Supabase):** Dễ dàng bật tính năng lưu lịch sử trò chuyện lâu dài và đồng bộ đa thiết bị khi người dùng đăng nhập.

---

## 🚀 Khởi động nhanh (Quick Start)

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
2. Cấu hình khóa API trong file `.env.local`:
   ```env
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2
   ```
3. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt tại địa chỉ: `http://localhost:3000`.

---

## 📚 Hệ thống Tài liệu Dự án
- [TODO.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TODO.md): Lộ trình phát triển các giai đoạn tiếp theo.
- [HANDOVER.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/HANDOVER.md): Tài liệu bàn giao kiến trúc và luồng xử lý.
- [TODOBUG.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TODOBUG.md): Danh mục theo dõi lỗi và cơ chế dự phòng.
- [TECHSTACK.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TECHSTACK.md): Báo cáo chi tiết kiến trúc công nghệ.
- [GUIDE.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/GUIDE.md): Cẩm nang cài đặt chi tiết từ A - Z.
