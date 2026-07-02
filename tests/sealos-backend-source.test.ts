import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sealos backend scaffold", () => {
  it("defines a Hono backend package on port 8789", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "server", "boss-shuju", "package.json"), "utf8")
    );
    const indexSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "index.ts"),
      "utf8"
    );

    expect(pkg.dependencies.hono).toBeTruthy();
    expect(pkg.scripts.build).toContain("tsc");
    expect(indexSource).toContain("new Hono");
    expect(indexSource).toContain("/healthz");
    expect(indexSource).toContain("PORT");
  });
});
