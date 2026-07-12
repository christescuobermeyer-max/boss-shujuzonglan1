import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("tauri bundle config", () => {
  it("应启用 Windows 安装包构建，并默认输出 NSIS 安装器", () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), "src-tauri", "tauri.conf.json"), "utf8")
    ) as {
      bundle?: {
        active?: boolean;
        targets?: string;
        windows?: {
          nsis?: {
            installerHooks?: string;
          };
        };
      };
    };

    expect(config.bundle?.active ?? false).toBe(true);
    expect(config.bundle?.targets).toBe("nsis");
    expect(config.bundle?.windows?.nsis?.installerHooks).toBe("./installer-hooks.nsh");
  });

  it("NSIS 安装钩子应在安装前清理旧版残留进程，避免 node.exe 被占用", () => {
    const hooksPath = join(process.cwd(), "src-tauri", "installer-hooks.nsh");

    expect(existsSync(hooksPath)).toBe(true);

    const hooksSource = readFileSync(hooksPath, "utf8");

    expect(hooksSource).toContain("NSIS_HOOK_PREINSTALL");
    expect(hooksSource).toContain("NSIS_HOOK_PREUNINSTALL");
    expect(hooksSource).toContain("boss_shujuzonglan1_tauri.exe");
    expect(hooksSource).toContain("resources\\node-runtime\\node.exe");
    expect(hooksSource).toContain("server.js");
    expect(hooksSource).toContain("taskkill");
  });
});
