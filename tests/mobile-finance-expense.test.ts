import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseFinanceMonthlySummaryQuery,
  parseFinanceTransactionsQuery
} from "../server/boss-shuju/src/services/finance-expense-service";

function read(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("mobile finance expense source", () => {
  it("mounts protected finance read-only routes in the Sealos backend", () => {
    const indexSource = read("server", "boss-shuju", "src", "index.ts");
    const routeSource = read("server", "boss-shuju", "src", "routes", "mobile-finance.ts");
    const serviceSource = read("server", "boss-shuju", "src", "services", "finance-expense-service.ts");
    const envSource = read("server", "boss-shuju", "src", "config", "env.ts");

    expect(indexSource).toContain("mobileFinanceRoute");
    expect(routeSource).toContain("/api/mobile/finance/monthly-summary");
    expect(routeSource).toContain("/api/mobile/finance/transactions");
    expect(routeSource).toContain("mobileAuthMiddleware");
    expect(envSource).toContain("MONGODB_READONLY_URI");
    expect(envSource).toContain("MONGODB_DB_YICHANG");
    expect(envSource).toContain("MONGODB_DB_WUHAN");
    expect(envSource).toContain("caiwu");
    expect(envSource).toContain("wuhancaiwu");
    expect(serviceSource).toContain("paymentImage");
    expect(serviceSource).toContain("hasPaymentImage");
    expect(serviceSource).not.toContain("includeImages");
  });

  it("validates finance summary query city, person, and month range", () => {
    const parsed = parseFinanceMonthlySummaryQuery(
      "https://example.com/api/mobile/finance/monthly-summary?city=all&person=%E5%BE%90%E6%99%93%E8%BE%89&startMonth=2026-01&endMonth=2026-03"
    );

    expect(parsed.city).toBe("all");
    expect(parsed.people).toEqual(["徐晓辉"]);
    expect(parsed.range.months).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(() => parseFinanceMonthlySummaryQuery("https://example.com?city=bad")).toThrow("city参数无效");
    expect(() => parseFinanceMonthlySummaryQuery("https://example.com?city=all&person=其他人")).toThrow("person不在允许范围内");
    expect(() => parseFinanceMonthlySummaryQuery("https://example.com?city=all&startMonth=2026-04&endMonth=2026-03")).toThrow("startMonth不能晚于endMonth");
  });

  it("validates transaction pagination and rejects city=all for details", () => {
    const parsed = parseFinanceTransactionsQuery(
      "https://example.com/api/mobile/finance/transactions?city=wuhan&page=2&limit=50&sortBy=amount&sortOrder=asc"
    );

    expect(parsed.city).toBe("wuhan");
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(50);
    expect(parsed.sortBy).toBe("amount");
    expect(parsed.sortOrder).toBe("asc");
    expect(() => parseFinanceTransactionsQuery("https://example.com?city=all")).toThrow("明细查询city仅支持yichang或wuhan");
    expect(() => parseFinanceTransactionsQuery("https://example.com?city=wuhan&limit=101")).toThrow("limit参数无效");
    expect(() => parseFinanceTransactionsQuery("https://example.com?city=wuhan&sortBy=content")).toThrow("sortBy参数无效");
  });
});


