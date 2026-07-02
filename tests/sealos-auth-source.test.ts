import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sealos backend auth", () => {
  it("moves mobile login and signed session cookies into Hono backend", () => {
    const sessionSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "auth", "session.ts"),
      "utf8"
    );
    const loginSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "routes", "mobile-login.ts"),
      "utf8"
    );

    expect(sessionSource).toContain("mobile_dashboard_session");
    expect(sessionSource).toContain("createHmac");
    expect(sessionSource).toContain("timingSafeEqual");
    expect(loginSource).toContain("/api/mobile/login");
    expect(loginSource).toContain("HttpOnly");
    expect(loginSource).toContain("SameSite=Lax");
  });
});
