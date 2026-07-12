import { isTauri } from "@tauri-apps/api/core";
import { LogicalSize, getCurrentWindow } from "@tauri-apps/api/window";

export const DASHBOARD_TITLE = "呈尚策划 · 月度数据总览 · BOSS看板";

export async function promoteDashboardWindow() {
  if (!isTauri()) return;

  const appWindow = getCurrentWindow();
  await appWindow.setTitle(DASHBOARD_TITLE);
  await appWindow.setResizable(true);
  await appWindow.setMinSize(new LogicalSize(1100, 760));
  await appWindow.setSize(new LogicalSize(1600, 960));
  await appWindow.center();
  await appWindow.maximize();
}
