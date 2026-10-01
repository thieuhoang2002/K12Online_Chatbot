# 📋 KẾ HOẠCH CHIẾN LƯỢC KIỂM THỬ TOÀN DIỆN (TEST PLAN)
**Dự án:** Trợ Lý AI K12Online (K12Online Chatbot)  
**Phiên bản hệ thống:** v1.0.0-production  
**Tiêu chuẩn áp dụng:** IEEE 829 & ISTQB Test Plan Standards  
**Mục tiêu:** Kiểm thử tự động (Automation Testing) trọn gói 100% chức năng, bảo mật và hiệu năng.

---

## 1. Mục tiêu và Phạm vi Kiểm thử (Scope & Objectives)

### 1.1. Phạm vi Trong Kiểm thử (In-Scope)
Kiểm thử tự động toàn diện 8 phân hệ cốt lõi:
1. **Kho Tri Thức & RAG Engine (`src/lib/knowledge.ts`, `src/lib/synonyms.ts`):**
   - Đảm bảo 383 bài viết nghiệp vụ nạp đúng vào JSON và RAM.
   - Kiểm thử thuật toán tính điểm xếp hạng từ khóa (Scoring).
   - Kiểm thử Từ điển đồng nghĩa giáo dục 50+ cặp từ.
   - Kiểm thử 100% trích xuất link `.html` trực tiếp dẫn tới Viettel.
2. **Bộ Nhận diện Ý định & Câu Xã Giao (`src/lib/intent.ts`):**
   - Phản hồi siêu tốc (<10ms) cho các câu chào hỏi/cảm ơn/thông tin bot.
3. **Cơ chế Phản hồi Soạn sẵn Siêu tốc (`src/lib/prebaked.ts`):**
   - So khớp và phản hồi các bài viết quá khổ (>15.000 ký tự) với 0ms latency, 0 token AI.
4. **Bảo mật Mật mã Zero-Knowledge (`src/lib/zeroKnowledge.ts`):**
   - Khởi tạo khóa PBKDF2 100.000 iterations (SHA-256) trên Web Crypto.
   - Mã hóa & Giải mã AES-256-GCM với Authentication Tag.
   - Kiểm thử tính toàn vẹn (Tamper Resistance): Sửa 1 bit trong ciphertext lập tức gây lỗi xác thực.
   - Kiểm thử chống tấn công dò mật khẩu sai (Wrong Password Rejection).
5. **Hệ thống Bảo vệ & Chống Spam (`src/lib/ratelimit.ts`, `src/app/api/chat/route.ts`):**
   - Chặn request thiếu token Cloudflare Turnstile (HTTP 403).
   - Chặn câu hỏi quá tải > 1.500 ký tự (HTTP 400).
   - Giới hạn tần suất 20 req/phút/IP (HTTP 429).
6. **API Endpoints & Tuyến Nghiệp vụ:**
   - `POST /api/chat`: Luồng SSE Streaming, header rate limit.
   - `POST /api/feedback`: Lưu đánh giá Like/Dislike, validation dữ liệu.
   - `GET /api/admin/stats`: Phân quyền Whitelist email, thống kê KPI.
   - `POST /api/admin/vault`: Khởi tạo và xác minh mật mã Zero-Knowledge.
   - `POST /api/admin/telegram-test`: Kiểm tra kết nối webhook Telegram.
   - `GET /embed` & `GET /widget.js`: Kiểm tra phân phối widget nhúng website trường học và header CSP `frame-ancestors *`.
7. **Hệ thống Giám sát & Cảnh báo Telegram (`src/lib/telegram.ts`):**
   - Cảnh báo Spam Rate limit, Failover AI, Dislike Feedback, Lỗi 500.
8. **Trải nghiệm Người dùng (UX Guards):**
   - Smart Scroll-Intent: Dừng auto-scroll khi người dùng cuộn lên đọc.
   - Tab-switching protection: Không ghi đè state khi chuyển tab.

### 1.2. Phạm vi Ngoài Kiểm thử (Out-of-Scope)
- Tấn công DDoS hạ tầng tầng mạng L3/L4 (do Cloudflare CDN và Vercel Edge quản lý).
- Giao diện Admin quản trị của bên thứ ba (Google AI Studio, Supabase Studio, Upstash Console).

