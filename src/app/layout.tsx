import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trợ Lý K12Online - AI Hỗ Trợ Nghiệp Vụ Giáo Dục (Phi Lợi Nhuận)",
  description: "Công cụ hỏi đáp thông minh dành cho Quý Thầy/Cô giáo và Cán bộ IT nhà trường tra cứu nghiệp vụ K12Online nhanh chóng, chính xác.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
