import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop server cleanup", () => {
  it("Tauri 退出请求和最终退出时都应停止本地 Node 服务", () => {
    const mainSource = readFileSync(
      join(process.cwd(), "src-tauri", "src", "main.rs"),
      "utf8"
    );
    const serverSource = readFileSync(
      join(process.cwd(), "src-tauri", "src", "desktop_server.rs"),
      "utf8"
    );

    expect(mainSource).toContain("RunEvent::ExitRequested");
    expect(mainSource).toContain("RunEvent::Exit");
    expect(mainSource).toContain("RunEvent::ExitRequested { .. } | RunEvent::Exit");
    expect(mainSource).toContain("stop_desktop_server(app_handle)");
    expect(serverSource).toContain("child_process.kill()");
    expect(serverSource).toContain("child_process.wait()");
  });
});
