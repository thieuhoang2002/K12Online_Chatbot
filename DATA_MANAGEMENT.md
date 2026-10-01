# 📚 CẨM NANG QUẢN LÝ DỮ LIỆU TRI THỨC K12ONLINE (DATA MANAGEMENT)

Tài liệu này hướng dẫn chi tiết quy trình **Thêm**, **Sửa**, **Xóa**, **Biên dịch** các bài viết hướng dẫn nghiệp vụ K12Online và cấu hình **Câu trả lời soạn sẵn (Pre-baked Answers)**.

---

## 1. Dữ liệu được lưu ở đâu?

Hệ thống quản lý tri thức gồm 3 thành phần cốt lõi trong thư mục `data/`:

1. **`data/articles/` (Thư mục bài viết nguồn)**: Chứa trọn bộ **383 file `.txt`** độc lập, tương ứng với toàn bộ các bài viết hướng dẫn nghiệp vụ trên cổng K12Online.
2. **`data/k12_knowledge.json` (File tri thức đã biên dịch siêu tốc)**: File JSON hợp nhất dung lượng ~1.18 MB chứa toàn bộ 383 bài viết. Khi Chatbot chạy, hệ thống đọc trực tiếp file này vào bộ nhớ RAM chỉ mất **~30ms**, giúp tra cứu RAG với tốc độ tức thì.
3. **`data/prebaked_answers.json` (Bộ câu trả lời soạn sẵn / Warm Cache)**: Lưu trữ các câu trả lời cẩm nang chi tiết dành riêng cho các bài viết quá khổ (>15.000 ký tự như bài *Thư viện số* 67.600 ký tự) để phản hồi ngay 0ms, 0 token và không bị cắt cụt.

---

## 2. Cấu trúc chuẩn của một bài viết nguồn (.txt)

Mỗi file trong `data/articles/` bắt buộc phải tuân theo cấu trúc định dạng sau:

```txt
### BÀI VIẾT [STT]: Tiêu đề bài viết nghiệp vụ
- Chuyên mục: Nhóm tính năng > Chuyên mục con
- Link gốc: https://hotro.k12online.vn/duong-dan-bai-viet-goc.html

**Nội dung:**
Bước 1: Hướng dẫn bước thứ nhất...
Bước 2: Hướng dẫn bước thứ hai...

Lưu ý:
+ Các điểm cần lưu ý đặc biệt đối với giáo viên hoặc học sinh...
```

### Giải thích các trường dữ liệu:
| Trường | Quy cách | Ý nghĩa đối với Chatbot |
| :--- | :--- | :--- |
| `### BÀI VIẾT [STT]: ...` | Chứa từ khóa chính của nghiệp vụ | Dùng để tìm kiếm ưu tiên cao nhất (`score += 10`) khi người dùng đặt câu hỏi có từ khóa tương tự. |
| `- Chuyên mục: ...` | Phân cấp tính năng K12Online | Giúp AI hiểu ngữ cảnh (ví dụ: đang thao tác trên Web hay trên App điện thoại). |
| `- Link gốc: ...` | Đường link dẫn tới bài viết chính thức của Viettel (có đuôi `.html`) | AI sẽ tự động đính kèm link này ở cuối câu trả lời để Thầy/Cô bấm vào xem hình ảnh minh họa chi tiết. |
| `**Nội dung:**` | Hướng dẫn theo từng bước (Bước 1, Bước 2...) | AI sẽ trích xuất đúng nội dung này để trả lời, tuyệt đối không bịa đặt tính năng không có thật. |

---

## 3. Quy trình Thêm / Sửa / Xóa bài viết

### 3.1. Thêm bài viết mới
1. Mở thư mục `data/articles/`.
2. Tạo một file mới với định dạng tên: `[STT]_[Ten_khong_dau_hoac_co_dau].txt`  
   *Ví dụ: `384_Huong_dan_tinh_nang_moi_k12online.txt`*
3. Soạn nội dung theo đúng cấu trúc chuẩn ở Phần 2 (lưu ý link gốc phải có định dạng đầy đủ `https://hotro.k12online.vn/...html`).
4. Lưu file lại.

### 3.2. Sửa bài viết cũ
1. Mở thư mục `data/articles/`.
2. Tìm file bài viết cần sửa (dùng chức năng Search của VS Code hoặc File Explorer).
3. Chỉnh sửa lại các bước hoặc đường link cho khớp với bản cập nhật mới nhất của K12Online.
4. Lưu file lại.

### 3.3. Tự động đồng bộ sang file JSON siêu tốc
Mỗi khi bạn thêm, sửa hoặc xóa bài viết trong `data/articles/`, hãy chạy lệnh sau tại terminal:
```bash
node scripts/build_knowledge_json.js
```
*(Lệnh này cũng tự động được kích hoạt mỗi khi bạn chạy `npm run build` nhờ script `prebuild` trong `package.json`).*

---

## 4. Quản lý Câu trả lời soạn sẵn (Pre-baked Answers)

