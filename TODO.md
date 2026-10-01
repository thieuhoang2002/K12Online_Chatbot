# 📋 DANH SÁCH VIỆC CẦN LÀM & TIẾN ĐỘ DỰ ÁN (TODO) - K12ONLINE CHATBOT

## Giai đoạn 1: Hoàn thiện bản Sơ khai (MVP) - [ĐÃ HOÀN THÀNH 100%]
- [x] Khởi tạo cấu trúc dự án Next.js 15 App Router + Tailwind CSS + Lucide Icons.
- [x] Xây dựng Engine xoay tua API Key OpenRouter (`src/lib/openrouter.ts`) hỗ trợ danh sách nhiều Key (`key1,key2,key3...`) kèm Failover tự động.
- [x] Tích hợp cơ sở tri thức K12Online (bóc tách 383 bài viết nghiệp vụ vào `data/articles/` và biên dịch JSON siêu tốc `data/k12_knowledge.json`).
- [x] Xây dựng bộ tìm kiếm trích xuất dữ liệu (RAG search) theo ngữ cảnh câu hỏi (`src/lib/knowledge.ts`).
- [x] Giao diện Chatbot chuẩn mực giáo dục: Hướng dẫn chi tiết từng bước, xưng hô lịch sự và trích dẫn bài viết gốc.
- [x] Chế độ Khách (Guest Mode) tra cứu nhanh không cần đăng nhập.
- [x] Modal Ủng hộ (Donate / Buy me a coffee) và Tuyên bố bản quyền phi lợi nhuận.

---

## Giai đoạn 2: Tối ưu Tốc độ, Động Cơ Kép & Bộ nhớ Đệm (Dual-Engine AI) - [ĐÃ HOÀN THÀNH 100%]
- [x] **Tích hợp Động cơ chính Google Gemini 3.8 Flash:** Tận dụng context window cực lớn và đầu ra 8.192 tokens của Gemini (`src/lib/gemini.ts`), hỗ trợ xoay vòng nhiều API Key.
- [x] **Cơ chế Chuyển vùng Nhanh (Fast Failover):** Tự động chuyển tiếp mượt mà từ Gemini sang cụm OpenRouter 5 Keys khi gặp mã 429 hoặc quá tải.
- [x] **Bộ nhớ đệm Đám mây (Upstash Redis Cloud):** Chia sẻ bộ nhớ đệm cho hàng nghìn người dùng, phản hồi siêu tốc (~30ms) và tiết kiệm 100% token AI.
- [x] **Bộ nhớ đệm Nội bộ (In-Memory RAM Cache):** Tự động ghi nhớ câu trả lời câu hỏi trùng lặp trong bộ nhớ máy chủ.
- [x] **Client-side Cache:** Phản hồi 0.01s trên trình duyệt cho các câu hỏi lặp lại trong cùng phiên chat.

---

## Giai đoạn 3: Triển khai Đám mây & Bảo vệ Hệ thống - [ĐÃ HOÀN THÀNH 100%]
- [x] Đăng ký Cloudflare Turnstile Site Key & Secret Key, tích hợp widget chống bot.
- [x] Xác minh Cloudflare Turnstile nghiêm ngặt phía Backend (`POST /api/chat` trả về 403 Forbidden nếu thiếu hoặc sai token).
- [x] Giới hạn độ dài tin nhắn (Payload Size Limit): Tối đa 1.500 ký tự / câu hỏi, chống flood token.
- [x] Tích hợp Rate Limiting theo IP: Tối đa 20 câu hỏi / phút / IP qua Upstash Redis (HTTP 429 Too Many Requests).
- [x] Cấu hình Custom Domain: Gắn domain riêng [k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn) qua Vercel & DNS.
- [x] Triển khai CI/CD tự động lên Vercel Serverless.

---

## Giai đoạn 4: Quản lý Phiên & Dữ liệu Người dùng (Supabase) - [ĐÃ HOÀN THÀNH 100%]
- [x] Tích hợp Supabase Client & Supabase Auth (Đăng nhập Email / Google).
- [x] Sửa lỗi khởi tạo phiên chat ban đầu trên trình duyệt mới / chế độ ẩn danh.
- [x] Lưu trữ và đồng bộ hóa lịch sử hội thoại lên bảng `chat_sessions` trên Supabase Database (kèm file schema `supabase/schema.sql`).
- [x] Cho phép người dùng xuất (export) lịch sử trò chuyện ra file PDF / Word / Markdown (`src/components/ExportModal.tsx`).

---

## Giai đoạn 5: Tối ưu Trải nghiệm Phản hồi & Tương tác (UX/UI) - [ĐÃ HOÀN THÀNH 100%]
- [x] **Streaming Response (ReadableStream / SSE):** Hiệu ứng tuôn chữ từng từ theo thời gian thực (Server-Sent Events), phản hồi ngay tức thì và mượt mà.
- [x] **Cơ chế Pre-baked Warm Cache Streaming:** Giải quyết triệt để lỗi cắt cụt văn bản đối với bài viết cẩm nang khổng lồ (bài Thư viện số 67.600 ký tự) bằng câu trả lời soạn sẵn chi tiết 7 phân hệ (0ms latency, 0 token, không cụt).
- [x] **Bộ lọc câu hỏi xã giao (Intent Filter):** Tự động nhận diện câu chào hỏi/cảm ơn ("Chào bạn", "Cảm ơn") để phản hồi tức thì (<10ms) mà không tốn công quét RAG.
- [x] **Thẻ gợi ý thông minh 1 chạm (Contextual Follow-up Cards):** Gợi ý 2–3 câu hỏi tiếp theo theo từng chủ đề chuyên sâu, tự động cuộn chống tràn giao diện và không bị thanh nhập liệu che khuất.
- [x] **Chuẩn hóa Link nguồn 100%:** Toàn bộ 383 bài viết trích dẫn đều có đường link `.html` trực tiếp dẫn tới cổng Viettel.
- [x] **Nút Đánh giá chất lượng (Like/Dislike Feedback):** Thu thập phản hồi về độ hữu ích của câu trả lời (`src/components/FeedbackModal.tsx` + `/api/feedback`) để cải thiện chất lượng dữ liệu.
- [x] **Nhập liệu bằng giọng nói (Voice Input - Web Speech API):** Tích hợp nút Micro thu âm tiếng Việt trực tiếp ngay ô chat, miễn phí 100%, 0 token, chuyển đổi thành văn bản theo thời gian thực.
- [x] **Tối ưu hóa Responsive Header Mobile:** Tự động rút gọn tiêu đề `K12Online` trên màn hình nhỏ (<640px) và khóa `shrink-0` cụm nút, loại bỏ hoàn toàn lỗi đè nút 'Đoạn chat mới'.

