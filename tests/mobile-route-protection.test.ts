import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("mobile route protection", () => {
  it("defines proxy protection for mobile, stats, and monthly stats APIs", () => {
    const source = readProjectFile("proxy.ts");
    const authSource = readProjectFile("lib", "mobile-auth.ts");

    expect(source).toContain("MOBILE_SESSION_COOKIE");
    expect(authSource).toContain("mobile_dashboard_session");
    expect(source).toContain("/mobile/:path*");
    expect(source).toContain("/stats");
    expect(source).toContain("/api/stats/monthly");
    expect(source).toContain("/api/mobile/stats/monthly");
    expect(source).toContain("/mobile/login");
  });

  it("keeps login public while redirecting authenticated users away from the login page", () => {
    const source = readProjectFile("proxy.ts");

    expect(source).toContain('pathname === "/mobile/login"');
    expect(source).toContain("NextResponse.redirect");
    expect(source).toContain("/mobile");
  });

  it("validates mobile login using server-only password configuration", () => {
    const source = readProjectFile("app", "api", "mobile", "login", "route.ts");

    expect(source).toContain("verifyMobilePassword");
    expect(source).toContain("createMobileSessionToken");
    expect(source).toContain("MOBILE_SESSION_COOKIE");
    expect(source).not.toContain("13972539707");
  });

  it("protects the existing monthly stats API before connecting to MongoDB", () => {
    const source = readProjectFile("app", "api", "stats", "monthly", "route.ts");

    expect(source).toContain("isMobileRequestAuthenticated");
    expect(source.indexOf("isMobileRequestAuthenticated")).toBeLessThan(
      source.indexOf("connectMongo")
    );
    expect(source).toContain("status: 401");
  });

  it("protects the mobile lightweight stats API before connecting to MongoDB", () => {
    const source = readProjectFile("app", "api", "mobile", "stats", "monthly", "route.ts");

    expect(source).toContain("isMobileRequestAuthenticated");
    expect(source.indexOf("isMobileRequestAuthenticated")).toBeLessThan(
      source.indexOf("connectMongo")
    );
    expect(source).toContain("status: 401");
  });
});
