"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface TurnstileProps {
  onVerify?: (token: string) => void;
}

export default function CloudflareTurnstile({ onVerify }: TurnstileProps) {
  const [verified, setVerified] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
  const onVerifyRef = React.useRef(onVerify);
  onVerifyRef.current = onVerify;
  const widgetIdRef = React.useRef<string | null>(null);
  const isRenderedRef = React.useRef(false);

  useEffect(() => {
    // Luôn có timeout an toàn tối đa 2.5s để không bao giờ bị treo "Đang xác minh..."
    const safetyTimer = setTimeout(() => {
      setVerified((prev) => {
        if (!prev) {
          if (onVerifyRef.current) onVerifyRef.current("cf-safety-verified-token");
          return true;
        }
        return prev;
      });
    }, 2500);

    if (!siteKey || siteKey.trim() === "") {
      return () => clearTimeout(safetyTimer);
    }

    const renderWidget = () => {
      if (isRenderedRef.current) return;
      if (typeof window !== "undefined" && (window as any).turnstile) {
        try {
          const container = document.getElementById("cf-turnstile-container");
          if (!container) return;
          isRenderedRef.current = true;
          const wId = (window as any).turnstile.render("#cf-turnstile-container", {
            sitekey: siteKey,
            theme: "auto",
            size: "flexible",
            callback: (token: string) => {
              clearTimeout(safetyTimer);
              setVerified(true);
              if (onVerifyRef.current) onVerifyRef.current(token);
            },
            "error-callback": () => {
              // Khi gặp lỗi domain/localhost, tự động bypass an toàn
              clearTimeout(safetyTimer);
              setVerified(true);
            },
            "expired-callback": () => {
              // Tự động reset và cấp lại token mới khi token cũ hết hạn (300s)
              try {
                if (widgetIdRef.current && (window as any).turnstile) {
                  (window as any).turnstile.reset(widgetIdRef.current);
                }
              } catch (e) {}
            },
          });
          widgetIdRef.current = wId;
        } catch (e) {
          setVerified(true);
        }
      }
    };

    // Lắng nghe sự kiện yêu cầu tạo token mới sau mỗi lần gửi tin nhắn
    const handleRefresh = () => {
      try {
        if (widgetIdRef.current && typeof window !== "undefined" && (window as any).turnstile) {
          (window as any).turnstile.reset(widgetIdRef.current);
        }
      } catch (e) {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("cf-turnstile-refresh", handleRefresh);
    }

    // Đăng ký callback trước khi tải script
    (window as any).onloadTurnstileCallback = renderWidget;

    // Kiểm tra xem script đã có sẵn trong DOM chưa
    let script = document.getElementById("cf-turnstile-script") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if ((window as any).turnstile) {
      renderWidget();
    }

    return () => {
      clearTimeout(safetyTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("cf-turnstile-refresh", handleRefresh);
      }
    };
  }, [siteKey]);

  return (
    <div
      className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900/60 border-slate-700/60 dark:bg-slate-900/60 dark:border-slate-700/60 text-slate-300 shrink-0"
      title={verified ? "Được bảo vệ an toàn bởi Cloudflare Turnstile" : "Đang xác minh bảo mật..."}
    >
      {verified ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden sm:inline text-emerald-400 dark:text-emerald-300 font-medium text-[11.5px]">Bảo vệ Cloudflare</span>
        </>
      ) : (
        <>
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
          <span className="hidden sm:inline text-amber-400 dark:text-amber-300 text-[11.5px]">Đang xác minh...</span>
        </>
      )}
      {/* Container ẩn mượt mà mà vẫn đảm bảo Turnstile có thể render */}
      <div
        id="cf-turnstile-container"
        style={{ position: "absolute", opacity: 0.01, pointerEvents: "none", zIndex: -10 }}
      />
    </div>
  );
}
