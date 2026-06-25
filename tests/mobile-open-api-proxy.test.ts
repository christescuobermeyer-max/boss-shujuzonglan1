import { afterEach, describe, expect, it } from "vitest";
import {
  getOpenApiBases,
  getOpenApiToken,
  serializeFetchError
} from "@/lib/mobile-open-api-proxy";

describe("mobile open api proxy helpers", () => {
  const originalBases = process.env.CHENGSHANG_OPEN_API_BASES;
  const originalBase = process.env.CHENGSHANG_OPEN_API_BASE;
  const originalToken = process.env.CHENGSHANG_OPEN_API_TOKEN;
  const originalFallbackToken = process.env.OPEN_API_TOKEN;

  afterEach(() => {
    process.env.CHENGSHANG_OPEN_API_BASES = originalBases;
    process.env.CHENGSHANG_OPEN_API_BASE = originalBase;
    process.env.CHENGSHANG_OPEN_API_TOKEN = originalToken;
    process.env.OPEN_API_TOKEN = originalFallbackToken;
  });

  it("支持多个开放 API base 地址作为故障切换", () => {
    process.env.CHENGSHANG_OPEN_API_BASES = "https://a.example.com/, https://b.example.com";

    expect(getOpenApiBases()).toEqual([
      "https://a.example.com",
      "https://b.example.com"
    ]);
  });

  it("优先读取接入方 token 并兼容服务端 OPEN_API_TOKEN", () => {
    process.env.CHENGSHANG_OPEN_API_TOKEN = "";
    process.env.OPEN_API_TOKEN = "fallback-token";

    expect(getOpenApiToken()).toBe("fallback-token");

    process.env.CHENGSHANG_OPEN_API_TOKEN = "primary-token";
    expect(getOpenApiToken()).toBe("primary-token");
  });

  it("序列化 fetch failed 的底层 cause", () => {
    const cause = Object.assign(new Error("read ECONNRESET"), {
      code: "ECONNRESET",
      errno: -104,
      syscall: "read"
    });
    const error = Object.assign(new TypeError("fetch failed"), { cause });

    expect(serializeFetchError(error)).toEqual({
      message: "fetch failed",
      name: "TypeError",
      cause: expect.objectContaining({
        message: "read ECONNRESET",
        code: "ECONNRESET",
        errno: -104,
        syscall: "read"
      })
    });
  });
});
