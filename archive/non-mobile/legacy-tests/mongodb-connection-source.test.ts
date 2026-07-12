import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mongodb connection source", () => {
  it("uses a serverless-friendly pool configuration", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "mongodb.ts"),
      "utf8"
    );

    expect(source).toContain("maxPoolSize: 5");
    expect(source).toContain("minPoolSize: 0");
    expect(source).toContain("serverSelectionTimeoutMS: 10_000");
  });
});
