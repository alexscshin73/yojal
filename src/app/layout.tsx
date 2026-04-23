import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yojal — Habla más, aprende mejor",
  description: "스페인어·영어 개인맞춤형 AI 학습 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-white">
        {children}
      </body>
    </html>
  );
}
