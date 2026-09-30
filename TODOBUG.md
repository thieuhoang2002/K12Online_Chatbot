# 🐛 NHẬT KÝ THEO DÕI VẤN ĐỀ & LỖI TIỀM ẨN (TODOBUG)

Bảng theo dõi các vấn đề kỹ thuật, lỗi phát sinh, kẽ hở bảo mật và các giải pháp khắc phục đã triển khai:

| Mã | Hạng mục | Hiện tượng / Rủi ro | Mức độ | Trạng thái | Giải pháp / Hướng khắc phục |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **BUG-01** | OpenRouter Key | Một trong các API Key trong danh sách bị hết hạn mức hoặc bị xóa | Vừa | ✅ Đã xử lý | Engine `KeyRotator` tự động bắt mã lỗi 402/429 và xoay sang Key kế tiếp mà không ngắt quãng người dùng. |
| **BUG-02** | RAG Context | Thầy cô hỏi câu quá chung chung khiến RAG trích xuất tài liệu không cần thiết | Thấp | 📝 Đang theo dõi | Bổ sung bộ lọc từ khóa nghiệp vụ trước khi tiến hành trích xuất tri thức. |
| **BUG-03** | Cloudflare Turnstile | Khi chạy ở môi trường localhost chưa cấu hình Site Key | Thấp | ✅ Đã xử lý | Đã viết cơ chế Fallback mô phỏng: Tự động bypass an toàn trong môi trường development. |
| **BUG-04** | Supabase Auth | Người dùng bấm đăng nhập nhưng chưa cấu hình Supabase URL | Thấp | ✅ Đã xử lý | Đã có chế độ Demo Fallback: Nhập email bất kỳ vẫn đăng nhập được ở mức giao diện mà không sập ứng dụng. |
| **BUG-05** | Dữ liệu K12 thay đổi | K12Online cập nhật tính năng mới trong tương lai | Vừa | ✅ Có quy trình | Quản lý qua thư mục `data/articles/`, thêm/sửa file `.txt` và push Git là Vercel tự động cập nhật ngay (xem `DATA_MANAGEMENT.md`). |
| **BUG-06** | Khởi tạo phiên Chat | Người dùng mở trình duyệt mới hoặc tab ẩn danh bị màn hình đen ngòm và nuốt mất tin nhắn câu hỏi | Cao | ✅ Đã xử lý | Nguyên nhân do lệnh `return` của Supabase Auth nằm sai vị trí trong `useEffect`. Đã tách riêng `useEffect` của Supabase và bổ sung cơ chế phòng vệ tự động tạo session trong `handleSendMessage`. |
| **BUG-07** | Turnstile Re-render | Lỗi HTTP 429 Too Many Requests từ Cloudflare do Turnstile nạp lại liên tục | Cao | ✅ Đã xử lý | Sử dụng `useRef` và `useCallback` cho callback `onVerify`, đảm bảo Turnstile chỉ khởi tạo duy nhất 1 lần khi load trang. |
| **BUG-08** | OpenRouter Upstream 429 | Model chính `Qwen 3.8 27B` bị quá tải từ nguồn dùng chung (shared upstream pool) của OpenRouter | Cao | ✅ Đã xử lý | Bổ sung bộ phát hiện `upstream_provider_shared_pool` trong `openrouter.ts`: Thoát ngay vòng lặp và chuyển tức thì sang model dự phòng (`Nemotron 550B` / `Gemma 31B`) trong 0.1s. |
| **BUG-09** | Kẽ hở Spam Backend | Kẻ xấu gọi thẳng vào `POST /api/chat` bằng script để spam cạn kiệt API OpenRouter | Nghiêm trọng | ✅ Đã xử lý | 1. Bắt buộc xác thực Turnstile phía Backend (trả về 403 nếu thiếu hoặc sai token).<br>2. Giới hạn độ dài câu hỏi tối đa 1.500 ký tự (trả về 400).<br>3. Tích hợp Rate Limiting qua Upstash Redis tối đa 20 req/phút/IP (trả về 429). |
