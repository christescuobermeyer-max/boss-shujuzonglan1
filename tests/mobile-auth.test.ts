import { afterEach, describe, expect, it } from "vitest";
import {
  MOBILE_SESSION_COOKIE,
  createMobileSessionToken,
  getMobilePasswordConfig,
  verifyMobilePassword,
  verifyMobileSessionToken
} from "@/lib/mobile-auth";

describe("mobile auth helpers", () => {
  const originalPassword = process.env.MOBILE_DASHBOARD_PASSWORD;
  const originalSecret = process.env.MOBILE_SESSION_SECRET;

  afterEach(() => {
    if (originalPassword === undefined) {
      delete process.env.MOBILE_DASHBOARD_PASSWORD;
    } else {
      process.env.MOBILE_DASHBOARD_PASSWORD = originalPassword;
    }

    if (originalSecret === undefined) {
      delete process.env.MOBILE_SESSION_SECRET;
    } else {
      process.env.MOBILE_SESSION_SECRET = originalSecret;
    }
  });

  it("reads the mobile password only from MOBILE_DASHBOARD_PASSWORD", () => {
    process.env.MOBILE_DASHBOARD_PASSWORD = "shared-secret";

    expect(getMobilePasswordConfig()).toBe("shared-secret");
    expect(verifyMobilePassword("shared-secret")).toBe(true);
    expect(verifyMobilePassword("wrong")).toBe(false);
  });

  it("does not accept missing password configuration", () => {
    delete process.env.MOBILE_DASHBOARD_PASSWORD;

    expect(getMobilePasswordConfig()).toBeNull();
    expect(verifyMobilePassword("anything")).toBe(false);
  });

  it("creates and verifies signed finite-life session tokens", () => {
    process.env.MOBILE_SESSION_SECRET = "test-session-secret";

    const token = createMobileSessionToken(1_000);

    expect(MOBILE_SESSION_COOKIE).toBe("mobile_dashboard_session");
    expect(verifyMobileSessionToken(token, 1_000)).toBe(true);
    expect(verifyMobileSessionToken(token, 1_000 + 12 * 60 * 60 * 1000 + 1)).toBe(false);
  });

  it("rejects tampered and unsigned tokens", () => {
    process.env.MOBILE_SESSION_SECRET = "test-session-secret";

    const token = createMobileSessionToken(1_000);

    expect(verifyMobileSessionToken(`${token}x`, 1_000)).toBe(false);
    expect(verifyMobileSessionToken("unsigned-token", 1_000)).toBe(false);
    expect(verifyMobileSessionToken(undefined, 1_000)).toBe(false);
  });
});
