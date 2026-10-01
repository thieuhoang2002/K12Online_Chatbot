# 🤝 TÀI LIỆU BÀN GIAO DỰ ÁN (HANDOVER) - K12ONLINE CHATBOT

## 1. Tổng quan Sản phẩm Bàn giao
- **Tên dự án:** Trợ Lý AI Hỗ Trợ Nghiệp Vụ K12Online (Dự án Cộng đồng Phi Lợi Nhuận).
- **Tên miền Production:** [https://k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn)
- **Tên miền dự phòng Vercel:** [https://k12-online-chatbot.vercel.app](https://k12-online-chatbot.vercel.app)
- **Kho mã nguồn GitHub chính:** `https://github.com/thieuhoang2002/K12Online_Chatbot.git` (Nhánh `dev` và `main`)
- **Bộ công cụ Khai thác Tri thức độc lập:** `https://github.com/thieuhoang2002/k12online-knowledge-toolkit.git`
- **Mã nguồn cục bộ:** `C:\Users\thhoang\Desktop\K12Online_Chatbot`

---

## 2. Các Thành phần Hệ thống đã Hoàn thiện

### 2.1. Động cơ AI Kép (Dual-Engine AI Architecture)
- **Động cơ chính (Google Gemini 3.8 Flash):** `src/lib/gemini.ts`
  - Hỗ trợ xoay tua nhiều khóa API Google (`GEMINI_API_KEYS=key1,key2`).
  - Hạn ngạch ngữ cảnh cực lớn, mở rộng đầu ra `maxOutputTokens: 8192`.
  - Tự động bóc tách và chuyển tiếp các header Rate Limit (`x-ratelimit-*`).
- **Động cơ dự phòng (OpenRouter Multi-Key Pool):** `src/lib/openrouter.ts`
  - Bể 5 API Keys với thuật toán xoay vòng Round-Robin.
  - Tự động nhận diện lỗi quá tải tài nguyên dùng chung (429 upstream pool) và chuyển đổi tức thì sang mô hình dự phòng `Nemotron 550B` hoặc `Gemma 31B` trong 0.1s.

### 2.2. Cơ chế Pre-baked Warm Cache Streaming
- **Mã nguồn:** `src/lib/prebaked.ts` & `data/prebaked_answers.json`
- **Tính năng:**
  - Giải quyết bài toán bài viết cẩm nang khổng lồ (bài Thư viện số dài hơn 67.000 ký tự).
  - Thuật toán so khớp tiếng Việt 3 tầng (Triggers, Substrings, Keyword Combinations) với tốc độ < 2ms.
  - Phản hồi **ngay lập tức (0ms latency, tiêu tốn 0 token AI)** qua luồng SSE gõ từng cụm 3 từ mỗi 15ms, không bao giờ bị cắt cụt.

### 2.3. Cơ sở Tri thức & Tìm kiếm Ngữ cảnh (RAG)
- **Mã nguồn:** `src/lib/knowledge.ts` & `src/lib/synonyms.ts`
- **Dữ liệu tri thức:** Trọn bộ **383 bài viết nghiệp vụ chính thức** được biên dịch thành file JSON siêu tốc `data/k12_knowledge.json` (~1.18 MB).
- **Từ điển đồng nghĩa:** Hơn 50+ cặp thuật ngữ giáo dục giúp tăng tỷ lệ trúng khớp RAG.
- **Link nguồn chính xác 100%:** Toàn bộ thẻ trích dẫn nguồn đều chứa URL `.html` trực tiếp dẫn tới cổng hỗ trợ K12Online của Viettel.

### 2.4. Bộ nhớ Đệm & Tăng tốc (Multi-Layer Caching)
- **Mã nguồn:** `src/lib/cache.ts`
- **Dịch vụ sử dụng:** Upstash Redis Cloud (`UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`).
- **Hiệu quả:** Phản hồi câu hỏi đã có sẵn trong ~30ms, tiết kiệm 100% chi phí và hạn ngạch gọi AI.
- **Dự phòng In-Memory RAM:** Tự động kích hoạt lưu RAM cục bộ nếu kết nối Redis tạm thời gián đoạn.

### 2.5. Hệ thống Phòng thủ & Chống Spam (Security)
- **Mã nguồn:** `src/app/api/chat/route.ts` & `src/lib/ratelimit.ts`
- **Các tầng bảo vệ:**
  1. **Cloudflare Turnstile:** Bắt buộc xác minh hợp lệ phía server (trả về 403 Forbidden nếu thiếu hoặc sai token). Có cơ chế nhớ phiên 30 phút cho người dùng hợp lệ.
  2. **Rate Limiting:** Giới hạn 20 câu hỏi / phút cho mỗi địa chỉ IP thông qua Upstash Redis (trả về 429 Too Many Requests).
  3. **Payload Limit:** Khống chế độ dài tối đa 1.500 ký tự / câu hỏi (trả về 400 Bad Request).

### 2.6. Bảng điều khiển Quản trị Bảo mật Zero-Knowledge (Admin Dashboard)
- **Mã nguồn:** `src/app/admin/page.tsx`, `src/lib/zeroKnowledge.ts`, `src/components/AdminPassModal.tsx`, `src/app/api/admin/*`
- **Kiến trúc bảo mật:**
  - Whitelist email kiểm soát quyền truy cập (`thieuhoangent@gmail.com`, `thieuviethoang7b@gmail.com`).
  - Web Crypto API: PBKDF2 (100.000 iterations, SHA-256) + AES-256-GCM (128-bit Authentication Tag).
  - Server chỉ lưu trữ `{ ciphertext, salt, iv, hint }` tại bảng `admin_vault` trên Supabase. Mật mã plaintext tuyệt đối không bao giờ được gửi qua mạng hay lưu ở server/database.
- **Tính năng bàn giao:**
  - Báo cáo thời gian thực KPIs (tổng phiên, tin nhắn, phản hồi, tỷ lệ tích cực).
  - Quản lý và duyệt ý kiến góp ý của người dùng (Feedback Explorer).
  - Tra cứu trực tiếp kho 383 bài viết nghiệp vụ và link gốc Viettel.
  - Công cụ tạo mã nhúng Widget website trường học.
  - Nút thử nghiệm bắn cảnh báo Telegram trực tiếp.

### 2.7. Hệ thống Giám sát & Cảnh báo Tự động qua Telegram Webhook
- **Mã nguồn:** `src/lib/telegram.ts`
- **Cơ chế:** Gửi tin ngầm bất đồng bộ (non-blocking async background) với timeout 4s qua Telegram Bot API, không làm nghẽn luồng xử lý người dùng.
- **Sự kiện giám sát tự động:**
  - ⚠️ Cảnh báo Spam Rate Limit khi IP bị chặn 429.
  - 🔄 Cảnh báo Failover khi Gemini gặp lỗi và hệ thống tự động chuyển sang OpenRouter.
  - 👎 Cảnh báo Phản hồi Không hài lòng (Dislike) kèm lý do và câu hỏi cụ thể của người dùng.
  - 🚨 Cảnh báo Lỗi Hệ thống 500 nghiêm trọng.

### 2.8. Hệ thống Widget nhúng Website Trường học (Embeddable Widget)
- **Mã nguồn:** `public/widget.js`, `src/app/embed/page.tsx`, `next.config.mjs`
- **Tính năng:**
  - Cho phép các trường học tích hợp Chatbot K12Online vào cổng thông tin chỉ bằng 1 dòng `<script>`.
  - Nút bấm tròn nổi và popup chat iframe tối giản, chuẩn responsive trên cả Desktop và Mobile.
  - Cấu hình CSP `frame-ancestors *` cho phép nhúng an toàn từ mọi domain.

### 2.9. Hệ thống Đánh giá (Feedback) & Xuất Lịch sử Trò chuyện (Export)
- **Mã nguồn:** `src/components/FeedbackModal.tsx`, `src/components/ExportModal.tsx`, `src/app/api/feedback/route.ts`
- **Tính năng:**
  - Cho phép giáo viên đánh giá Thích / Không thích câu trả lời và đóng góp lý do chi tiết (lưu vào bảng `chat_feedback`).
  - Cho phép xuất lịch sử hội thoại ra Markdown (`.md`), Plain Text (`.txt`) và In / Xuất PDF trực tiếp.

### 2.10. Hệ thống Kiểm thử Tự động Toàn diện (Full-Suite Automation Testing)
- **Mã nguồn:** Thư mục `tests/`, `tests/run_all_tests.js` và lệnh `npm test`.
- **Thành quả bàn giao:**
  - 100% bao phủ 8 phân hệ cốt lõi với **39/39 Test Cases đạt PASS (100.0% Success Rate)**.
  - Kế hoạch kiểm thử chuẩn IEEE 829 & ISTQB (`tests/test_plan.md`).
  - Báo cáo kết quả kiểm thử tự động chi tiết với latency benchmarks (`tests/test_report.md`).
  - Chạy độc lập siêu tốc (<35s) trên Node.js Native Web Crypto mà không phụ thuộc thư viện nặng.

---

## 3. Danh sách Biến Môi trường Cần thiết (.env.local & Vercel)

```env
# Google Gemini API Keys (Động cơ chính, cách nhau dấu phẩy)
GEMINI_API_KEYS=AIzaSyA...Key1,AIzaSyB...Key2

# OpenRouter API Keys (Động cơ dự phòng, cách nhau dấu phẩy)
OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2,sk-or-v1-key3

# Upstash Redis Cloud Cache & Rate Limiting
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Cloudflare Turnstile
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAA...
CLOUDFLARE_TURNSTILE_SECRET_KEY=0x4AAAAAA...

# Supabase Auth & BaaS
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Telegram Bot Alerts & Observability (Cảnh báo lỗi tự động)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_CHAT_ID=-100xxxxxxxxxx (hoặc Chat ID cá nhân)
```

---

## 4. Hướng dẫn Vận hành & Cập nhật Dự án

### 4.1. Cập nhật bài viết tri thức mới
1. Thêm hoặc sửa file `.txt` trong thư mục `data/articles/`.
2. Chạy lệnh biên dịch JSON: `node scripts/build_knowledge_json.js`.
3. Push Git để Vercel tự động deploy bản mới.

### 4.2. Bổ sung câu trả lời soạn sẵn (Pre-baked Answers)
Khi có bài viết nghiệp vụ mới dài trên 15.000 ký tự:
1. Mở `data/prebaked_answers.json`.
2. Khai báo các từ khóa trigger và nội dung Markdown hoàn chỉnh.
3. Hệ thống sẽ tự động so khớp và phản hồi ngay cho người dùng.

### 4.3. Theo dõi và Xử lý Góp ý của Người dùng
1. Khi có thông báo Dislike gửi về nhóm Telegram, đọc câu hỏi và lý do giáo viên báo lỗi.
2. Truy cập `/admin` > mục **Phản hồi Người dùng** để xem toàn bộ bối cảnh cuộc trò chuyện.
3. Nếu bài viết trên K12Online có thay đổi thao tác, tiến hành cập nhật lại file bài viết tương ứng trong `data/articles/`.

### 4.4. Kiểm thử Tự động Trước khi Phát hành (Pre-Deployment Testing)
Trước mỗi lần push mã nguồn hoặc dữ liệu mới lên GitHub/Vercel:
1. Chạy lệnh: `npm test`.
2. Đảm bảo toàn bộ 39 Test Cases đạt `PASS`.
3. Kiểm tra tệp báo cáo `tests/test_report.md` để chắc chắn không có lỗi hồi quy (regression bugs).

