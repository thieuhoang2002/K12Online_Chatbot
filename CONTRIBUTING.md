# Hướng Dẫn Đóng Góp (Contributing Guide)

Cảm ơn bạn đã quan tâm đến việc đóng góp cho dự án **Trợ Lý AI K12Online**! Dự án phi lợi nhuận này được phát triển nhằm hỗ trợ thầy/cô giáo và cán bộ nhà trường tra cứu nghiệp vụ K12Online một cách nhanh chóng và chính xác.

Mọi sự đóng góp từ bạn — từ việc sửa lỗi chính tả, cải tiến giao diện, tối ưu hoá thuật toán RAG, bổ sung dữ liệu cẩm nang hay phát triển tính năng mới — đều rất đáng trân trọng.

---

## 🛠️ Chuẩn Bị Môi Trường Phát Triển

Dự án sử dụng công nghệ:
- **Next.js 15 (App Router)** & **React 19**
- **TypeScript** & **Tailwind CSS**
- **Supabase** & **Upstash Redis Cloud**
- **Node.js**: Phiên bản 18.x trở lên (khuyên dùng Node 20 LTS)

### Các bước cài đặt:

1. **Fork repository** trên GitHub về tài khoản của bạn.
2. **Clone** repo đã fork về máy cục bộ:
   ```bash
   git clone https://github.com/<your-username>/K12Online_Chatbot.git
   cd K12Online_Chatbot
   ```
3. **Cài đặt dependencies**:
   ```bash
   npm install
   ```
4. **Thiết lập biến môi trường**:
   Sao chép file `.env.example` thành `.env.local` và điền các khóa cần thiết (xem thêm tại `GUIDE.md`):
   ```bash
   cp .env.example .env.local
   ```
5. **Biên dịch dữ liệu tri thức (nếu có thay đổi cẩm nang)**:
   ```bash
   npm run build:data
   ```
6. **Khởi chạy ứng dụng ở chế độ phát triển (Dev Mode)**:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại [http://localhost:3000](http://localhost:3000) để kiểm tra.

---

## 🌿 Quy Chuẩn Đặt Tên Nhánh (Git Branching)

Hãy tạo nhánh mới từ `main` trước khi thực hiện thay đổi:
- Tính năng mới: `feature/ten-tinh-nang` (ví dụ: `feature/export-excel`)
- Sửa lỗi: `fix/ten-loi` (ví dụ: `fix/scroll-mobile`)
- Cải tiến tài liệu: `docs/noi-dung` (ví dụ: `docs/update-guide`)
- Tái cấu trúc: `refactor/ten-module`

```bash
git checkout -b feature/ten-tinh-nang
```

---

## 📝 Quy Chuẩn Viết Commit (Conventional Commits)

Chúng tôi khuyến khích định dạng commit message rõ ràng:
- `feat`: Thêm tính năng mới (ví dụ: `feat: add voice search support`)
- `fix`: Sửa lỗi (ví dụ: `fix: resolve hydration warning on banner`)
- `docs`: Cập nhật tài liệu (ví dụ: `docs: update deployment guide`)
- `style`: Thay đổi giao diện, định dạng code không ảnh hưởng logic
- `refactor`: Tái cấu trúc code
- `perf`: Cải thiện hiệu năng
- `test`: Thêm hoặc sửa tests (`npm run test`)

---

## 🧪 Kiểm Thử Trước Khi Mở PR

Trước khi tạo Pull Request, vui lòng đảm bảo mã nguồn vượt qua các bước kiểm tra:

```bash
# 1. Chạy lint kiểm tra cú pháp
npm run lint

# 2. Chạy bộ kiểm thử tự động
npm run test

# 3. Thử nghiệm build production
npm run build
```

---

## 🚀 Gửi Pull Request (PR)

1. Đẩy nhánh của bạn lên GitHub:
   ```bash
   git push origin feature/ten-tinh-nang
   ```
2. Truy cập GitHub của bạn và bấm **Compare & pull request**.
3. Điền tiêu đề và mô tả rõ ràng:
   - Mục đích của PR (sửa lỗi gì hoặc bổ sung tính năng nào).
   - Ảnh chụp màn hình / video demo (nếu thay đổi UI).
4. Chờ người bảo trì dự án review và phản hồi.

---

Cảm ơn bạn đã chung tay vì cộng đồng giáo dục Việt Nam! ❤️
