import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("login navigation order", () => {
  it("登录页不应在跳转前等待窗口放大逻辑", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "login", "desktop-login-page.tsx"),
      "utf8"
    );

    expect(source).not.toContain("await promoteDashboardWindow()");
    expect(source).toContain('router.replace("/stats")');
  });

  it("统计页挂载后应负责桌面主窗口放大", () => {
    const statsPageSource = readFileSync(
      join(process.cwd(), "app", "stats", "page.tsx"),
      "utf8"
    );
    const syncPath = join(
      process.cwd(),
      "components",
      "desktop",
      "desktop-stats-window-sync.tsx"
    );

    expect(existsSync(syncPath)).toBe(true);
    expect(readFileSync(syncPath, "utf8")).toContain("promoteDashboardWindow");
    expect(statsPageSource).toContain("DesktopStatsWindowSync");
  });
});
