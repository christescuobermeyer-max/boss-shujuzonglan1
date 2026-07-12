import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard header layout", () => {
  it("页头应将统计月份与更新时间重组成一个紧凑工具区", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-header.tsx"),
      "utf8"
    );

    expect(source).toContain('className="toolbar-card"');
    expect(source).toContain('className="toolbar-heading"');
    expect(source).toContain('className="toolbar-label"');
    expect(source).toContain('className="month-nav"');
    expect(source).toContain('className="update-status"');
    expect(source).not.toContain('className="toolbar-caption"');
    expect(source).not.toContain("全部");
    expect(source).not.toContain("武汉部");
    expect(source).not.toContain("宜昌部");
    expect(source).not.toContain("onChangeDept");
  });
});
