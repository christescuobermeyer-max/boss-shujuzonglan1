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
    expect(source).toContain('buildBossApiUrl("/api/mobile/workflow/daily-monitor")');
    expect(source).toContain("/api/mobile/aftersales/daily-records?date=");
    expect(source).toContain('credentials: "include"');
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

    expect(source).toContain("filterAftersalesRecords(daily, selectedPerson)");
    expect(source).not.toContain("filterAftersalesRecords(daily, selectedPerson,");
  });

  it("售后每日工作提供固定人员筛选且保留运营工作板块", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-dashboard.tsx"),
      "utf8"
    );
    const styles = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8"
    );

    expect(source).toContain("AFTERSALES_PERSON_FILTERS");
    expect(source).toContain("filterAftersalesRecords");
    expect(source).toContain('useState<AftersalesPersonFilter>("all")');
    expect(source).toContain("aria-pressed={selectedPerson === filter.value}");
    expect(source).toContain("该人员当日暂无售后记录");
    expect(source).toContain("所选日期暂无售后记录");
    expect(source).toContain("MobileWorkflowProgressSection");
    expect(source).toContain("buildWorkflowProgressRows");
    expect(styles).toContain(".mobile-aftersales-person-filter");
    expect(styles).toContain(".mobile-aftersales-person-button");
  });
});
