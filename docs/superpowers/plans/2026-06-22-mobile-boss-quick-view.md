# Mobile Boss Quick View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-protected, mobile-first `/mobile` boss quick view page while keeping the existing desktop-style `/stats` dashboard visually unchanged.

**Architecture:** Add root Web auth/session helpers, `proxy.ts` route protection, and route-handler checks around `/stats`, `/mobile`, and `/api/stats/monthly`. Add mobile-specific data derivation helpers and React components that consume the existing `StatsMonthlyPayload`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict mode, MongoDB/Mongoose, ECharts, Vitest.

## Global Constraints

- Do not redesign the existing `/stats` desktop dashboard.
- Do not modify `desktop-tauri/` for this feature.
- Do not change MongoDB schemas or monthly statistics formulas.
- Do not write the password, MongoDB connection string, or any real secret into source, docs, tests, or fixtures.
- Public Vercel deployment must not expose the existing `/stats` page or `/api/stats/monthly` endpoint without a valid mobile session.
- Use `MOBILE_DASHBOARD_PASSWORD` for password verification and `MOBILE_SESSION_SECRET` for session signing.
- Use signed, HTTP-only, finite-life cookies named `mobile_dashboard_session`.
- Daily repayment list uses existing daily summary rows, sorted descending; "本月全部" means all active daily summary rows, not synthetic zero rows.
- Run root `npm run test:unit`, root `npm run build`, and mobile viewport verification before completion.

---

## File Structure

- Create `lib/mobile-auth.ts`: pure helpers for password configuration, signed session cookie creation, validation, and cookie constants.
- Create `proxy.ts`: Next.js request protection for `/mobile`, `/stats`, and `/api/stats/monthly`.
- Modify `app/api/stats/monthly/route.ts`: reject unauthenticated Web requests.
- Create `app/api/mobile/login/route.ts`: verify password and set session cookie.
- Create `app/mobile/login/page.tsx`: mobile login page.
- Create `app/mobile/page.tsx`: mobile dashboard page shell.
- Create `components/mobile/mobile-boss-dashboard.tsx`: client dashboard container.
- Create `components/mobile/mobile-boss-login.tsx`: client login form.
- Create `components/mobile/mobile-boss-charts.tsx`: phone-sized chart wrappers.
- Create `lib/mobile-dashboard.ts`: pure mobile KPI, daily repayment, ranking, and brief derivation helpers.
- Modify `app/globals.css`: append mobile-only classes prefixed with `mobile-`.
- Add tests under `tests/` for auth, proxy/source constraints, API auth, mobile derivation, and mobile layout/source expectations.

## Task 1: Auth And Route Protection

**Files:**
- Create: `lib/mobile-auth.ts`
- Create: `proxy.ts`
- Create: `app/api/mobile/login/route.ts`
- Modify: `app/api/stats/monthly/route.ts`
- Test: `tests/mobile-auth.test.ts`
- Test: `tests/mobile-route-protection.test.ts`

**Interfaces:**
- Produces: `MOBILE_SESSION_COOKIE = "mobile_dashboard_session"`
- Produces: `createMobileSessionToken(nowMs?: number): string`
- Produces: `verifyMobileSessionToken(token: string | undefined, nowMs?: number): boolean`
- Produces: `getMobilePasswordConfig(): string | null`
- Produces: `verifyMobilePassword(password: string): boolean`
- Produces: `isMobileRequestAuthenticated(request: Request | NextRequest): boolean`

- [ ] **Step 1: Write failing auth helper tests**

```ts
import { describe, expect, it, afterEach } from "vitest";
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
    process.env.MOBILE_DASHBOARD_PASSWORD = originalPassword;
    process.env.MOBILE_SESSION_SECRET = originalSecret;
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
```

- [ ] **Step 2: Run auth tests and verify RED**

Run: `npx vitest run tests/mobile-auth.test.ts`

Expected: fail because `@/lib/mobile-auth` does not exist.

- [ ] **Step 3: Implement minimal auth helpers**

Create `lib/mobile-auth.ts` with HMAC signing using Node `crypto`, a 12-hour session max age, cookie parsing for `Request` and `NextRequest`, and fail-closed behavior when env vars are missing.

- [ ] **Step 4: Run auth tests and verify GREEN**

Run: `npx vitest run tests/mobile-auth.test.ts`

Expected: pass.

- [ ] **Step 5: Write failing route protection tests**

Add source/behavior tests that assert:
- `proxy.ts` exists.
- matcher includes `/mobile/:path*`, `/stats`, and `/api/stats/monthly`.
- `app/api/mobile/login/route.ts` reads `MOBILE_DASHBOARD_PASSWORD`.
- `app/api/stats/monthly/route.ts` calls `isMobileRequestAuthenticated` and can return status `401`.

- [ ] **Step 6: Run route protection tests and verify RED**

Run: `npx vitest run tests/mobile-route-protection.test.ts`

Expected: fail because files and protections do not exist yet.

