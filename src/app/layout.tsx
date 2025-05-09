import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Google Fonts에서 안정적인 Inter 폰트로 대체
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "코인 자동매매 대시보드",
  description: "코인 자동매매 시스템의 현황을 실시간으로 확인하는 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
