import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile frontend Sealos API base", () => {
  it("uses the public Sealos backend API base with credentialed requests", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-dashboard.tsx"),
      "utf8"
    );
    const loginSource = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-login.tsx"),
      "utf8"
    );
    const helperSource = readFileSync(
      join(process.cwd(), "lib", "mobile-api-client.ts"),
      "utf8"
    );

    expect(dashboardSource).toContain("buildBossApiUrl");
    expect(dashboardSource).toContain('credentials: "include"');
    expect(loginSource).toContain("buildBossApiUrl");
    expect(loginSource).toContain('credentials: "include"');
    expect(helperSource).toContain("NEXT_PUBLIC_BOSS_API_BASE");
  });
});
