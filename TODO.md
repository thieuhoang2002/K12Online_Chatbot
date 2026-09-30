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

## Giai đoạn 4: Quản lý Phiên & Dữ liệu Người dùng (Supabase) - [ĐANG TRIỂN KHAI]
- [x] Tích hợp Supabase Client & Supabase Auth (Đăng nhập Email / Google).
- [x] Sửa lỗi khởi tạo phiên chat ban đầu trên trình duyệt mới / chế độ ẩn danh.
- [ ] Bật tiện ích `pgvector` trên PostgreSQL của Supabase để nâng cấp tìm kiếm ngữ nghĩa sâu (Semantic Vector Search).
- [ ] Lưu trữ và đồng bộ hóa lịch sử hội thoại lên bảng `chat_sessions` trên Supabase Database.

---

## Giai đoạn 5: Mở rộng Đa Kênh & Tương tác Cộng đồng - [KẾ HOẠCH TIẾP THEO]
- [ ] Thêm nút đánh giá chất lượng câu trả lời (Hữu ích / Chưa chính xác) để tiếp tục tinh chỉnh dữ liệu.
- [ ] Xây dựng Webhook kết nối Zalo OA / Zalo Bot để giáo viên nhắn tin hỏi trực tiếp qua điện thoại.
- [ ] Cung cấp giao diện Admin nội bộ để quản trị viên có thể xem thống kê câu hỏi phổ biến và cập nhật bài viết trực tiếp từ trình duyệt.
