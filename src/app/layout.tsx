import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "Trading Diary | 미국 주식 단타 매매 일지",
  description: "모바일 최적화 미국 주식 단타 매매 일지 시스템",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trading Diary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        <main className="mx-auto max-w-lg pb-20 pt-2 px-4">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
