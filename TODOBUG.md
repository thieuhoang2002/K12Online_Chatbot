# 🐛 NHẬT KÝ THEO DÕI VẤN ĐỀ & LỖI TIỀM ẨN (TODOBUG)

Bảng theo dõi các vấn đề kỹ thuật, rủi ro tiềm ẩn và giải pháp xử lý tương ứng:

| Mã | Hạng mục | Hiện tượng / Rủi ro | Mức độ | Trạng thái | Giải pháp / Hướng khắc phục |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **BUG-01** | OpenRouter Key | Một trong các API Key trong danh sách bị hết hạn mức hoặc bị xóa | Vừa | ✅ Đã xử lý | Engine `KeyRotator` tự động bắt mã lỗi 402/429 và nhảy sang Key kế tiếp mà không làm gián đoạn người dùng. |
| **BUG-02** | RAG Context | Thầy cô hỏi câu quá chung chung (ví dụ: "Chào em") khiến RAG trích xuất tài liệu không cần thiết | Thấp | 📝 Đang theo dõi | Cần bổ sung bộ phân loại ý định (Intent Classifier): Chỉ tìm kiếm tài liệu khi câu hỏi chứa từ khóa nghiệp vụ. |
| **BUG-03** | Cloudflare Turnstile | Khi chạy ở môi trường localhost chưa cấu hình Site Key | Thấp | ✅ Đã xử lý | Đã viết cơ chế Fallback mô phỏng: Tự động đánh dấu `Verified` sau 600ms nếu không tìm thấy Site Key trong file môi trường. |
| **BUG-04** | Supabase Auth | Người dùng bấm đăng nhập nhưng chưa cấu hình Supabase URL | Thấp | ✅ Đã xử lý | Đã có chế độ Demo Fallback: Nhập email bất kỳ vẫn đăng nhập được ở mức giao diện mà không báo lỗi sập ứng dụng. |
| **BUG-05** | Dữ liệu K12 thay đổi | K12Online cập nhật tính năng mới trong tương lai | Vừa | 📋 Kế hoạch | Chạy lại kịch bản cào dữ liệu (`crawl.bat` ở tool cũ hoặc trigger API) để cập nhật lại file `k12_knowledge.txt`. |
