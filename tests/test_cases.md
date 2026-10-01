# 📋 DANH SÁCH TEST CASES CHI TIẾT (TEST SPECIFICATION)
**Dự án:** Trợ Lý AI K12Online  
**Tổng số Test Cases:** 39 Test Cases  
**Phân bổ:** 20 Unit Tests + 19 Integration & Security Tests

---

## PHẦN 1: UNIT TESTS

### Phân hệ 1: RAG & Kho Tri Thức 383 Bài Viết (`src/lib/knowledge.ts`, `src/lib/synonyms.ts`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-RAG-01** | Kiểm tra toàn vẹn tệp tri thức JSON | Critical | Đọc tệp `data/k12_knowledge.json` | Tệp JSON trên đĩa | Chứa chính xác $\ge 383$ bài viết, cấu trúc hợp lệ (id, title, category, url, content). |
| **TC-RAG-02** | Tìm kiếm từ khóa chính xác | High | Gọi hàm tìm kiếm RAG | `"cách tạo đề thi trắc nghiệm"` | Trả về các bài viết liên quan đến đề thi trắc nghiệm, điểm số cao nhất thuộc nhóm Khảo thí/Đề thi. |
| **TC-RAG-03** | Ánh xạ Từ điển đồng nghĩa (Synonyms) | High | Truy vấn bằng từ lóng hoặc từ viết tắt | `"tkb giáo viên"`, `"học bạ điện tử"` | Tự động mở rộng từ khóa tương đương (`"thời khóa biểu"`, `"sổ điểm điện tử"`) và tìm đúng bài viết. |
| **TC-RAG-04** | Chuẩn hóa định dạng Link nguồn gốc | Critical | Quét toàn bộ danh sách 383 bài viết | Danh sách URL bài viết | 100% các liên kết gốc đều bắt đầu bằng `https://hotro.k12online.vn/` và kết thúc bằng `.html`. Không có liên kết cụt. |
| **TC-RAG-05** | Giới hạn dung lượng Context trả về | High | Truy vấn từ khóa rộng | `"hướng dẫn sử dụng k12"` | Tổng dung lượng context trích xuất được kiểm soát nghiêm ngặt $\le 15.000$ ký tự để không tràn token AI. |
| **TC-RAG-06** | Tìm kiếm câu hỏi không có trong dữ liệu | Medium | Truy vấn nội dung không liên quan | `"hướng dẫn nấu phở bò"` | Trả về mảng bài viết rỗng hoặc điểm thấp, không gây crash ứng dụng. |

---

