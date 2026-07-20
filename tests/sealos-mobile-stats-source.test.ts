import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sealos monthly stats API", () => {
  it("ports mobile monthly stats to the Sealos backend", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "routes", "mobile-stats.ts"),
      "utf8"
    );
    const serviceSource = readFileSync(
      join(
        process.cwd(),
        "server",
        "boss-shuju",
        "src",
        "services",
        "mobile-monthly-stats-service.ts"
      ),
      "utf8"
    );

    expect(routeSource).toContain("/api/mobile/stats/monthly");
    expect(routeSource).toContain("mobileAuthMiddleware");
    expect(routeSource).toContain("connectMongo");
    expect(serviceSource).toContain("monthlyPointAmount");
    expect(serviceSource).toContain("meituanMonthlyPointAmount");
    expect(serviceSource).toContain("elemeMonthlyPointAmount");
    expect(serviceSource).toContain("onlineShopCounts");
    expect(serviceSource).toContain("getMonthlyOnlineShopTrend");
    expect(serviceSource).toContain("onlineShopDailyTrend");
    expect(serviceSource).toContain("未分配");
  });

  it("includes daily order trend in the mobile monthly stats payload", () => {
    const serviceSource = readFileSync(
      join(
        process.cwd(),
        "server",
        "boss-shuju",
        "src",
        "services",
        "mobile-monthly-stats-service.ts"
      ),
      "utf8"
    );

    expect(serviceSource).toContain("buildMonthlySignedShopTrend");
    expect(serviceSource).toContain("const dailyOrderShopTrend = buildMonthlySignedShopTrend({");
    expect(serviceSource).toContain("dailyOrderShopTrend,");
    expect(serviceSource).not.toContain("dailyOrderShopTrend: []");
  });
});