- [ ] **Step 7: Implement proxy and route handlers**

Create `proxy.ts`, create `app/api/mobile/login/route.ts`, and update `app/api/stats/monthly/route.ts` to fail closed for unauthenticated requests before connecting to MongoDB.

- [ ] **Step 8: Run route protection tests and verify GREEN**

Run: `npx vitest run tests/mobile-auth.test.ts tests/mobile-route-protection.test.ts`

Expected: pass.

## Task 2: Mobile Data Derivation

**Files:**
- Create: `lib/mobile-dashboard.ts`
- Test: `tests/mobile-dashboard-data.test.ts`

**Interfaces:**
- Consumes: `StatsMonthlyPayload`
- Produces: `buildMobileDashboardData(stats: StatsMonthlyPayload): MobileDashboardData`
- Produces: `formatMobileAmount(value: number): string`
- Produces: `getVisibleDailyRepaymentRows(rows, expanded): MobileDailyRepaymentRow[]`

- [ ] **Step 1: Write failing data derivation tests**

Test KPI values, daily repayment descending order, latest 7 collapsed behavior, expanded full active rows, ranking top 5, and empty payload behavior using `buildEmptyMonthlyStats`.

- [ ] **Step 2: Run data tests and verify RED**

Run: `npx vitest run tests/mobile-dashboard-data.test.ts`

Expected: fail because `@/lib/mobile-dashboard` does not exist.

- [ ] **Step 3: Implement data helpers**

Use existing helpers: `buildDailySummaryRows`, `buildDailyTotalAmountTrend`, `buildOperatorAmountRanking`, `buildOperatorTerminationRanking`. Do not duplicate monthly stats formulas.

- [ ] **Step 4: Run data tests and verify GREEN**

Run: `npx vitest run tests/mobile-dashboard-data.test.ts`

Expected: pass.

## Task 3: Mobile UI And Layout

**Files:**
- Create: `app/mobile/page.tsx`
- Create: `app/mobile/login/page.tsx`
- Create: `components/mobile/mobile-boss-dashboard.tsx`
- Create: `components/mobile/mobile-boss-login.tsx`
- Create: `components/mobile/mobile-boss-charts.tsx`
- Modify: `app/globals.css`
- Test: `tests/mobile-layout-source.test.ts`

**Interfaces:**
- Consumes: `buildMobileDashboardData(stats)`
- Consumes: authenticated `/api/stats/monthly?month=YYYY-MM`
- Produces: mobile UI copy `呈尚策划 · BOSS快看`, `每日回款列表`, `展开本月全部`

- [ ] **Step 1: Write failing mobile layout source tests**

Assert the route files and component files exist, login page contains password flow copy, dashboard source contains the agreed sections, and CSS contains mobile viewport rules with no desktop `/stats` class rewrites.

- [ ] **Step 2: Run mobile layout tests and verify RED**

Run: `npx vitest run tests/mobile-layout-source.test.ts`

Expected: fail because mobile files do not exist.

- [ ] **Step 3: Implement login page and dashboard page**

Build a mobile login form that posts to `/api/mobile/login` and redirects to `/mobile` on success. Build the dashboard client component that fetches authenticated monthly stats, shows skeletons/errors, month picker, KPI cards, trend charts, daily repayment list, rankings, and daily brief.

- [ ] **Step 4: Append mobile CSS**

Append classes prefixed with `mobile-` to `app/globals.css`. Keep `/stats` desktop classes intact.

- [ ] **Step 5: Run mobile layout tests and verify GREEN**

Run: `npx vitest run tests/mobile-layout-source.test.ts`

Expected: pass.

## Task 4: Full Verification And Completion Loop

**Files:**
- Modify: `docs/memory/YYYY-MM-DD-HHmm-mobile-boss-quick-view.md`

**Interfaces:**
- Consumes: all prior tasks
- Produces: final verification evidence and handoff notes

- [ ] **Step 1: Run targeted tests**

Run: `npx vitest run tests/mobile-auth.test.ts tests/mobile-route-protection.test.ts tests/mobile-dashboard-data.test.ts tests/mobile-layout-source.test.ts`

Expected: pass.

- [ ] **Step 2: Run full unit suite**

Run: `npm run test:unit`

Expected: pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: pass. If build needs env vars, use non-secret local dummy values for `MOBILE_DASHBOARD_PASSWORD` and `MOBILE_SESSION_SECRET`.

- [ ] **Step 4: Run mobile viewport evidence**

Start dev server with non-secret dummy env vars, open `/mobile/login` and `/mobile` at 390px and 430px viewport, and verify no horizontal page scrolling or overlapping text. Use screenshots or equivalent automated viewport checks available in the environment.

- [ ] **Step 5: Write memory**

Create a new `docs/memory/YYYY-MM-DD-HHmm-mobile-boss-quick-view.md` recording the work, verification evidence, remaining risks, and Vercel env vars.

- [ ] **Step 6: Final review**

Check `git status --short`, summarize changed files, verification commands, and any unverified items.