### Phân hệ 2: Bộ Lọc Ý Định (Intent) & Pre-baked Warm Cache (`src/lib/intent.ts`, `src/lib/prebaked.ts`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-INTENT-01** | Nhận diện câu chào hỏi xã giao | High | Truyền câu chào vào `getCasualIntentReply` | `"Xin chào bạn"`, `"hello"` | Trả về câu chào lịch sự sư phạm, thời gian xử lý $< 5\text{ms}$, không gọi RAG. |
| **TC-INTENT-02** | Nhận diện lời cảm ơn & tạm biệt | High | Truyền câu cảm ơn | `"Cảm ơn trợ lý nhé"`, `"tạm biệt"` | Phản hồi lời cảm ơn và sẵn sàng hỗ trợ tiếp theo trong $< 5\text{ms}$. |
| **TC-PREBAKED-01** | So khớp bài viết cẩm nang khổng lồ (#255 Thư viện số) | Critical | Truyền câu hỏi cẩm nang thư viện số | `"hướng dẫn quản lý thư viện số"` | So khớp trúng định danh `thu-vien-so`, trả về câu trả lời mẫu 7 phân hệ đầy đủ, tiêu tốn 0 token AI. |
| **TC-PREBAKED-02** | Bỏ qua câu hỏi chi tiết nhỏ của bài cẩm nang | Medium | Truyền câu hỏi chi tiết hẹp | `"cách mượn sách trong thư viện"` | Không kích hoạt câu trả lời cẩm nang toàn cục, chuyển sang RAG để trả lời đúng trọng tâm. |

---

### Phân hệ 3: Mật Mã Bảo Mật Zero-Knowledge (`src/lib/zeroKnowledge.ts`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-ZK-01** | Khởi tạo Vault với PBKDF2 100.000 vòng | Critical | Gọi hàm `setupMasterPassword` | Mật khẩu: `"K12Admin@2026"`, Hint: `"Năm hiện tại"` | Trả về `{ ciphertext, salt, iv, hint }` ở dạng chuỗi Hex. Chiều dài salt 32 ký tự Hex (16 bytes), IV 24 ký tự Hex (12 bytes). |
| **TC-ZK-02** | Xác minh mật mã đúng (Correct Password Decryption) | Critical | Gọi hàm `verifyMasterPassword` với mật mã đúng | Mật mã đúng và dữ liệu Vault vừa tạo | Trả về `true`, giải mã thành công chuỗi xác thực. |
| **TC-ZK-03** | Từ chối mật mã sai (Wrong Password Rejection) | Critical | Gọi hàm `verifyMasterPassword` với mật mã sai | Mật mã sai: `"SaiPass12345"` | Trả về `false` (hoặc ném lỗi giải mã), tuyệt đối không mở khóa. |
| **TC-ZK-04** | Kiểm tra chống can thiệp 1 bit Ciphertext (Tamper Resistance) | Critical | Đổi 1 ký tự bất kỳ trong chuỗi `ciphertext` rồi giải mã | Ciphertext bị sửa đổi 1 ký tự Hex | Lập tức thất bại (`Authentication Tag mismatch`), trả về `false`. |
| **TC-ZK-05** | Kiểm tra tính độc nhất của Salt ngẫu nhiên | High | Khởi tạo 2 lần cùng 1 mật mã | Cùng 1 mật mã: `"TestPassword"` | Sinh ra 2 bộ Salt và Ciphertext hoàn toàn khác nhau (đảm bảo tính ngẫu nhiên an toàn). |
| **TC-ZK-06** | Đo lường thời gian sinh khóa PBKDF2 (Brute-force delay) | High | Đo thời gian chạy PBKDF2 100k rounds | Mật mã mẫu | Thời gian chạy $\ge 50\text{ms}$ và $\le 1.000\text{ms}$, đảm bảo làm chậm hacker hiệu quả mà không đơ UI. |

---

### Phân hệ 4: Kiểm Soát Tần Suất & Phòng Vệ Backend (`src/lib/ratelimit.ts`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-SEC-01** | Kiểm tra giới hạn độ dài Payload (>1500 ký tự) | High | Tạo chuỗi câu hỏi dài 2.000 ký tự | Chuỗi 2.000 ký tự | Bị chặn ngay từ tầng kiểm tra dữ liệu đầu vào. |
| **TC-SEC-02** | Cho phép Payload hợp lệ (<=1500 ký tự) | High | Tạo chuỗi câu hỏi 200 ký tự | Câu hỏi bình thường | Vượt qua kiểm tra độ dài. |
| **TC-SEC-03** | Kiểm tra bộ đếm Rate Limit theo IP | High | Gửi liên tiếp các yêu cầu cùng IP | IP giả lập `192.168.1.100` | 20 lượt đầu thành công (`success: true`), lượt thứ 21 bị chặn (`success: false`). |
| **TC-SEC-04** | Tự động hồi phục sau hết hạn chu kỳ Rate Limit | Medium | Đợi chu kỳ thời gian (hoặc reset timestamp) | IP vừa bị chặn | Cho phép tiếp tục gửi yêu cầu sau khi hết thời gian khóa. |

---

## PHẦN 2: INTEGRATION & API TESTS

### Phân hệ 5: Tuyến Chat API (`POST /api/chat`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-API-CHAT-01** | Chặn đứng yêu cầu thiếu Turnstile Token | Critical | Gửi `POST /api/chat` không kèm token | Payload thiếu `turnstileToken` | Trả về mã lỗi `HTTP 403 Forbidden`. |
| **TC-API-CHAT-02** | Chặn yêu cầu với Payload rỗng hoặc sai cú pháp | High | Gửi `POST /api/chat` với body rỗng `{}` | `{}` | Trả về mã lỗi `HTTP 400 Bad Request`. |
| **TC-API-CHAT-03** | Chặn câu hỏi vượt quá 1.500 ký tự | High | Gửi câu hỏi dài 1.600 ký tự | `{ message: "a".repeat(1600) }` | Trả về mã lỗi `HTTP 400 Bad Request`. |
| **TC-API-CHAT-04** | Xử lý thành công câu hỏi xã giao qua API | High | Gửi câu hỏi chào hỏi | `{ message: "Xin chào" }` | Phản hồi luồng SSE hoặc text với mã `HTTP 200 OK`. |

---

### Phân hệ 6: Tuyến Đánh Giá Phản Hồi (`POST /api/feedback`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-API-FB-01** | Gửi đánh giá Thích (Like) hợp lệ | High | Gửi `POST /api/feedback` với rating `like` | `{ rating: "like", sessionId: "s1", messageId: "m1" }` | Trả về mã `HTTP 200 OK`, `{ success: true }`. |
| **TC-API-FB-02** | Gửi đánh giá Không thích (Dislike) kèm lý do | Critical | Gửi `POST /api/feedback` với rating `dislike` | `{ rating: "dislike", reason: "missing_steps", comment: "Cần chi tiết hơn" }` | Trả về `HTTP 200 OK`, kích hoạt cảnh báo Telegram ngầm. |
| **TC-API-FB-03** | Từ chối đánh giá sai giá trị rating | High | Gửi rating không hợp lệ | `{ rating: "awesome" }` | Trả về mã `HTTP 400 Bad Request`. |
| **TC-API-FB-04** | Từ chối yêu cầu thiếu `rating` hoặc `sessionId` | Medium | Gửi body thiếu trường bắt buộc | `{ comment: "Thích" }` | Trả về mã `HTTP 400 Bad Request`. |

---

### Phân hệ 7: Tuyến Quản Trị Dashboard (`/api/admin/*`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-API-ADM-01** | Chặn truy cập Stats từ email ngoài Whitelist | Critical | Gửi `GET /api/admin/stats?email=hacker@evil.com` | Email hacker | Trả về mã lỗi `HTTP 403 Forbidden`. |
| **TC-API-ADM-02** | Cho phép lấy Stats với email Admin Whitelist | High | Gửi `GET /api/admin/stats?email=thieuhoangent@gmail.com` | Email quản trị viên | Trả về mã `HTTP 200 OK`, JSON chứa thống kê KPI (sessions, messages, feedback). |
| **TC-API-ADM-03** | Chặn truy cập Vault từ email trái phép | Critical | Gửi `POST /api/admin/vault` với email lạ | Email không thuộc whitelist | Trả về mã lỗi `HTTP 403 Forbidden`. |
| **TC-API-ADM-04** | Tương tác Vault hợp lệ với email Whitelist | Critical | Gửi `POST /api/admin/vault` với email whitelist | Action `get` hoặc `set` | Trả về mã `HTTP 200 OK` và dữ liệu ciphertext đã mã hóa. |
| **TC-API-ADM-05** | Thử nghiệm bắn cảnh báo Telegram Test từ Admin | High | Gửi `POST /api/admin/telegram-test` | Email quản trị viên | Trả về mã `HTTP 200 OK` (hoặc thông báo mock nếu chưa set token). |
| **TC-API-ADM-06** | Giám sát sức khỏe từng API Key và hạn ngạch | High | Gửi `GET /api/admin/health-check?email=...` | Email quản trị viên | Chặn email lạ (HTTP 403), cấp quyền Admin kiểm tra từng Key Gemini, OpenRouter và dịch vụ đám mây (HTTP 200). |

---

### Phân hệ 8: Widget Nhúng & Cấu Hình CSP (`/embed`, `widget.js`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-WIDGET-01** | Tải script nhúng tĩnh `public/widget.js` | Critical | Gửi `GET /widget.js` | Không | Trả về `HTTP 200 OK`, `Content-Type: application/javascript`, chứa logic tiêm DOM widget. |
| **TC-WIDGET-02** | Tải giao diện nhúng tối giản `/embed` | Critical | Gửi `GET /embed` | Không | Trả về `HTTP 200 OK`, HTML giao diện chat thu gọn. |
| **TC-WIDGET-03** | Kiểm tra Header CSP cho phép nhúng (Frame-Ancestors) | Critical | Kiểm tra Response Headers của `/embed` | Không | Headers chứa `Content-Security-Policy: frame-ancestors *` và `X-Frame-Options: ALLOWALL`. |

---

### Phân hệ 9: Hệ Thống Cảnh Báo Telegram Webhook (`src/lib/telegram.ts`)

| ID | Tên Test Case | Mức độ | Các bước thực hiện | Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **TC-TELE-01** | Kiểm tra định dạng thông báo HTML an toàn | High | Gọi `formatTelegramMessage` với dữ liệu đặc biệt | Ký tự `< > &` | Được escape an toàn (`&lt; &gt; &amp;`) để không bị lỗi parse mode HTML Telegram. |
| **TC-TELE-02** | Xử lý ngắt mềm (Graceful Degradation) khi thiếu Token | High | Gọi `sendTelegramAlert` khi biến môi trường rỗng | Token rỗng | Không ném ngoại lệ (Exception), in log cảnh báo và tiếp tục luồng bình thường. |
| **TC-TELE-03** | Kiểm soát thời gian chờ (Timeout 4s) | High | Mô phỏng request mạng bị treo | Timeout 4.000ms | Tự động hủy qua `AbortController`, không làm treo ứng dụng người dùng. |
