import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "呈尚策划 · 数据总览",
  description: "代运营数据统计系统，展示月度店铺、解约与抽点回款趋势。"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
