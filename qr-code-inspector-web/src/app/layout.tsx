import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "QR 코드 인식 향상을 위한 결함 검사 도구 개발",
  description: "QR 코드 인식 향상을 위한 결함 검사 도구 개발",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
