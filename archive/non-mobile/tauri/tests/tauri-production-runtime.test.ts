import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("tauri production runtime", () => {
  it("生产构建应准备完整本地运行时，而不是仅生成开发提示占位页", () => {
    const buildScript = readFileSync(
      join(process.cwd(), "scripts", "build-tauri-shell.mjs"),
      "utf8"
    );
    const loaderTemplate = readFileSync(
      join(process.cwd(), "scripts", "assets", "desktop-loader.html"),
      "utf8"
    );
    const tauriConfig = JSON.parse(
      readFileSync(join(process.cwd(), "src-tauri", "tauri.conf.json"), "utf8")
    ) as {
      bundle?: {
        resources?: string[];
      };
    };

    expect(buildScript).toContain("desktop-runtime");
    expect(buildScript).toContain("node-runtime");
    expect(loaderTemplate).toContain("window.location.replace");
    expect(loaderTemplate).not.toContain("完整看板开发模式请运行");
    expect(tauriConfig.bundle?.resources ?? []).toContain("./resources/**/*");
  });
});
