# 🎓 Trợ Lý AI K12Online - Cộng Đồng Giáo Dục (Phi Lợi Nhuận)

Ứng dụng Chatbot AI thông minh hỗ trợ Quý Thầy/Cô giáo và Cán bộ IT nhà trường tra cứu nhanh các quy trình, thao tác nghiệp vụ trên nền tảng **K12Online (Viettel)**.

🌐 **Địa chỉ truy cập chính thức:** [https://k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn)  
*(Địa chỉ dự phòng Vercel: [https://k12-online-chatbot.vercel.app](https://k12-online-chatbot.vercel.app))*

> **⚠️ Tuyên bố bản quyền & Miễn trừ trách nhiệm:**  
> Đây là dự án độc lập vì cộng đồng giáo dục, phi thương mại. Dự án không thuộc quyền quản lý hay đại diện chính thức cho Tập đoàn Viettel. Dữ liệu được trích xuất nhằm mục đích hỗ trợ học thuật và tra cứu công khai.

---

## 🌟 Điểm nổi bật của dự án

1. **Tra cứu tự do (Guest Mode):** Thầy/Cô vào web là có thể đặt câu hỏi ngay mà không bắt buộc phải đăng nhập.
2. **Kiến trúc AI Động cơ kép (Dual-Engine AI Architecture):**
   - **Google Gemini 3.8 Flash (Động cơ chính):** Xử lý ngữ cảnh siêu rộng, dung lượng phản hồi mở rộng đến 8.192 tokens, văn phong sư phạm tiếng Việt chuẩn mực. Hỗ trợ xoay vòng nhiều API Key tự động.
   - **OpenRouter Multi-Key Pool (Động cơ dự phòng):** Bể xoay vòng nhiều Key với cơ chế Fast Failover (tự động chuyển đổi `Qwen 3.8 27B` ➔ `NVIDIA Nemotron 3 Ultra 550B` ➔ `Google Gemma 4 31B` trong 0.1s khi gặp 429).
3. **Cơ chế Phản hồi Soạn sẵn Siêu tốc (Pre-baked Warm Cache Streaming):**
   - Giải quyết triệt để lỗi nghẽn context hoặc cắt cụt văn bản đối với các bài cẩm nang khổng lồ (như bài *Thư viện số* dài hơn 67.000 ký tự).
   - Phản hồi **ngay lập tức (0ms latency, tiêu tốn 0 token AI)** với đầy đủ 7 phân hệ chi tiết, truyền tải qua luồng SSE gõ từng cụm 3 từ mỗi 15ms như AI đang sinh văn bản thật.
4. **Bộ nhớ đệm đa tầng (Upstash Redis Cloud + In-Memory RAM Cache):**
   - Các câu hỏi trùng lặp được trả lời ngay tức thì (~30ms) từ Upstash Redis Cloud, tiết kiệm 100% token gọi AI.
5. **Kho tri thức bao phủ 100% K12Online (RAG Engine):**
   - Tích hợp trọn bộ **383 bài viết nghiệp vụ chính thức** được biên dịch thành file JSON siêu tốc (`data/k12_knowledge.json`).
   - 100% câu trả lời đều đính kèm thẻ trích dẫn nguồn dẫn trực tiếp đến đúng đường link `.html` chi tiết trên cổng hỗ trợ K12Online của Viettel.
6. **Thẻ gợi ý thông minh 1 chạm (Contextual Follow-up Cards):**
   - Tự động gợi ý 2–3 câu hỏi ngữ cảnh tiếp theo phù hợp với từng chủ đề (đề thi, bài tập, thời khóa biểu, thư viện số, học phí...), có cơ chế tự động cuộn giao diện mượt mà.
7. **Bảo mật & Chống Spam đa tầng:**
   - **Cloudflare Turnstile:** Xác minh người thật, chặn bot quấy rối cả ở Frontend và Backend (403 Forbidden nếu không có token hợp lệ).
   - **Rate Limiting theo IP:** Tối đa 20 câu hỏi / phút / IP qua Upstash Redis (chặn 429 Too Many Requests).
   - **Giới hạn Payload:** Tối đa 1.500 ký tự / câu hỏi, ngăn chặn hành vi flood token.
8. **Đồng bộ đám mây (Supabase BaaS):** Hỗ trợ đăng nhập và đồng bộ lịch sử hội thoại khi người dùng có nhu cầu.

---

## 🚀 Khởi động nhanh (Quick Start cho Lập trình viên)

1. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
2. Cấu hình biến môi trường trong file `.env.local` (xem chi tiết tại [GUIDE.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/GUIDE.md)):
   ```env
   # Google Gemini API Keys (Động cơ chính, cách nhau dấu phẩy)
   GEMINI_API_KEYS=AIzaSyA...Key1,AIzaSyB...Key2

   # OpenRouter API Keys (Động cơ dự phòng, cách nhau dấu phẩy)
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2

   # Upstash Redis Cloud Cache & Rate Limiting
   UPSTASH_REDIS_REST_URL=https://...upstash.io
   UPSTASH_REDIS_REST_TOKEN=...

   # Cloudflare Turnstile
   NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA...
   CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA...
   ```
3. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt tại địa chỉ: `http://localhost:3000`.

---

## 📚 Hệ thống Tài liệu Dự án

- [DATA_MANAGEMENT.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/DATA_MANAGEMENT.md): **Cẩm nang quản lý kho tri thức 383 bài viết và cấu hình Pre-baked Answers.**
- [TECHSTACK.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TECHSTACK.md): Báo cáo chi tiết kiến trúc công nghệ Dual-Engine AI toàn hệ thống.
- [TODO.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TODO.md): Lộ trình phát triển và tiến độ các giai đoạn dự án.
- [TODOBUG.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/TODOBUG.md): Nhật ký theo dõi lỗi kỹ thuật, kẽ hở bảo mật và các bản vá đã triển khai.
- [HANDOVER.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/HANDOVER.md): Tài liệu bàn giao kiến trúc và luồng xử lý sản phẩm.
- [GUIDE.md](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/GUIDE.md): Cẩm nang hướng dẫn cài đặt và cấu hình chi tiết từ A - Z.
