# 📚 CẨM NANG QUẢN LÝ DỮ LIỆU TRI THỨC K12ONLINE (DATA MANAGEMENT)

Tài liệu này hướng dẫn chi tiết quy trình **Thêm**, **Sửa**, và **Xóa** các bài viết hướng dẫn nghiệp vụ K12Online để Chatbot luôn cập nhật thông tin chuẩn xác nhất.

---

## 1. Dữ liệu được lưu ở đâu?

Toàn bộ tri thức của Chatbot được đọc trực tiếp từ thư mục:
📂 **`data/articles/`**

Hệ thống hoạt động theo cơ chế **File-based RAG**: Mỗi bài viết nghiệp vụ là một file text độc lập định dạng `.txt`. Mỗi khi server khởi động hoặc xử lý câu hỏi, hệ thống sẽ tự động quét toàn bộ các file trong thư mục này.

---

## 2. Cấu trúc chuẩn của một bài viết

Mỗi file trong `data/articles/` bắt buộc phải tuân theo cấu trúc định dạng sau:

```txt
### BÀI VIẾT [STT]: Tiêu đề bài viết nghiệp vụ
- Chuyên mục: Nhóm tính năng > Chuyên mục con
- Link gốc: https://hotro.k12online.vn/duong-dan-bai-viet-goc

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
| `- Link gốc: ...` | Đường link dẫn tới bài viết chính thức của Viettel | AI sẽ tự động đính kèm link này ở cuối câu trả lời để Thầy/Cô bấm vào xem hình ảnh minh họa chi tiết. |
| `**Nội dung:**` | Hướng dẫn theo từng bước (Bước 1, Bước 2...) | AI sẽ trích xuất đúng nội dung này để trả lời, tuyệt đối không bịa đặt tính năng không có thật. |

---

## 3. Quy trình thực hiện

### 3.1. Thêm bài viết mới
1. Mở thư mục `data/articles/`.
2. Tạo một file mới với định dạng tên: `[STT]_[Ten_khong_dau_hoac_co_dau].txt`  
   *Ví dụ: `089_Huong_dan_xuat_bao_cao_diem_danh_hoc_sinh.txt`*
3. Soạn nội dung theo đúng cấu trúc chuẩn ở phần 2.
4. Lưu file lại.

### 3.2. Sửa bài viết cũ
1. Mở thư mục `data/articles/`.
2. Tìm file bài viết cần sửa (có thể dùng chức năng Search trong VS Code hoặc File Explorer).
3. Chỉnh sửa lại các bước hoặc đường link cho khớp với bản cập nhật mới nhất của K12Online.
4. Lưu file lại.

### 3.3. Xóa bài viết lỗi thời
1. Mở thư mục `data/articles/`.
2. Tìm file bài viết có tính năng đã bị K12Online loại bỏ và xóa file đó.

---

## 4. Đẩy dữ liệu mới lên trang web đang chạy (Production)

Sau khi hoàn tất thao tác trong thư mục `data/articles/` trên máy tính, bạn chỉ cần mở Terminal (Command Prompt hoặc PowerShell) tại thư mục dự án và chạy 3 lệnh Git:

```powershell
git add .
git commit -m "feat(data): cập nhật dữ liệu nghiệp vụ K12Online"
git push origin main
```

### Cơ chế tự động hóa:
* Ngay khi lệnh `git push` hoàn tất, nền tảng **Vercel** sẽ phát hiện thay đổi và tự động chạy tiến trình Build & Deploy trong khoảng **40 - 60 giây**.
* Trang web [k12onlinechatbot.thhoang.io.vn](https://k12onlinechatbot.thhoang.io.vn) sẽ tự động nạp tri thức mới mà bạn không cần phải khởi động lại server thủ công.
