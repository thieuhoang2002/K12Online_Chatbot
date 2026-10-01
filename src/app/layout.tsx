import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trợ Lý K12Online - AI Hỗ Trợ Nghiệp Vụ Giáo Dục (Phi Lợi Nhuận)",
  description: "Công cụ hỏi đáp thông minh hỗ trợ tra cứu nghiệp vụ K12Online nhanh chóng, chính xác.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased bg-slate-950 text-slate-100 h-[100dvh] max-h-[100dvh] overflow-hidden">
        {children}
      </body>
    </html>
  );
}
