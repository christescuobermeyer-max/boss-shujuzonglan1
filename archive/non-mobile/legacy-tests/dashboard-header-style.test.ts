import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard header style", () => {
  it("统计月份工具卡应贴近页头右侧边缘", () => {
    const source = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const toolbarBlock = source.match(/\.toolbar-stack\s*\{[^}]+\}/)?.[0] ?? "";

    expect(toolbarBlock).toContain(".toolbar-stack");
    expect(toolbarBlock).toContain("margin-left: auto;");
  });
});
