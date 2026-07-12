import { afterEach, describe, expect, it } from "vitest";
import {
  MOBILE_SESSION_COOKIE,
  createMobileSessionToken,
  verifyMobileSessionToken
} from "../server/boss-shuju/src/auth/session";

describe("mobile auth helpers", () => {
  afterEach(() => {
    delete process.env.MOBILE_DASHBOARD_PASSWORD;
  });

  it("creates and verifies signed finite-life session tokens", () => {
    const secret = "test-session-secret";
    const token = createMobileSessionToken(secret, 1_000);

    expect(MOBILE_SESSION_COOKIE).toBe("mobile_dashboard_session");
    expect(verifyMobileSessionToken(token, secret, 1_000)).toBe(true);
    expect(verifyMobileSessionToken(token, secret, 1_000 + 12 * 60 * 60 * 1000 + 1)).toBe(false);
  });

  it("rejects tampered and unsigned tokens", () => {
    const secret = "test-session-secret";
    const token = createMobileSessionToken(secret, 1_000);

    expect(verifyMobileSessionToken(`${token}x`, secret, 1_000)).toBe(false);
    expect(verifyMobileSessionToken("unsigned-token", secret, 1_000)).toBe(false);
    expect(verifyMobileSessionToken(undefined, secret, 1_000)).toBe(false);
  });
});
