import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile open API proxy routes", () => {
  it("代理今日待处理监控接口并保留 token 在服务端", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "api", "mobile", "workflow", "daily-monitor", "route.ts"),
      "utf8"
    );

    expect(source).toContain("isMobileRequestAuthenticated");
    expect(source).toContain("CHENGSHANG_OPEN_API_BASE");
    expect(source).toContain("CHENGSHANG_OPEN_API_TOKEN");
    expect(source).toContain("OPEN_API_TOKEN");
    expect(source).toContain("/api/open/workflow/daily-monitor");
    expect(source).toContain("Authorization");
    expect(source).toContain('cache: "no-store"');
  });

  it("代理售后每日记录接口并透传 date 参数", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "api", "mobile", "aftersales", "daily-records", "route.ts"),
      "utf8"
    );

    expect(source).toContain("isMobileRequestAuthenticated");
    expect(source).toContain("/api/open/aftersales/daily-records");
    expect(source).toContain("OPEN_API_TOKEN");
    expect(source).toContain('searchParams.get("date")');
    expect(source).toContain("URLSearchParams");
    expect(source).toContain("Authorization");
    expect(source).toContain('cache: "no-store"');
  });
});
