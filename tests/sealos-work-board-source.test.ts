import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sealos work board APIs", () => {
  it("ports workflow and aftersales proxies to the Sealos backend", () => {
    const clientSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "services", "open-api-client.ts"),
      "utf8"
    );
    const workflowSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "routes", "mobile-workflow.ts"),
      "utf8"
    );
    const aftersalesSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "routes", "mobile-aftersales.ts"),
      "utf8"
    );

    expect(clientSource).toContain("CHENGSHANG_OPEN_API_TOKEN");
    expect(clientSource).toContain("DEFAULT_RETRY_COUNT");
    expect(workflowSource).toContain("/api/open/workflow/daily-monitor");
    expect(aftersalesSource).toContain("/api/open/aftersales/daily-records");
    expect(aftersalesSource).toContain('query("date")');
  });
});
