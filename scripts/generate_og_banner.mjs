import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);

// Look for playwright in parent/sibling paths
let playwright;
const candidatePaths = [
  'playwright',
  'C:/Users/thhoang/Desktop/etsy-command-center/node_modules/playwright',
];

for (const p of candidatePaths) {
  try {
    playwright = require(p);
    if (playwright) break;
  } catch (e) {
    // try next
  }
}

if (!playwright) {
  console.error('Playwright not found');
  process.exit(1);
}

const { chromium } = playwright;

async function generateOgBanner() {
  console.log('🎨 Generating 1200x630 (2400x1260 2x) K12Online OpenGraph Banner...');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // 2x crisp retina rendering (2400x1260)
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      width: 1200px;
      height: 630px;
      background-color: #030712;
      background-image: 
        radial-gradient(circle at 18% 22%, rgba(2, 132, 199, 0.22) 0%, transparent 45%),
        radial-gradient(circle at 82% 78%, rgba(79, 70, 229, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 60%),
        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 100% 100%, 36px 36px, 36px 36px;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 48px 56px;
      overflow: hidden;
      position: relative;
    }

    /* Ambient glow elements */
    .glow-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent 0%, #38bdf8 30%, #6366f1 70%, transparent 100%);
    }

    /* Left column */
    .left-col {
      width: 530px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      z-index: 2;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(14, 165, 233, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.35);
      color: #38bdf8;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      width: fit-content;
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 10px #38bdf8;
    }

    .headline {
      font-size: 44px;
      font-weight: 900;
      line-height: 1.14;
      letter-spacing: -0.025em;
      margin: 16px 0 12px 0;
      color: #ffffff;
    }

    .headline .gradient-text {
      background: linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 14.5px;
      line-height: 1.55;
      color: #94a3b8;
      margin-bottom: 20px;
    }

    .pills-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin-bottom: 22px;
    }

    .pill {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 8px;
      padding: 7px 11px;
      font-size: 11.5px;
      font-weight: 600;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .pill-icon {
      font-size: 13px;
    }

    .brand-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 14px;
    }

    .domain-text {
      font-size: 13px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.02em;
    }

    .author-tag {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    /* Right column - Mock UI Card */
    .right-col {
      width: 535px;
      height: 100%;
      background: rgba(11, 17, 33, 0.88);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 18px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.08);
      backdrop-filter: blur(16px);
      z-index: 2;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 12px;
    }

    .mac-dots {
      display: flex;
      gap: 6px;
    }

    .mac-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .mac-red { background: #ef4444; }
    .mac-yellow { background: #f59e0b; }
    .mac-green { background: #10b981; }

    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.04em;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* User Prompt Bubble */
    .user-bubble {
      background: rgba(30, 41, 59, 0.75);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 12px 12px 3px 12px;
      padding: 10px 14px;
      margin-left: 36px;
      font-size: 12.5px;
      color: #e2e8f0;
      line-height: 1.45;
    }

    .user-tag {
      font-size: 10px;
      font-weight: 700;
      color: #38bdf8;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    /* AI Response Card */
    .ai-card {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 12px;
      padding: 14px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .ai-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 9px;
    }

    .ai-profile {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ai-avatar {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: linear-gradient(135deg, #0284c7, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }

    .ai-name {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
    }

    .speed-badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .ai-content {
      font-size: 11.8px;
      line-height: 1.5;
      color: #cbd5e1;
    }

    .ai-content strong {
      color: #38bdf8;
    }

    .ai-source-box {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .source-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10.5px;
      color: #60a5fa;
      background: rgba(37, 99, 235, 0.12);
      border: 1px solid rgba(96, 165, 250, 0.25);
      padding: 3px 8px;
      border-radius: 6px;
    }

    .rag-tag {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
    }

    /* Bottom Quick Prompts */
    .quick-prompts-bar {
      display: flex;
      gap: 6px;
      overflow: hidden;
    }

    .qp-chip {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 9999px;
      padding: 4px 10px;
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="glow-line"></div>

  <!-- Left Column -->
  <div class="left-col">
    <div>
      <div class="badge">
        <div class="badge-dot"></div>
        <span>CỘNG ĐỒNG GIÁO DỤC • PHI LỢI NHUẬN</span>
      </div>

      <h1 class="headline">
        TRA CỨU NHANH.<br>
        <span class="gradient-text">NGHIỆP VỤ K12ONLINE.</span><br>
        CHÍNH XÁC 100%.
      </h1>

      <p class="subtitle">
        Trợ lý AI thông minh hỗ trợ Quý Thầy/Cô và Cán bộ IT tra cứu quy trình, hướng dẫn tạo đề thi Word ABCD, thời khóa biểu và xử lý lỗi hệ thống tức thì.
      </p>

      <div class="pills-grid">
        <div class="pill">
          <span class="pill-icon">⚡</span>
          <span>Dual-Engine Gemini & OpenRouter</span>
        </div>
        <div class="pill">
          <span class="pill-icon">📚</span>
          <span>RAG 383+ Bài Nghiệp Vụ Viettel</span>
        </div>
        <div class="pill">
          <span class="pill-icon">🚀</span>
          <span>Warm Cache Siêu Tốc 0ms Latency</span>
        </div>
        <div class="pill">
          <span class="pill-icon">🛡️</span>
          <span>Bảo Vệ Đa Tầng Cloudflare</span>
        </div>
      </div>
    </div>

    <div class="brand-footer">
      <div class="domain-text">k12onlinechatbot.thhoang.io.vn</div>
      <div class="author-tag">Dự án cộng đồng giáo dục</div>
    </div>
  </div>

  <!-- Right Column: Interactive UI Mockup -->
  <div class="right-col">
    <div class="card-header">
      <div class="mac-dots">
        <div class="mac-dot mac-red"></div>
        <div class="mac-dot mac-yellow"></div>
        <div class="mac-dot mac-green"></div>
      </div>
      <div class="card-title">
        <span>🎓 K12Online AI Assistant</span>
        <span style="color: #64748b;">•</span>
        <span style="color: #38bdf8;">Trực tuyến 24/7</span>
      </div>
      <div style="width: 30px;"></div>
    </div>

    <!-- User Question -->
    <div class="user-bubble">
      <div class="user-tag">Thầy Cô hỏi</div>
      <div>Hướng dẫn cách nhập đề thi trắc nghiệm từ file Word dạng ABCD lên K12Online?</div>
    </div>

    <!-- AI Response -->
    <div class="ai-card">
      <div class="ai-header">
        <div class="ai-profile">
          <div class="ai-avatar">🎓</div>
          <div>
            <div class="ai-name">K12Online Assistant</div>
          </div>
        </div>
        <div class="speed-badge">⚡ 0.03s • Chuẩn nghiệp vụ</div>
      </div>

      <div class="ai-content">
        Dạ Thầy/Cô làm theo <strong>3 bước chuẩn hóa</strong> sau ạ:<br>
        • <strong>Bước 1:</strong> Định dạng câu hỏi theo mẫu <code>[NB] Câu 1:</code>, đáp án in hoa <code>A. B. C. D.</code> và gạch chân/tô đỏ đáp án đúng.<br>
        • <strong>Bước 2:</strong> Vào <i>Quản lý thi & kiểm tra ➔ Ngân hàng câu hỏi</i>, chọn <i>Nhập từ Word dạng ABCD</i>.<br>
        • <strong>Bước 3:</strong> Tải file lên, hệ thống tự tách câu hỏi 100% không lo lỗi format.
      </div>

      <div class="ai-source-box">
        <div class="source-pill">
          <span>🔗</span>
          <span>k12online.vn/.../nhap-de-thi-word.html</span>
        </div>
        <div class="rag-tag">Nguồn Viettel K12</div>
      </div>
    </div>

    <!-- Bottom Quick Chips -->
    <div class="quick-prompts-bar">
      <div class="qp-chip">🔑 Lấy lại mật khẩu</div>
      <div class="qp-chip">📝 Đề thi Word ABCD</div>
      <div class="qp-chip">📅 Thời khóa biểu</div>
      <div class="qp-chip">📚 Thư viện số</div>
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(htmlContent);

  const buffer = await page.screenshot({ type: 'png' });
  await browser.close();

  // Ensure public and src/app directories exist
  const targets = [
    path.resolve('public/og-image.png'),
    path.resolve('src/app/opengraph-image.png'),
    path.resolve('src/app/twitter-image.png'),
  ];

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buffer);
    console.log(`✔ Generated: ${target} (${buffer.length} bytes)`);
  }

  console.log('🎉 1200x630 (2400x1260 2x Retina) OpenGraph Banner generated successfully!');
}

generateOgBanner().catch((err) => {
  console.error('Error generating banner:', err);
  process.exit(1);
});
