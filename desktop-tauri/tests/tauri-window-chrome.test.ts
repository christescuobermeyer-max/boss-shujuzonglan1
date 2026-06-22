import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("tauri window chrome", () => {
  it("桌面窗口应保留原生标题栏按钮，而不是系统全屏模式", () => {
    const config = JSON.parse(
      readFileSync(join(process.cwd(), "src-tauri", "tauri.conf.json"), "utf8")
    ) as {
      app?: {
        windows?: Array<{
          fullscreen?: boolean;
          maximized?: boolean;
          decorations?: boolean;
        }>;
      };
    };

    const firstWindow = config.app?.windows?.[0];

    expect(firstWindow?.fullscreen ?? false).toBe(false);
    expect(firstWindow?.maximized ?? false).toBe(true);
    expect(firstWindow?.decorations ?? true).toBe(true);
    expect(firstWindow?.resizable ?? false).toBe(true);
  });
});
