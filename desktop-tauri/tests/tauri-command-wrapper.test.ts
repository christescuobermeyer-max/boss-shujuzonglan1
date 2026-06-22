import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("tauri command wrapper", () => {
  it("桌面项目应通过脚本先加载 Visual Studio C++ 环境再执行 tauri", () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8")
    ) as {
      scripts?: Record<string, string>;
    };
    const wrapperCmdPath = join(process.cwd(), "scripts", "tauri-with-vs.cmd");
    const wrapperPsPath = join(process.cwd(), "scripts", "tauri-with-vs.ps1");

    expect(packageJson.scripts?.["tauri:dev"]).toBe(".\\scripts\\tauri-with-vs.cmd dev");
    expect(packageJson.scripts?.["tauri:build"]).toBe(".\\scripts\\tauri-with-vs.cmd build");
    expect(readFileSync(wrapperCmdPath, "utf8")).toContain("powershell");
    expect(readFileSync(wrapperCmdPath, "utf8")).toContain("tauri-with-vs.ps1");
    expect(readFileSync(wrapperPsPath, "utf8")).toContain("vswhere.exe");
    expect(readFileSync(wrapperPsPath, "utf8")).toContain("vcvars64.bat");
    expect(readFileSync(wrapperPsPath, "utf8")).toContain("npx tauri");
  });
});
