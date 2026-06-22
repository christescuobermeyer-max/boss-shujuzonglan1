import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("bottom trend layout", () => {
  it("平台回款趋势图应并回左右两侧列，不再单独放在 overview-bottom-grid", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "dashboard-overview-section.tsx"),
      "utf8"
    );

    expect(source).toContain('title="每日美团总回款趋势"');
    expect(source).toContain('title="每日饿了么总回款趋势"');
    expect(source).not.toContain('className="overview-bottom-grid"');
  });
});
