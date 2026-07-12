import { afterEach, describe, expect, it } from "vitest";
import {
  getOpenApiBases,
  getOpenApiInsecureTlsBases,
  getOpenApiToken,
  serializeFetchError,
  shouldAllowInsecureTlsForUrl
} from "@/lib/mobile-open-api-proxy";

describe("mobile open api proxy helpers", () => {
  const originalBases = process.env.CHENGSHANG_OPEN_API_BASES;
  const originalBase = process.env.CHENGSHANG_OPEN_API_BASE;
  const originalInsecureBases =
    process.env.CHENGSHANG_OPEN_API_INSECURE_TLS_BASES;
  const originalToken = process.env.CHENGSHANG_OPEN_API_TOKEN;
  const originalFallbackToken = process.env.OPEN_API_TOKEN;

  afterEach(() => {
    process.env.CHENGSHANG_OPEN_API_BASES = originalBases;
    process.env.CHENGSHANG_OPEN_API_BASE = originalBase;
    process.env.CHENGSHANG_OPEN_API_INSECURE_TLS_BASES = originalInsecureBases;
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

  it("把显式允许自签的备用入口并入开放 API base 地址", () => {
    process.env.CHENGSHANG_OPEN_API_BASE = "https://8-136-183-128.sslip.io/";
    process.env.CHENGSHANG_OPEN_API_BASES = "";
    process.env.CHENGSHANG_OPEN_API_INSECURE_TLS_BASES =
      "https://8.136.183.128:8943/";

    expect(getOpenApiBases()).toEqual([
      "https://8-136-183-128.sslip.io",
      "https://8.136.183.128:8943"
    ]);
  });

  it("优先读取接入方 token 并兼容服务端 OPEN_API_TOKEN", () => {
    process.env.CHENGSHANG_OPEN_API_TOKEN = "";
    process.env.OPEN_API_TOKEN = "fallback-token";

    expect(getOpenApiToken()).toBe("fallback-token");

    process.env.CHENGSHANG_OPEN_API_TOKEN = "primary-token";
    expect(getOpenApiToken()).toBe("primary-token");
  });

  it("只对显式配置的自签备用入口跳过 TLS 校验", () => {
    process.env.CHENGSHANG_OPEN_API_INSECURE_TLS_BASES =
      "https://8.136.183.128:8943/";

    expect(getOpenApiInsecureTlsBases()).toEqual([
      "https://8.136.183.128:8943"
    ]);
    expect(
      shouldAllowInsecureTlsForUrl(
        "https://8.136.183.128:8943/api/open/workflow/daily-monitor"
      )
    ).toBe(true);
    expect(
      shouldAllowInsecureTlsForUrl(
        "https://8-136-183-128.sslip.io/api/open/workflow/daily-monitor"
      )
    ).toBe(false);
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
