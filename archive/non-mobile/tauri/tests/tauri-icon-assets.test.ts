import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("tauri icon assets", () => {
  it("桌面工程应提供 Windows 构建所需的 icon.ico", () => {
    const iconPath = join(
      process.cwd(),
      "src-tauri",
      "icons",
      "icon.ico"
    );

    expect(existsSync(iconPath)).toBe(true);
  });
});
