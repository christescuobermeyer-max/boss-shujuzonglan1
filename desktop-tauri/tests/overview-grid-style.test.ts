import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("overview grid style", () => {
  it("中间地图列应略缩窄，两侧列应略加宽", () => {
    const css = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8"
    );

    expect(css).toContain(
      "grid-template-columns: 320px minmax(0, 804px) 320px;"
    );
    expect(css).toContain(".overview-bottom-grid {");
    expect(css).toContain("align-items: stretch;");
  });

  it("顶部栏、七张卡片和三栏总览应使用同一内容宽度", () => {
    const css = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8"
    );

    expect(css).toContain(".hero-card,");
    expect(css).toContain(".metrics-grid,");
    expect(css).toContain(".overview-grid,");
    expect(css).toContain(".overview-bottom-grid,");
    expect(css).toContain("max-width: 1480px;");
    expect(css).toContain("margin-left: auto;");
    expect(css).toContain("margin-right: auto;");
  });
});
