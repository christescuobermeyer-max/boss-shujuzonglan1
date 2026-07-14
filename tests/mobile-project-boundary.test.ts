import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const projectPath = (...parts: string[]) => join(root, ...parts);

describe("mobile-only project boundary", () => {
  it("keeps only mobile routes in the active Next app", () => {
    expect(existsSync(projectPath("app", "mobile", "page.tsx"))).toBe(true);
    expect(existsSync(projectPath("app", "mobile", "login", "page.tsx"))).toBe(true);
    expect(existsSync(projectPath("app", "stats"))).toBe(false);
    expect(existsSync(projectPath("app", "api"))).toBe(false);
  });

  it("archives non-mobile applications and legacy backend code", () => {
    expect(existsSync(projectPath("archive", "non-mobile", "tauri"))).toBe(true);
    expect(existsSync(projectPath("archive", "non-mobile", "desktop-dashboard"))).toBe(true);
    expect(existsSync(projectPath("archive", "non-mobile", "legacy-next-api"))).toBe(true);
  });

  it("keeps the browser bundle free of MongoDB backend modules", () => {
    expect(existsSync(projectPath("models"))).toBe(false);
    expect(existsSync(projectPath("lib", "mongodb.ts"))).toBe(false);
    expect(existsSync(projectPath("lib", "mobile-monthly-stats-service.ts"))).toBe(false);
    expect(existsSync(projectPath("lib", "mobile-open-api-proxy.ts"))).toBe(false);
  });

  it("uses mobile-owned contracts", () => {
    const dashboard = readFileSync(projectPath("lib", "mobile-dashboard.ts"), "utf8");
    const charts = readFileSync(projectPath("components", "mobile", "mobile-boss-charts.tsx"), "utf8");
    expect(dashboard).toContain("@/lib/mobile-contracts");
    expect(charts).toContain("@/lib/mobile-contracts");
    expect(dashboard).not.toContain("@/lib/stats/");
    expect(charts).not.toContain("@/components/charts/");
  });

  it("keeps active CSS mobile-only", () => {
    const css = readFileSync(projectPath("app", "globals.css"), "utf8");
    expect(css).toContain(".mobile-page");
    expect(css).toContain(".mobile-login-page");
    expect(css).not.toContain(".dashboard-shell");
    expect(css).not.toContain(".overview-grid");
  });

  it("separates frontend and backend environment templates", () => {
    const frontendEnv = readFileSync(projectPath(".env.example"), "utf8");
    const backendEnvPath = projectPath("server", "boss-shuju", ".env.example");
    expect(existsSync(backendEnvPath)).toBe(true);
    const backendEnv = readFileSync(backendEnvPath, "utf8");
    expect(frontendEnv).toContain("NEXT_PUBLIC_BOSS_API_BASE");
    expect(frontendEnv).not.toContain("MONGODB_URI");
    expect(frontendEnv).not.toContain("MOBILE_SESSION_SECRET");
    expect(backendEnv).toContain("MONGODB_URI");
    expect(backendEnv).toContain("MOBILE_SESSION_SECRET");
    expect(backendEnv).toContain("BOSS_WEB_ORIGIN");
  });

  it("keeps test-only backend imports out of the Next production typecheck", () => {
    const tsconfig = JSON.parse(
      readFileSync(projectPath("tsconfig.json"), "utf8")
    ) as { exclude?: string[] };

    expect(tsconfig.exclude).toContain("tests");
  });
});
