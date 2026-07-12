import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("login page sizing", () => {
  it("登录页卡片宽度应随桌面窗口同步放宽", () => {
    const css = readFileSync(
      join(
        process.cwd(),
        "components",
        "login",
        "desktop-login-page.module.css"
      ),
      "utf8"
    );

    expect(css).toContain("width: min(100%, 468px);");
    expect(css).toContain("padding: 44px 38px 38px;");
  });
});
