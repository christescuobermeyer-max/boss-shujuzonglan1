import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("platform amount style", () => {
  it("平台回款拆分金额字号应控制在更紧凑的范围内", () => {
    const css = readFileSync(
      join(process.cwd(), "app", "globals.css"),
      "utf8"
    );

    expect(css).toContain("font-size: clamp(13px, 0.98vw, 16px);");
  });
});
