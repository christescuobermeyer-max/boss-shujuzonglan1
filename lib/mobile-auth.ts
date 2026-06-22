import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const MOBILE_SESSION_COOKIE = "mobile_dashboard_session";
export const MOBILE_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

type SessionPayload = {
  iat: number;
  exp: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret() {
  const secret = process.env.MOBILE_SESSION_SECRET?.trim();
  return secret ? secret : null;
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getCookieValue(request: Request | NextRequest, name: string) {
  const maybeNextRequest = request as NextRequest;
  const nextCookie = maybeNextRequest.cookies?.get?.(name)?.value;
  if (nextCookie) return nextCookie;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const matched = cookies.find((item) => item.startsWith(`${name}=`));
  return matched ? decodeURIComponent(matched.slice(name.length + 1)) : undefined;
}

export function getMobilePasswordConfig() {
  const password = process.env.MOBILE_DASHBOARD_PASSWORD?.trim();
  return password ? password : null;
}

export function verifyMobilePassword(password: string) {
  const expectedPassword = getMobilePasswordConfig();
  if (!expectedPassword) return false;
  return password.trim() === expectedPassword;
}

export function createMobileSessionToken(nowMs = Date.now()) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("missing_mobile_session_secret");
  }

  const payload: SessionPayload = {
    iat: nowMs,
    exp: nowMs + MOBILE_SESSION_MAX_AGE_SECONDS * 1000
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function verifyMobileSessionToken(token: string | undefined, nowMs = Date.now()) {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const [encodedPayload, signature, extra] = token.split(".");
  if (!encodedPayload || !signature || extra !== undefined) return false;

  const expectedSignature = signPayload(encodedPayload, secret);
  if (!signaturesMatch(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SessionPayload>;
    const exp = Number(payload.exp ?? 0);
    const iat = Number(payload.iat ?? 0);
    if (!Number.isFinite(exp) || !Number.isFinite(iat)) return false;
    if (iat > nowMs) return false;
    return exp >= nowMs;
  } catch {
    return false;
  }
}

export function isMobileRequestAuthenticated(request: Request | NextRequest) {
  return verifyMobileSessionToken(getCookieValue(request, MOBILE_SESSION_COOKIE));
}
