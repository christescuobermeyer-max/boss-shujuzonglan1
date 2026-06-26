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
    expect(source).toContain("/api/mobile/aftersales/daily-records?date=");
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

  it("售后每日工作默认展示昨天并支持日期筛选", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-dashboard.tsx"),
      "utf8"
    );

    expect(source).toContain("getDefaultAftersalesDateKey");
    expect(source).toContain("aftersalesDate");
    expect(source).toContain("setAftersalesDate");
    expect(source).toContain('type="date"');
    expect(source).toContain("/api/mobile/aftersales/daily-records?date=");
    expect(source).toContain("[aftersalesDate]");
  });

  it("售后每日工作记录列表不应截断当日内容", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-dashboard.tsx"),
      "utf8"
    );

    expect(source).toContain("getRecentAftersalesRecords(daily)");
    expect(source).not.toContain("getRecentAftersalesRecords(daily, 6)");
  });
});
