/**
 * K12ONLINE AI ASSISTANT - EMBEDDABLE WIDGET SCRIPT
 * ------------------------------------------------------------------------
 * Cách dùng: Chèn đoạn mã sau vào thẻ <body> của website trường học:
 * <script src="https://k12onlinechatbot.thhoang.io.vn/widget.js" defer></script>
 */

(function () {
  if (window.__K12_WIDGET_LOADED__) return;
  window.__K12_WIDGET_LOADED__ = true;

  // Xác định domain gốc
  var scriptTag = document.currentScript;
  var scriptSrc = scriptTag ? scriptTag.src : "";
  var hostUrl = "https://k12onlinechatbot.thhoang.io.vn";

  if (scriptSrc && scriptSrc.startsWith("http")) {
    try {
      var parsed = new URL(scriptSrc);
      hostUrl = parsed.origin;
    } catch (e) {}
  }

  // Tạo CSS cho Widget
  var style = document.createElement("style");
  style.innerHTML = `
    #k12-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4), 0 2px 6px rgba(0,0,0,0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
      border: 2px solid rgba(255, 255, 255, 0.25);
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    #k12-widget-btn:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 12px 30px rgba(37, 99, 235, 0.5), 0 4px 10px rgba(0,0,0,0.2);
    }
    #k12-widget-btn:active {
      transform: scale(0.95);
    }
    #k12-widget-container {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 380px;
      height: 580px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 110px);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1);
      z-index: 999998;
      background: #131314;
      display: none;
      opacity: 0;
      transform: translateY(16px) scale(0.96);
      transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    #k12-widget-container.k12-open {
      display: block;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    #k12-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    .k12-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #ffffff;
      animation: k12-pulse 2s infinite;
    }
    @keyframes k12-pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
  `;
  document.head.appendChild(style);

  // Tạo Nút Tròn Bấm Mở
  var btn = document.createElement("div");
  btn.id = "k12-widget-btn";
  btn.title = "Tra cứu Trợ lý K12Online AI";

  var iconChat = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      <circle cx="9" cy="10" r="1" fill="white"></circle>
      <circle cx="12" cy="10" r="1" fill="white"></circle>
      <circle cx="15" cy="10" r="1" fill="white"></circle>
    </svg>
    <div class="k12-badge"></div>
  `;

  var iconClose = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  btn.innerHTML = iconChat;
  document.body.appendChild(btn);

  // Tạo Khung Chứa Iframe
  var container = document.createElement("div");
  container.id = "k12-widget-container";

  var iframe = document.createElement("iframe");
  iframe.id = "k12-widget-iframe";
  iframe.src = hostUrl + "/embed";
  iframe.title = "K12Online AI Chatbot Widget";
  iframe.allow = "clipboard-write";

  container.appendChild(iframe);
  document.body.appendChild(container);

  // Xử lý đóng mở
  var isOpen = false;
  btn.addEventListener("click", function () {
    isOpen = !isOpen;
    if (isOpen) {
      container.style.display = "block";
      setTimeout(function () {
        container.classList.add("k12-open");
      }, 10);
      btn.innerHTML = iconClose;
    } else {
      container.classList.remove("k12-open");
      setTimeout(function () {
        if (!isOpen) container.style.display = "none";
      }, 250);
      btn.innerHTML = iconChat;
    }
  });
})();
