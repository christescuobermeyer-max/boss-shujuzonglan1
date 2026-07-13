import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as mobileApiClientModule from "@/lib/mobile-api-client";

const readProjectFile = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts), "utf8");

describe("mobile all repayment trend", () => {
  it("builds the dedicated backend URL", () => {
    const buildAllRepaymentTrendUrl = (
      mobileApiClientModule as typeof mobileApiClientModule & {
        buildAllRepaymentTrendUrl?: () => string;
      }
    ).buildAllRepaymentTrendUrl;

    expect(buildAllRepaymentTrendUrl).toBeTypeOf("function");
    expect(buildAllRepaymentTrendUrl?.()).toMatch(
      /\/api\/mobile\/stats\/repayment-trend\/all$/
    );
  });

  it("defines the lightweight response contract", () => {
    const source = readProjectFile("lib", "mobile-contracts.ts");

    expect(source).toContain("export type AllRepaymentTrendResponse");
    expect(source).toContain("startDate: string | null");
    expect(source).toContain("endDate: string | null");
    expect(source).toContain("points: DailyAmountPoint[]");
  });

  it("defines a full-history chart with concise axes and zoom controls", () => {
    const source = readProjectFile(
      "components",
      "mobile",
      "mobile-boss-charts.tsx"
    );

    expect(source).toContain("MobileAllRepaymentTrendChart");
    expect(source).toContain("hideOverlap: true");
    expect(source).toContain("shouldShowHistoryDateLabel");
    expect(source).toContain('type: "inside"');
    expect(source).toContain('type: "slider"');
    expect(source).toContain("start: 0");
    expect(source).toContain("end: 100");
    expect(source).toContain('symbol: "none"');
    expect(source).toContain("animation: false");
  });

  it("provides a dedicated all repayment trend component", () => {
    expect(
      existsSync(
        join(
          process.cwd(),
          "components",
          "mobile",
          "mobile-all-repayment-trend.tsx"
        )
      )
    ).toBe(true);
  });

  it("loads the all-time trend independently with authenticated credentials", () => {
    const source = readProjectFile(
      "components",
      "mobile",
      "mobile-all-repayment-trend.tsx"
    );

    expect(source).toContain("buildAllRepaymentTrendUrl()");
    expect(source).toContain('credentials: "include"');
    expect(source).toContain('window.location.href = "/mobile/login"');
    expect(source).toContain("useEffect(() => {");
    expect(source).not.toContain("[month]");
  });

  it("provides accessible maximize and close controls", () => {
    const source = readProjectFile(
      "components",
      "mobile",
      "mobile-all-repayment-trend.tsx"
    );

    expect(source).toContain("Maximize2");
    expect(source).toContain("X");
    expect(source).toContain('aria-label="最大化全部日期回款趋势"');
    expect(source).toContain('aria-label="关闭全部日期回款趋势全屏"');
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('event.key !== "Escape"');
    expect(source).toContain('document.body.style.overflow = "hidden"');
    expect(source).toContain("previousOverflow");
  });

  it("shows explicit loading, empty, and failure states", () => {
    const source = readProjectFile(
      "components",
      "mobile",
      "mobile-all-repayment-trend.tsx"
    );

    expect(source).toContain("mobile-all-repayment-skeleton");
    expect(source).toContain("暂无全部日期回款数据");
    expect(source).toContain("全部日期回款趋势暂时无法加载");
  });

  it("places the all-time chart between monthly repayment and daily orders", () => {
    const source = readProjectFile(
      "components",
      "mobile",
      "mobile-boss-dashboard.tsx"
    );

    const monthlyTrendIndex = source.indexOf("每日回款趋势");
    const allTrendIndex = source.indexOf("<MobileAllRepaymentTrend />");
    const orderTrendIndex = source.indexOf("每日开单趋势");

    expect(monthlyTrendIndex).toBeGreaterThan(-1);
    expect(allTrendIndex).toBeGreaterThan(monthlyTrendIndex);
    expect(orderTrendIndex).toBeGreaterThan(allTrendIndex);
  });

  it("keeps the all-time chart mounted while monthly data reloads", () => {
    const source = readProjectFile(
      "components",
      "mobile",
      "mobile-boss-dashboard.tsx"
    );

    const firstMonthlyLoadingBlock = source.indexOf("{!loading ? (");
    const allTrendIndex = source.indexOf("<MobileAllRepaymentTrend />");
    const secondMonthlyLoadingBlock = source.indexOf("{!loading ? (", allTrendIndex);

    expect(firstMonthlyLoadingBlock).toBeGreaterThan(-1);
    expect(allTrendIndex).toBeGreaterThan(firstMonthlyLoadingBlock);
    expect(source.slice(firstMonthlyLoadingBlock, allTrendIndex)).toContain(
      ") : null}"
    );
    expect(secondMonthlyLoadingBlock).toBeGreaterThan(allTrendIndex);
  });

  it("defines a full-viewport overlay without horizontal overflow", () => {
    const source = readProjectFile("app", "globals.css");

    expect(source).toContain(".mobile-all-repayment-overlay");
    expect(source).toContain("position: fixed");
    expect(source).toContain("inset: 0");
    expect(source).toContain("100dvh");
    expect(source).toContain("overflow: hidden");
  });
});
