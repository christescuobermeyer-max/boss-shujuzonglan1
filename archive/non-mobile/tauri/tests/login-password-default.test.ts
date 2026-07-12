import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop login password default", () => {
  it("Rust 侧默认登录密码应更新为手机号", () => {
    const source = readFileSync(
      join(process.cwd(), "src-tauri", "src", "main.rs"),
      "utf8"
    );

    expect(source).toContain('unwrap_or_else(|_| "13972539707".to_string())');
  });
});
