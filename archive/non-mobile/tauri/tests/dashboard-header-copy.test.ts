import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard header copy", () => {
  it("页头眉文案应包含 BOSS 看板", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-header.tsx"),
      "utf8"
    );

    expect(source).toContain("呈尚策划 · 月度数据总览 · BOSS看板");
  });

  it("页头工具区应显示数据实时更新文案", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-header.tsx"),
      "utf8"
    );

    expect(source).toContain("数据实时更新");
  });
});
