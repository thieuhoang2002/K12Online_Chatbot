# 🧪 HỆ THỐNG KIỂM THỬ TỰ ĐỘNG (AUTOMATION TESTING SUITE) - K12ONLINE CHATBOT

Thư mục này chứa toàn bộ tài liệu kiểm thử, ma trận testcase, kịch bản tự động hóa (test scripts) và báo cáo kết quả kiểm thử cho dự án K12Online Chatbot.

---

## 📁 Cấu trúc Thư mục Kiểm thử

```
tests/
├── README.md                      # Tài liệu tổng quan về bộ kiểm thử
├── test_plan.md                   # Kế hoạch chiến lược kiểm thử toàn diện (IEEE 829 / ISTQB)
├── test_cases.md                  # Danh sách chi tiết 39 Test Cases chuẩn mực
├── test_report.md                 # Báo cáo kết quả kiểm thử tự động mới nhất
├── run_all_tests.js               # Master Runner tự động thực thi và xuất báo cáo
├── unit/                          # Các bài kiểm thử đơn vị độc lập
│   ├── test_knowledge_rag.js      # Kiểm thử RAG, 383 bài viết, trích xuất link .html
│   ├── test_intent_prebaked.js    # Kiểm thử nhận diện ý định (<10ms) & Pre-baked cache
│   ├── test_zero_knowledge.js     # Kiểm thử mật mã PBKDF2 (100k) + AES-256-GCM + Auth Tag
│   └── test_ratelimit_security.js # Kiểm thử Rate limit 20 req/phút & Giới hạn payload 1.500 ký tự
└── integration/                   # Các bài kiểm thử tích hợp API & Webhook
    ├── test_api_chat.js           # Kiểm thử POST /api/chat (Chặn 403, 400)
    ├── test_api_feedback.js       # Kiểm thử POST /api/feedback (Like, Dislike, lý do)
    ├── test_api_admin.js          # Kiểm thử /api/admin/* (Whitelist email, Vault, Stats)
    ├── test_widget_embed.js       # Kiểm thử /embed, widget.js và CSP frame-ancestors *
    └── test_telegram_alerts.js    # Kiểm thử logic Webhook cảnh báo Telegram an toàn
```

---

## 🚀 Hướng Dẫn Thực Thi

Bạn có thể chạy toàn bộ hệ thống kiểm thử tự động chỉ bằng 1 dòng lệnh:

```bash
# Cách 1: Sử dụng npm script
npm test

# Cách 2: Chạy trực tiếp qua Node.js
node tests/run_all_tests.js
```

Sau khi chạy xong:
- Kết quả thời gian thực với màu sắc trực quan sẽ hiển thị trên Terminal.
- Hệ thống sẽ tự động cập nhật bản báo cáo tổng kết chi tiết vào tệp [`test_report.md`](file:///C:/Users/thhoang/Desktop/K12Online_Chatbot/tests/test_report.md).
