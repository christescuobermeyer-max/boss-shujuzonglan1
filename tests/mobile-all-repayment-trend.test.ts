import { readFileSync } from "node:fs";
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
});
