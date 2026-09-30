# 📋 DANH SÁCH VIỆC CẦN LÀM (TODO) - K12ONLINE CHATBOT

## Giai đoạn 1: Hoàn thiện bản Sơ khai (MVP) - [ĐÃ HOÀN THÀNH]
- [x] Khởi tạo cấu trúc dự án Next.js 15 App Router + Tailwind CSS.
- [x] Xây dựng Engine xoay tua API Key OpenRouter (`lib/openrouter.ts`) hỗ trợ danh sách nhiều Key (`key1,key2,key3...`) kèm Failover tự động khi chạm 429.
- [x] Tích hợp cơ sở tri thức K12Online (bóc tách 88+ bài viết nghiệp vụ vào `data/`).
- [x] Xây dựng bộ tìm kiếm trích xuất dữ liệu (RAG search) theo ngữ cảnh câu hỏi.
- [x] Giao diện Chatbot chuẩn mực giáo dục: Xưng hô lễ phép "Thầy/Cô - Em", hướng dẫn từng bước và trích dẫn bài viết gốc.
- [x] Chế độ Khách (Guest Mode) tra cứu nhanh không cần đăng nhập.
- [x] Khung xác minh Cloudflare Turnstile bảo vệ chống bot.
- [x] Modal Ủng hộ (Donate / Buy me a coffee) và Tuyên bố bản quyền phi lợi nhuận.

## Giai đoạn 2: Nâng cấp Cơ sở dữ liệu & Vector Search (Supabase)
- [ ] Tạo dự án Supabase miễn phí và liên kết `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Bật tiện ích `pgvector` trên PostgreSQL của Supabase.
- [ ] Lưu trữ và đồng bộ hóa lịch sử hội thoại lên bảng `chat_sessions` khi người dùng đăng nhập.
- [x] Triển khai Semantic / In-Memory Caching trong RAM: Tự động ghi nhớ câu trả lời của các câu hỏi trùng lặp, phản hồi tức thì trong 1ms và tiết kiệm 100% token AI.
- [ ] Mở rộng Cache sang Supabase / Upstash Redis khi triển khai đa cụm máy chủ.

## Giai đoạn 3: Triển khai Đám mây & Bảo vệ (Cloudflare)
- [ ] Đăng ký Cloudflare Turnstile Site Key và gắn vào `.env.local`.
- [ ] Trỏ tên miền miễn phí hoặc tên miền trường học qua Cloudflare DNS (bật đám mây cam WAF).
- [ ] Deploy ứng dụng Next.js lên Vercel hoặc Cloudflare Pages (miễn phí 100%).

## Giai đoạn 4: Mở rộng Đa Kênh
- [ ] Tích hợp Zalo OA / Zalo Bot để thầy cô có thể nhắn tin hỏi đáp trực tiếp qua Zalo trên điện thoại.
- [ ] Thêm nút đánh giá (Like/Dislike) cho từng câu trả lời để tiếp tục tinh chỉnh dữ liệu.
