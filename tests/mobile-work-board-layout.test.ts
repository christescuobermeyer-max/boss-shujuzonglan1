import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile work board layout", () => {
  it("手机网页版底部接入运营工作进度和售后每日工作", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-dashboard.tsx"),
      "utf8"
    );

    expect(source).toContain("MobileWorkflowProgressSection");
    expect(source).toContain("MobileAftersalesDailySection");
    expect(source).toContain('fetch("/api/mobile/workflow/daily-monitor")');
    expect(source).toContain('fetch("/api/mobile/aftersales/daily-records")');
    expect(source.indexOf("MobileWorkflowProgressSection")).toBeLessThan(
      source.indexOf("MobileAftersalesDailySection")
    );
  });

  it("运营工作进度和售后每日工作应独立加载与独立报错", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-dashboard.tsx"),
      "utf8"
    );

    expect(source).toContain("workflowError");
    expect(source).toContain("aftersalesError");
    expect(source).toContain("workflowLoading");
    expect(source).toContain("aftersalesLoading");
    expect(source).not.toContain("Promise.all([workflowRequest, aftersalesRequest])");
    expect(source).not.toContain("workBoardsError");
  });
});