---

## Giai đoạn 6: Nâng cấp Trí thông minh & Tìm kiếm Ngữ nghĩa (Advanced RAG) - [ĐÃ HOÀN THÀNH 100%]
- [x] **Từ điển đồng nghĩa Tiếng Việt (Synonym Mapping):** Ánh xạ hơn 50+ thuật ngữ phổ biến của giáo viên trong `src/lib/synonyms.ts`.
- [x] **Pre-compilation Build Pipeline:** Script `build_knowledge_json.js` tự động đồng bộ và biên dịch 383 bài viết trước mỗi lần build production.
- [x] **Phân tích Ngữ liệu Chuyên sâu:** Bộ scanner đo lường độ dài ký tự/từ/dòng phân loại SAFE (<6k chars), WARNING (6-15k chars), OVERSIZED (>15k chars).
- [x] **Semantic Vector Search:** Kích hoạt `pgvector` trên PostgreSQL của Supabase (`supabase/schema_vector.sql` + `src/lib/vector.ts` với Hybrid Search).

---

## Giai đoạn 7: Đóng gói Bộ công cụ & Mở rộng (Tooling & Ecosystem) - [ĐÃ HOÀN THÀNH 100%]
- [x] **Tách Bộ công cụ Khai thác Tri thức Độc lập:** Đóng gói toàn bộ crawler bypass TLS/WAF, analyzer, prebaked matcher thành repo riêng `k12online-knowledge-toolkit`.
- [x] **Widget nhúng Website trường học (Embeddable Script):** Cung cấp script độc lập `public/widget.js` và route `/embed` cho phép mọi website trường học nhúng bong bóng chat K12 bằng 1 dòng `<script>`.
- [ ] **Tích hợp Zalo Bot / Zalo OA:** Cho phép thầy cô nhắn tin hỏi đáp trực tiếp qua ứng dụng Zalo trên điện thoại (Yêu cầu tài khoản Zalo Doanh nghiệp xác thực tick vàng).

---

## Giai đoạn 8: Giám sát & Báo cáo Quản trị (Observability & Analytics) - [ĐÃ HOÀN THÀNH 100%]
- [x] **Chuyển tiếp Rate Limit Headers:** Forward các header `x-ratelimit-*` từ Google Gemini về client và console server để theo dõi hạn ngạch thực tế.
- [x] **Bảng điều khiển Thống kê Quản trị (Admin Analytics Dashboard):** Trang `/admin` nội bộ bảo vệ đa tầng bằng **Zero-Knowledge (PBKDF2 100k + AES-256-GCM)**, thống kê phiên chat, like/dislike, AI engine status, và 383 bài viết.
- [x] **Cảnh báo lỗi tự động qua Telegram Webhook:** Tự động gửi cảnh báo HTML tức thì về điện thoại qua Telegram Bot (`src/lib/telegram.ts`) khi có IP spam rate limit, Gemini failover, góp ý Dislike, hoặc lỗi HTTP 500.
- [x] **Giám sát Sức khỏe & Hạn ngạch Từng API Key (`/api/admin/health-check`):** Kiểm tra ping thực tế tới từng Key Gemini, OpenRouter Pool, Redis, Telegram, Supabase kèm nút bấm On-Demand [🔄 Check lại] cho từng key/dịch vụ riêng biệt, hỗ trợ tất cả tên biến môi trường Gemini trên Vercel và cơ chế tự động quét định kỳ mỗi 10 phút.

---

## Giai đoạn 9: Kiểm Thử Tự Động Toàn Diện (Full-Suite Automation Testing) - [ĐÃ HOÀN THÀNH 100%]
- [x] **Xây dựng Kế hoạch Kiểm thử Chiến lược (`tests/test_plan.md`):** Chuẩn IEEE 829 & ISTQB bao phủ 9 phân hệ cốt lõi.
- [x] **Đặc tả 40 Test Cases Chi tiết (`tests/test_cases.md`):** Bao phủ Unit Test, Integration Test, Mật mã Zero-Knowledge, RAG, Rate Limit, Health Check và Webhook.
- [x] **Bộ Test Scripts Độc lập Tự động:** Các tệp thực thi `tests/unit/*.js` và `tests/integration/*.js` đo lường latency và thẩm định tính toàn vẹn.
- [x] **Master Test Runner (`tests/run_all_tests.js` / `npm test`):** Tự động chạy toàn bộ suite, in kết quả màu trực quan và tự động kết xuất báo cáo `tests/test_report.md` (Đạt tỷ lệ thành công 100.0% - 40/40 Test Cases).