---

## 2. Ma trận Phân loại Kiểm thử (Test Matrix)

| Cấp độ | Phân loại | Số lượng Test Cases | Mục tiêu chính |
| :--- | :--- | :---: | :--- |
| **Unit Test** | RAG & Knowledge Base | 6 | Tính chính xác của kho 383 bài viết, điểm số và link .html |
| **Unit Test** | Intent & Pre-baked Cache | 4 | Tốc độ phản hồi <10ms và so khớp bài cẩm nang |
| **Unit Test** | Zero-Knowledge Cryptography | 6 | PBKDF2 100k rounds, AES-256-GCM, Auth Tag, Tamper Resistance |
| **Unit Test** | Rate Limit & Security Filters | 4 | Chống brute-force, quá tải payload, Turnstile token |
| **Integration** | Chat API (`/api/chat`) | 4 | Xác thực Turnstile 403, Payload 400, Header Rate Limit, SSE |
| **Integration** | Feedback API (`/api/feedback`) | 4 | Thẩm định rating like/dislike, ghi nhận lý do, trigger cảnh báo |
| **Integration** | Admin Dashboard APIs | 5 | Whitelist email check, thống kê KPI, mã hóa Vault, Test Telegram |
| **Integration** | Embed Widget & CSP | 3 | Phân phối `widget.js`, tải `/embed`, kiểm tra `frame-ancestors *` |
| **Integration** | Telegram Alert Webhook | 3 | Kiểm tra định dạng tin nhắn HTML, timeout non-blocking 4s |
| **TỔNG CỘNG** | | **39 Test Cases** | **Bao phủ 100% các tính năng của toàn bộ hệ thống** |

---

## 3. Môi trường & Công cụ Kiểm thử (Test Environment)

- **Ngôn ngữ thực thi:** Node.js (v20+ / v22 LTS) hỗ trợ chuẩn Native Web Crypto API (`globalThis.crypto`).
- **Framework kiểm thử:** Tự xây dựng Test Runner độc lập (`tests/run_all_tests.js`) với Zero-Dependency, không làm nặng source code dự án, hiển thị màu sắc trực quan, đo lường độ trễ (latency benchmarks) và tự động xuất file Markdown báo cáo.
- **Môi trường Server:** Localhost HTTP Server (`http://localhost:3000`) và Production Target (`https://k12onlinechatbot.thhoang.io.vn`).

---

## 4. Tiêu chí Đạt / Không đạt (Pass/Fail Criteria)

1. **Tiêu chí Đạt (Pass Criteria):**
   - 100% Test Cases nghiệp vụ cốt lõi (Critical & High) đạt trạng thái PASS.
   - Tỷ lệ thành công tổng thể (Overall Pass Rate) $\ge 95\%$.
   - Thời gian phản hồi Intent filter $\le 15\text{ms}$.
   - Tốc độ sinh khóa và mã hóa Zero-Knowledge Client-side nằm trong khoảng an toàn $100\text{ms} - 800\text{ms}$ (đủ làm chậm hacker nhưng người dùng không bị đơ trình duyệt).
   - 100% các yêu cầu gọi trực tiếp không có Turnstile token đều bị chặn đứng với mã `403 Forbidden`.
   - Bất kỳ can thiệp 1 bit nào vào ciphertext đều phải bị từ chối giải mã ngay lập tức (`Tag mismatch`).
2. **Tiêu chí Không đạt (Fail Criteria):**
   - Xuất hiện lỗi rò rỉ Plaintext mật mã Master Password ra ngoài môi trường Client.
   - Lỗi crash server (Uncaught Exception) làm sập tiến trình Node.js.
   - Thẻ trích dẫn bài viết trỏ sai link hoặc thiếu đuôi `.html`.

---

## 5. Quy trình Chạy Kiểm thử Tự động

Chỉ cần thực thi lệnh duy nhất:
```bash
npm test
# hoặc
node tests/run_all_tests.js
```
Script sẽ tự động chạy qua tất cả 39 Test Cases, in kết quả chi tiết từng phần, và ghi nhận lại vào `tests/test_report.md`.
