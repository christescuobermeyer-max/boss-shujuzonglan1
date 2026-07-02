import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("mobile route protection", () => {
  it("leaves mobile pages to Sealos API auth and only redirects legacy stats", () => {
    const source = readProjectFile("proxy.ts");

    expect(source).toContain("/stats");
    expect(source).toContain('matcher: ["/stats"]');
    expect(source).not.toContain("/mobile/:path*");
    expect(source).not.toContain("/api/stats/monthly");
    expect(source).not.toContain("/api/mobile/stats/monthly");
    expect(source).toContain("/mobile/login");
  });

  it("keeps login public while redirecting legacy protected pages there", () => {
    const source = readProjectFile("proxy.ts");

    expect(source).toContain('pathname === "/mobile/login"');
    expect(source).toContain("NextResponse.next");
    expect(source).toContain("NextResponse.redirect");
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
