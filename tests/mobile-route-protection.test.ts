import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("mobile route protection", () => {
  it("defines page-level proxy protection while Sealos owns mobile APIs", () => {
    const source = readProjectFile("proxy.ts");
    const authSource = readProjectFile("lib", "mobile-auth.ts");

    expect(source).toContain("MOBILE_SESSION_COOKIE");
    expect(authSource).toContain("mobile_dashboard_session");
    expect(source).toContain("/mobile/:path*");
    expect(source).toContain("/stats");
    expect(source).toContain('matcher: ["/mobile/:path*", "/stats"]');
    expect(source).not.toContain("/api/stats/monthly");
    expect(source).not.toContain("/api/mobile/stats/monthly");
    expect(source).toContain("/mobile/login");
  });

  it("keeps login public while redirecting authenticated users away from the login page", () => {
    const source = readProjectFile("proxy.ts");

    expect(source).toContain('pathname === "/mobile/login"');
    expect(source).toContain("NextResponse.redirect");
    expect(source).toContain("/mobile");
  });

  it("validates mobile login using the Sealos backend implementation", () => {
    const source = readProjectFile(
      "server",
      "boss-shuju",
      "src",
      "routes",
      "mobile-login.ts"
    );

    expect(source).toContain("createMobileSessionToken");
    expect(source).toContain("MOBILE_SESSION_COOKIE");
    expect(source).not.toContain("13972539707");
  });

  it("protects the Sealos mobile stats API before connecting to MongoDB", () => {
    const source = readProjectFile(
      "server",
      "boss-shuju",
      "src",
      "routes",
      "mobile-stats.ts"
    );

    expect(source).toContain("mobileAuthMiddleware");
    expect(source.indexOf("mobileAuthMiddleware, async")).toBeLessThan(
      source.indexOf("await connectMongo")
    );
    expect(source).toContain("/api/mobile/stats/monthly");
  });
});
