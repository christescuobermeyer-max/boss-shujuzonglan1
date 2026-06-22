import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("wuhan summary strip style", () => {
  it("武汉回款卡片应使用居中排版", () => {
    const css = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8"
    );

    expect(css).toContain("align-items: center;");
    expect(css).toContain("text-align: center;");
  });

  it("武汉回款卡片应拆分标签区和数字主视觉区", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "wuhan-opened-point-strip.tsx"),
      "utf8"
    );

    expect(source).toContain("wuhan-summary-card-head");
    expect(source).toContain("wuhan-summary-card-body");
    expect(source).toContain("wuhan-summary-value-number");
    expect(source).toContain("wuhan-summary-value-unit");
  });
});
