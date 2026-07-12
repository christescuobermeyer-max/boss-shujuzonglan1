import type { Metadata } from "next";
import "./globals.css";
import "./desktop.css";

export const metadata: Metadata = {
  title: "呈尚策划 · 月度数据总览 · BOSS看板",
  description: "代运营数据统计系统桌面版，展示月度店铺、解约与抽点回款趋势。"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" data-shell-mode="tauri">
      <body>{children}</body>
    </html>
  );
}