Nếu một bài viết mới có nội dung quá dài (>15.000 ký tự) hoặc người dùng hỏi thường xuyên:
1. Mở file `data/prebaked_answers.json`.
2. Thêm một đối tượng cấu hình mới:
```json
{
  "id": "ma-dinh-danh-chu-de",
  "triggers": [
    "câu hỏi người dùng hay hỏi",
    "biến thể câu hỏi 2"
  ],
  "keywords_combination": [
    ["từ khóa 1", "từ khóa 2"]
  ],
  "reply": "Nội dung câu trả lời chuẩn mực định dạng Markdown...",
  "sources": [
    {
      "title": "Tiêu đề bài viết",
      "category": "Chuyên mục",
      "url": "https://hotro.k12online.vn/...html"
    }
  ],
  "followUps": [
    "Câu hỏi gợi ý 1?",
    "Câu hỏi gợi ý 2?"
  ]
}
```
3. Lưu file lại. Hệ thống sẽ tự động so khớp và phản hồi ngay lập tức cho người dùng mà không cần gọi LLM!

---

## 5. Quản lý Cơ sở Dữ liệu Supabase (Database Management)

Hệ thống sử dụng Supabase PostgreSQL với file định nghĩa lược đồ tại `supabase/schema.sql`:

### 5.1. Bảng `chat_feedback` (Lưu trữ đánh giá người dùng)
Mỗi khi Thầy/Cô bấm Like hoặc Dislike, dữ liệu được ghi vào bảng này:
| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `id` | `UUID` | Khóa chính tự sinh |
| `session_id` | `TEXT` | ID phiên hội thoại |
| `message_id` | `TEXT` | ID tin nhắn AI được đánh giá |
| `rating` | `TEXT` | Giá trị `'like'` hoặc `'dislike'` |
| `reason` | `TEXT` | Lý do không hài lòng (`wrong_content`, `missing_steps`, `broken_link`, `confusing`, `other`) |
| `comment` | `TEXT` | Lời nhắn góp ý chi tiết của người dùng |
| `user_email` | `TEXT` | Email người dùng (nếu đã đăng nhập, ngược lại ghi `guest`) |
| `created_at` | `TIMESTAMPTZ`| Thời điểm gửi đánh giá |

### 5.2. Bảng `admin_vault` (Kho lưu trữ xác thực Zero-Knowledge)
Bảng bảo mật cao cấp phục vụ trang `/admin`:
| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `id` | `UUID` | Khóa chính |
| `email` | `TEXT UNIQUE` | Email quản trị viên trong Whitelist |
| `ciphertext` | `TEXT` | Chuỗi mã hóa AES-256-GCM (Hex) |
| `salt` | `TEXT` | Muối ngẫu nhiên 16 bytes phục vụ PBKDF2 (Hex) |
| `iv` | `TEXT` | Initialization Vector 12 bytes của AES-GCM (Hex) |
| `hint` | `TEXT` | Gợi ý mật mã công khai để quản trị viên tự nhớ |
| `updated_at` | `TIMESTAMPTZ`| Thời điểm cập nhật mật khẩu lần cuối |

> **Lưu ý bảo mật:** Bảng này tuyệt đối KHÔNG lưu trữ mật khẩu dạng rõ (plaintext). Kể cả database bị rò rỉ, kẻ tấn công cũng không thể suy ngược lại Master Password nếu không có sức mạnh tính toán vượt trội hàng chục năm.

---

## 6. Quy trình Cải tiến Tri thức từ Báo cáo Telegram & Dislike

Khi nhận được thông báo phản hồi tiêu cực qua Telegram Webhook:
1. Đọc nội dung câu hỏi và lý do giáo viên phản hồi (ví dụ: *"Thiếu bước thực hiện"* hoặc *"Link gốc bị hỏng"*).
2. Mở trang quản trị `/admin` (hoặc mở trực tiếp `data/articles/`) để kiểm tra bài viết liên quan.
3. Chỉnh sửa bổ sung bước thao tác hoặc cập nhật link mới nhất từ Viettel.
4. Chạy `node scripts/build_knowledge_json.js` để cập nhật `data/k12_knowledge.json`.
5. Đẩy lên Git để Vercel tự động build và deploy.

---

## 7. Đẩy dữ liệu mới lên Production (Vercel)

Sau khi hoàn tất cập nhật trên máy tính, bạn chỉ cần mở Terminal và chạy lệnh Git:

```powershell
# 1. Đẩy lên nhánh dev
git add .
git commit -m "feat(data): cập nhật tri thức và prebaked answers K12Online"
git push origin dev

# 2. Đồng bộ sang nhánh main (cho Vercel Production)
git checkout main
git merge dev
git push origin main
git checkout dev
```

Nền tảng **Vercel** sẽ phát hiện thay đổi trên Git, tự động chạy lệnh `prebuild` để biên dịch tri thức mới và triển khai bản cập nhật chỉ trong khoảng **40 - 60 giây**.
