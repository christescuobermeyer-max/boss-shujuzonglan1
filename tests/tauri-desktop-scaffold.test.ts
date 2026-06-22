import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("tauri desktop scaffold", () => {
  it("应提供独立的桌面版项目目录和启动脚本", () => {
    const desktopRoot = join(process.cwd(), "desktop-tauri");
    const packageJsonPath = join(desktopRoot, "package.json");

    expect(existsSync(desktopRoot)).toBe(true);
    expect(existsSync(packageJsonPath)).toBe(true);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.["tauri:dev"]).toBeTruthy();
    expect(packageJson.scripts?.["tauri:build"]).toBeTruthy();
  });

  it("应以最大化原生窗口启动 tauri，并保留桌面全宽样式覆盖", () => {
    const desktopRoot = join(process.cwd(), "desktop-tauri");
    const tauriConfigPath = join(desktopRoot, "src-tauri", "tauri.conf.json");
    const desktopCssPath = join(desktopRoot, "app", "desktop.css");

    expect(existsSync(tauriConfigPath)).toBe(true);
    expect(existsSync(desktopCssPath)).toBe(true);

    const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, "utf8")) as {
      app?: {
        windows?: Array<{
          fullscreen?: boolean;
          maximized?: boolean;
          decorations?: boolean;
          width?: number;
          height?: number;
          resizable?: boolean;
        }>;
      };
    };
    const firstWindow = tauriConfig.app?.windows?.[0];

    expect(firstWindow?.fullscreen ?? false).toBe(false);
    expect(firstWindow?.maximized ?? false).toBe(true);
    expect(firstWindow?.decorations ?? true).toBe(true);
    expect(firstWindow?.resizable ?? false).toBe(true);

    const desktopCss = readFileSync(desktopCssPath, "utf8");

    expect(desktopCss).toContain('[data-shell-mode="tauri"] .dashboard-shell');
    expect(desktopCss).toContain("max-width: none;");
    expect(desktopCss).toContain("width: 100vw;");
    expect(desktopCss).toContain('[data-shell-mode="tauri"] .hero-card');
    expect(desktopCss).toContain("margin-left: 0;");
    expect(desktopCss).toContain("margin-right: 0;");
  });
});
