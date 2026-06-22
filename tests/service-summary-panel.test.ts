import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("service summary panel", () => {
  it("应改为当月总回款金额并移除回款店铺数行", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "service-summary-panel.tsx"),
      "utf8"
    );

    expect(source).toContain('title="当月总回款金额"');
    expect(source).toContain('subtitle="按当月平台回款金额汇总"');
    expect(source).not.toContain("回款店铺数");
  });

  it("左侧回款金额卡与右侧解约卡应共用同一最小高度", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-overview-section.tsx"),
      "utf8"
    );

    expect(source).toContain('className="summary-panel-shell"');
    expect(source).toContain('className="termination-panel-shell"');
    expect(source).toContain("leftPanelMinHeight");
    expect(source).toContain("rightPanelMinHeight");
  });

  it("测量侧边卡片高度前应先清空旧的最小高度", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "use-side-panel-min-height.ts"),
      "utf8"
    );

    expect(source).toContain('leftPanelRef.current.style.minHeight = ""');
    expect(source).toContain('rightPanelRef.current.style.minHeight = ""');
  });
});
