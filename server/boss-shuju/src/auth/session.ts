import { createHmac, timingSafeEqual } from "node:crypto";

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

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createMobileSessionToken(secret: string, nowMs = Date.now()) {
  if (!secret.trim()) {
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

export function verifyMobileSessionToken(
  token: string | undefined,
  secret: string,
  nowMs = Date.now()
) {
  if (!secret.trim() || !token) return false;

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

