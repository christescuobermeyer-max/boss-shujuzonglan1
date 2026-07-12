import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop login flow scaffold", () => {
  it("应用入口应先进入登录页，统计页应受登录态保护", () => {
    const appPage = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
    const statsPage = readFileSync(join(process.cwd(), "app", "stats", "page.tsx"), "utf8");
    const loginPagePath = join(process.cwd(), "app", "login", "page.tsx");

    expect(appPage).toContain('redirect("/login")');
    expect(existsSync(loginPagePath)).toBe(true);
    expect(readFileSync(loginPagePath, "utf8")).toContain("DesktopLoginPage");
    expect(statsPage).toContain("DesktopAuthGuard");
  });

  it("Rust 侧应提供密码校验命令供登录页调用", () => {
    const mainSource = readFileSync(
      join(process.cwd(), "src-tauri", "src", "main.rs"),
      "utf8"
    );

    expect(mainSource).toContain("verify_login_password");
    expect(mainSource).toContain("tauri::command");
    expect(mainSource).toContain("generate_handler![verify_login_password]");
  });
});
