import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop shell mode", () => {
  it("桌面版布局应启用 tauri 外壳模式并引入独立样式", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "layout.tsx"),
      "utf8"
    );

    expect(source).toContain('import "./desktop.css";');
    expect(source).toContain('<html lang="zh-CN" data-shell-mode="tauri">');
  });

  it("桌面版应移除主容器最大宽度限制", () => {
    const css = readFileSync(join(process.cwd(), "app", "desktop.css"), "utf8");

    expect(css).toContain('[data-shell-mode="tauri"] .dashboard-shell');
    expect(css).toContain("max-width: none;");
    expect(css).toContain("width: 100vw;");
    expect(css).toContain('[data-shell-mode="tauri"] .overview-grid');
    expect(css).toContain("grid-template-columns: 340px minmax(0, 1fr) 340px;");
  });
});
