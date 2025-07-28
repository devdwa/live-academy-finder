import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Live Acedemy Finder",
  description:
    "분명 빨모쌤한테 배운 표현인데 기억이 가물가물 🧐 다시 보고 싶은데 어떤 영상이었는지 떠오르지 않으시나요? 또는 미드를 보다가 새 표현을 발견했는데, 빨모쌤은 어떻게 사용하는지 궁금하신가요? 그럴 땐 Live Academy Finder를 활용해보세요!",
  icons: {
    icon: "/la-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
