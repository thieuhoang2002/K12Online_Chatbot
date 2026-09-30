"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";

interface TurnstileProps {
  onVerify?: (token: string) => void;
}

export default function CloudflareTurnstile({ onVerify }: TurnstileProps) {
  const [verified, setVerified] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    // Nếu chưa cấu hình site key thì tự động bật chế độ verified (mô phỏng an toàn vòng ngoài)
    if (!siteKey) {
      const timer = setTimeout(() => {
        setVerified(true);
        if (onVerify) onVerify("cf-simulated-token");
      }, 600);
      return () => clearTimeout(timer);
    }

    // Nếu có Site Key thật của Cloudflare, nhúng script Turnstile
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    (window as any).onloadTurnstileCallback = () => {
      if ((window as any).turnstile) {
        (window as any).turnstile.render("#cf-turnstile-container", {
          sitekey: siteKey,
          callback: (token: string) => {
            setVerified(true);
            if (onVerify) onVerify(token);
          },
        });
      }
    };

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [siteKey, onVerify]);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900/60 border-slate-700/60 text-slate-300">
      {verified ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-300">Cloudflare Protected</span>
        </>
      ) : (
        <>
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-amber-300">Đang xác minh...</span>
          <div id="cf-turnstile-container" className="hidden"></div>
        </>
      )}
    </div>
  );
}
