import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K12Online AI Assistant - Trợ Lý Hỗ Trợ Nghiệp Vụ Giáo Dục (Phi Lợi Nhuận)",
  description: "Trợ lý AI thông minh hỗ trợ tra cứu nghiệp vụ K12Online chính xác và nhanh chóng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased bg-slate-950 text-slate-100 min-h-[100dvh]">
        {children}
      </body>
    </html>
  );
}
