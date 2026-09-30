# 🤝 TÀI LIỆU BÀN GIAO DỰ ÁN (HANDOVER) - K12ONLINE CHATBOT

## 1. Tổng quan Dự án
- **Tên dự án:** Trợ Lý AI Hỗ Trợ Nghiệp Vụ K12Online (Phi Lợi Nhuận).
- **Mục tiêu:** Hỗ trợ Quý Thầy/Cô giáo và Cán bộ IT các trường phổ thông tra cứu, giải quyết nhanh các nghiệp vụ, thao tác khó trên phần mềm K12Online (Viettel).
- **Vị trí thư mục:** `C:\Users\thhoang\Desktop\K12Online_Chatbot`

---

## 2. Kiến trúc & Thành phần cốt lõi

### 2.1. Bộ Não AI & Kỹ năng Xoay Key (OpenRouter Multi-Key Engine)
- **File thực thi:** `src/lib/openrouter.ts`
- **Cách hoạt động:**
  - Nhận danh sách API Key thông qua biến `OPENROUTER_API_KEYS` trong `.env.local` (phân cách bằng dấu phẩy: `key1,key2,key3`).
  - Phân phối theo thuật toán Round-Robin: Mỗi câu hỏi dùng 1 key khác nhau để chia nhỏ tải.
  - **Tự động Failover:** Nếu Key hiện tại trả về mã HTTP `429` (Rate limit) hoặc `402` (Hết quota), engine ngay lập tức chuyển sang Key tiếp theo trong mảng mà người dùng không hề bị báo lỗi.

### 2.2. Dữ liệu Tri thức & Trích xuất (RAG Engine)
- **File thực thi:** `src/lib/knowledge.ts`
- **Dữ liệu nguồn:**
  - `data/k12_knowledge.txt`: File tổng hợp toàn bộ 88+ bài viết nghiệp vụ K12Online đã được cào và làm sạch.
  - `data/articles/`: Thư mục chứa từng bài viết riêng rẽ.
- **Cơ chế tìm kiếm:** Bóc tách từ khóa thông minh, xếp hạng theo độ liên quan (BM25/Keyword scoring) để chỉ đưa 2–3 bài viết liên quan nhất vào ngữ cảnh, tiết kiệm token tối đa.

### 2.3. Trải nghiệm Người Dùng (Frontend UX)
- **Chế độ Khách (Guest Mode):** Vào web là tra cứu được ngay, không ép buộc đăng nhập.
- **Chế độ Thành viên:** Đăng nhập qua Supabase Auth (Google / Magic link) để đồng bộ lịch sử chat vĩnh viễn trên đám mây.
- **Bảo mật Cloudflare Turnstile:** Xác minh người thật, ngăn chặn bot cào ngược.
- **Modal Ủng hộ (Donate ☕):** Kêu gọi hỗ trợ tiền server tự nguyện từ cộng đồng.

---

## 3. Cách khởi chạy dự án

1. Mở thư mục `C:\Users\thhoang\Desktop\K12Online_Chatbot`.
2. Mở file `.env.local` và dán OpenRouter API Key vào biến:
   ```env
   OPENROUTER_API_KEYS=sk-or-v1-key1,sk-or-v1-key2
   ```
3. Chạy file `run.bat` (hoặc mở terminal gõ `npm run dev`).
4. Truy cập trình duyệt: `http://localhost:3000`.
