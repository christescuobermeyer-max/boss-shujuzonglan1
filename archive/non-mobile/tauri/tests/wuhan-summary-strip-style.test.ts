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

  it("五张卡片应改为武汉和宜昌双城市汇总", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "stats", "wuhan-opened-point-strip.tsx"),
      "utf8"
    );

    expect(source).toContain("武汉和宜昌回款数据");
    expect(source).toContain("武汉和宜昌累计开单本月回款");
    expect(source).toContain('label="武汉抽点店铺数"');
    expect(source).toContain('label="宜昌抽点店铺数"');
    expect(source).toContain('label="武汉回款金额"');
    expect(source).toContain('label="宜昌回款金额"');
    expect(source).not.toContain('label="总回款金额"');
    expect(source).not.toContain('label="美团回款金额"');
    expect(source).not.toContain('label="饿了么回款金额"');
  });
});
