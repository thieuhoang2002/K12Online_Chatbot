import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://k12onlinechatbot.thhoang.io.vn"),
  title: "K12Online AI Assistant — Trợ Lý Hỗ Trợ Nghiệp Vụ Giáo Dục (Phi Lợi Nhuận)",
  description:
    "Trợ lý AI thông minh hỗ trợ Quý Thầy/Cô giáo và Cán bộ IT tra cứu chuẩn xác 383+ quy trình, thao tác nghiệp vụ K12Online. Phản hồi siêu tốc 0ms, trích dẫn nguồn chính thức Viettel.",
  keywords: [
    "K12Online",
    "K12Online Chatbot",
    "Trợ lý K12Online",
    "K12Online AI Assistant",
    "Viettel K12Online",
    "Nghiệp vụ K12Online",
    "Hỗ trợ giáo viên",
    "Thi trực tuyến K12Online",
    "Thieu Viet Hoang",
    "thhoang.io.vn",
  ],
  authors: [{ name: "Thieu Viet Hoang", url: "https://thhoang.io.vn" }],
  creator: "Thieu Viet Hoang",
  publisher: "Thiều Hoàng",
  alternates: {
    canonical: "https://k12onlinechatbot.thhoang.io.vn",
  },
  openGraph: {
    title: "K12Online AI Assistant — Trợ Lý Hỗ Trợ Nghiệp Vụ Giáo Dục (Phi Lợi Nhuận)",
    description:
      "Trợ lý AI thông minh hỗ trợ Quý Thầy/Cô và Cán bộ IT tra cứu quy trình, hướng dẫn tạo đề thi Word ABCD, thời khóa biểu và xử lý lỗi hệ thống tức thì. 100% Phi lợi nhuận.",
    url: "https://k12onlinechatbot.thhoang.io.vn",
    siteName: "K12Online AI Assistant",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "K12Online AI Assistant — Trợ Lý Hỗ Trợ Nghiệp Vụ Giáo Dục",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "K12Online AI Assistant — Trợ Lý Hỗ Trợ Nghiệp Vụ Giáo Dục",
    description:
      "Trợ lý AI thông minh hỗ trợ Thầy Cô tra cứu 383+ quy trình K12Online tức thì. Dual-Engine AI, trích dẫn nguồn chính thức Viettel.",
    creator: "@thhoang0903",
    images: ["/og-image.png"],
  },
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
