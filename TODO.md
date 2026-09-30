# 📋 DANH SÁCH VIỆC CẦN LÀM & TIẾN ĐỘ DỰ ÁN (TODO) - K12ONLINE CHATBOT

## Giai đoạn 1: Hoàn thiện bản Sơ khai (MVP) - [ĐÃ HOÀN THÀNH 100%]
- [x] Khởi tạo cấu trúc dự án Next.js 15 App Router + Tailwind CSS + Lucide Icons.
- [x] Xây dựng Engine xoay tua API Key OpenRouter (`src/lib/openrouter.ts`) hỗ trợ danh sách nhiều Key (`key1,key2,key3...`) kèm Failover tự động.
- [x] Tích hợp cơ sở tri thức K12Online (bóc tách 88+ bài viết nghiệp vụ vào `data/articles/`).
- [x] Xây dựng bộ tìm kiếm trích xuất dữ liệu (RAG search) theo ngữ cảnh câu hỏi (`src/lib/knowledge.ts`).
- [x] Giao diện Chatbot chuẩn mực giáo dục: Hướng dẫn chi tiết từng bước, xưng hô lịch sự và trích dẫn bài viết gốc.
- [x] Chế độ Khách (Guest Mode) tra cứu nhanh không cần đăng nhập.
- [x] Modal Ủng hộ (Donate / Buy me a coffee) và Tuyên bố bản quyền phi lợi nhuận.

---

## Giai đoạn 2: Tối ưu Tốc độ & Bộ nhớ Đệm (Caching) - [ĐÃ HOÀN THÀNH 100%]
- [x] Triển khai Semantic / In-Memory Caching trong RAM: Tự động ghi nhớ câu trả lời câu hỏi trùng lặp.
- [x] Tích hợp Upstash Redis Cloud Cache: Chia sẻ bộ nhớ đệm cho hàng nghìn người dùng, phản hồi siêu tốc (~30ms) và tiết kiệm 100% token AI.
- [x] Client-side Cache: Phản hồi 0.01s trên trình duyệt cho các câu hỏi lặp lại trong cùng phiên chat.
- [x] Nâng cấp cơ chế Failover OpenRouter: Tự động nhận diện lỗi 429 upstream pool để chuyển ngay lập tức sang mô hình dự phòng (`NVIDIA Nemotron 3 Ultra 550B` / `Google Gemma 4 31B`).

---

## Giai đoạn 3: Triển khai Đám mây & Bảo vệ Hệ thống - [ĐÃ HOÀN THÀNH 100%]
- [x] Đăng ký Cloudflare Turnstile Site Key & Secret Key, tích hợp widget chống bot.
- [x] Xác minh Cloudflare Turnstile nghiêm ngặt phía Backend (`POST /api/chat` trả về 403 Forbidden nếu thiếu hoặc sai token).
- [x] Giới hạn độ dài tin nhắn (Payload Size Limit): Tối đa 1.500 ký tự / câu hỏi, chống flood token.
- [x] Tích hợp Rate Limiting theo IP: Tối đa 20 câu hỏi / phút / IP qua Upstash Redis (HTTP 429 Too Many Requests).
- [x] Cấu hình Custom Domain: Gắn domain riêng [k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn) qua Vercel & DNS.
- [x] Triển khai CI/CD tự động lên Vercel Serverless.

---

## Giai đoạn 4: Quản lý Phiên & Dữ liệu Người dùng (Supabase) - [ĐANG HOÀN THIỆN]
- [x] Tích hợp Supabase Client & Supabase Auth (Đăng nhập Email / Google).
- [x] Sửa lỗi khởi tạo phiên chat ban đầu trên trình duyệt mới / chế độ ẩn danh.
- [ ] Lưu trữ và đồng bộ hóa lịch sử hội thoại lên bảng `chat_sessions` trên Supabase Database.
- [ ] Cho phép người dùng xuất (export) lịch sử trò chuyện ra file PDF / Word / Markdown.

---

## Giai đoạn 5: Tối ưu Trải nghiệm Phản hồi & Tương tác (UX/UI) - [KẾ HOẠCH TIẾP THEO]
- [ ] **Streaming Response (ReadableStream / SSE):** Hiệu ứng tuôn chữ từng từ ngay từ mili-giây thứ 300, giúp cảm giác phản hồi nhanh hơn gấp 4 lần.
- [ ] **Gợi ý câu hỏi liên quan tiếp theo (Follow-up Prompts):** Tự động hiển thị 2-3 nút gợi ý câu hỏi liên quan dưới mỗi câu trả lời (thao tác 1 chạm).
- [ ] **Bộ lọc câu hỏi xã giao (Intent Filter):** Nhận diện lời chào hỏi/cảm ơn ("Chào bạn", "Cảm ơn") để phản hồi tức thì trong 0.3s mà không tốn công quét RAG.
- [ ] **Nút Đánh giá chất lượng (Like/Dislike Feedback):** Thu thập phản hồi về độ hữu ích của câu trả lời để cải thiện chất lượng dữ liệu.

---

## Giai đoạn 6: Nâng cấp Trí thông minh & Tìm kiếm Ngữ nghĩa (Advanced RAG)
- [ ] **Từ điển đồng nghĩa Tiếng Việt (Synonym Mapping):** Ánh xạ các thuật ngữ phổ biến của giáo viên ("lập lịch dạy" -> "thời khóa biểu", "kiểm tra 15p" -> "đề thi").
- [ ] **Phân cấp tài liệu theo Vai trò (Role-based RAG):** Lọc tri thức theo đối tượng [Giáo viên] / [Học sinh] / [Nhà trường].
- [ ] **Semantic Vector Search:** Kích hoạt `pgvector` trên PostgreSQL của Supabase để tìm kiếm theo độ tương đồng ngữ nghĩa sâu.

---

## Giai đoạn 7: Mở rộng Đa Kênh & Lan tỏa Cộng đồng
- [ ] **Widget nhúng Website trường học (Embeddable Script):** Cung cấp 1 đoạn mã `<script>` để các trường nhúng trực tiếp nút chat K12 vào website của trường.
- [ ] **Tích hợp Zalo Bot / Zalo OA:** Cho phép thầy cô nhắn tin hỏi đáp trực tiếp qua ứng dụng Zalo trên điện thoại.

---

## Giai đoạn 8: Giám sát & Báo cáo Quản trị (Observability & Analytics)
- [ ] **Bảng điều khiển Thống kê (Analytics Dashboard):** Tổng hợp danh sách các câu hỏi hay gặp nhất (ẩn danh) để định hướng bổ sung tài liệu.
- [ ] **Cảnh báo lỗi tự động qua Telegram Webhook:** Thông báo tức thì khi danh sách API Key chạm ngưỡng giới hạn hoặc có đợt spam bị chặn.
