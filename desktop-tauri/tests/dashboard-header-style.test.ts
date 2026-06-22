import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard header style", () => {
  it("统计月份工具卡应贴近页头右侧边缘", () => {
    const source = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const toolbarBlock = source.match(/\.toolbar-stack\s*\{[^}]+\}/)?.[0] ?? "";

    expect(toolbarBlock).toContain(".toolbar-stack");
    expect(toolbarBlock).toContain("margin-left: auto;");
    expect(toolbarBlock).toContain("width: min(100%, 704px);");
    expect(toolbarBlock).toContain("max-width: 704px;");
  });

  it("页头工具区应改为横向双卡片布局", () => {
    const source = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const toolbarBlock = source.match(/\.toolbar-stack\s*\{[^}]+\}/)?.[0] ?? "";

    expect(toolbarBlock).toContain("flex-direction: row;");
  });

  it("在线店铺数卡片应改为不撑高页头的紧凑横向统计条", () => {
    const source = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

    expect(source).toContain(".toolbar-card-online::before");
    expect(source).toContain("flex: 0 0 328px;");
    expect(source).toContain(".online-shop-inline-stats");
    expect(source).toContain("grid-template-columns: minmax(0, 1.15fr) repeat(2, minmax(0, 1fr));");
  });
});
