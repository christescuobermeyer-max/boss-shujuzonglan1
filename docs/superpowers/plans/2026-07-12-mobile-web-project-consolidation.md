# Mobile Web Project Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the repository into a clearly scoped mobile Web frontend plus Hono backend while preserving the current `/mobile` UI and archiving every non-mobile implementation.

**Architecture:** Keep the root Next.js app as a browser-only mobile frontend and keep `server/boss-shuju` as the only owned business backend. Move desktop, Tauri, legacy Next.js API, duplicated backend logic, obsolete tests, and historical prototypes under `archive/non-mobile/`; replace frontend imports of desktop-oriented types with a small mobile contract module.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Vitest 3, Hono 4, Mongoose 9, Playwright CLI.

## Global Constraints

- Preserve `/`, `/mobile`, and `/mobile/login` behavior.
- Do not change the mobile dashboard JSX structure, section order, CSS class names, API payload shape, or displayed business values.
- Continue routing owned business requests through `NEXT_PUBLIC_BOSS_API_BASE` and `buildBossApiUrl`.
- Continue using `credentials: "include"` for authenticated Sealos requests.
- Do not change MongoDB collections, statistics formulas, Sealos domains, external gateway URLs, or Hono port `8789`.
- Archive files instead of deleting them.
- Exclude `archive/` from TypeScript, Vitest, Next.js, and deployment inputs.
- Do not add or commit passwords, tokens, connection strings, private keys, `.env.local`, or the unrelated Excel files.
- Use test-first red-green cycles for every production-code or configuration change.

---

## Planned File Structure

### Root mobile frontend

- `app/page.tsx`: redirect `/` to `/mobile`.
- `app/mobile/page.tsx`: mobile dashboard route.
- `app/mobile/login/page.tsx`: mobile login route.
- `app/layout.tsx`: shared mobile metadata and viewport.
- `app/globals.css`: base and mobile-only styles.
- `components/mobile/mobile-boss-dashboard.tsx`: current dashboard UI.
- `components/mobile/mobile-boss-charts.tsx`: mobile charts.
- `components/mobile/mobile-boss-login.tsx`: login UI.
- `lib/mobile-api-client.ts`: API URL construction.
- `lib/mobile-contracts.ts`: frontend-only API payload and chart types.
- `lib/mobile-dashboard.ts`: payload-to-view-model transformation.
- `lib/mobile-month.ts`: current month and month navigation helpers.
- `lib/mobile-work-boards.ts`: workflow and aftersales view helpers.

### Backend

- `server/boss-shuju/src/**`: sole owned business backend.
- `server/boss-shuju/.env.example`: backend-only environment variable template.

### Archive

- `archive/non-mobile/desktop-dashboard/`: `/stats`, desktop components, desktop charts, desktop styles and related helpers.
- `archive/non-mobile/tauri/`: former `desktop-tauri/`.
- `archive/non-mobile/legacy-next-api/`: former root `app/api`, MongoDB models and duplicated Next backend services.
- `archive/non-mobile/legacy-tests/`: tests that only cover archived implementations.
- `archive/non-mobile/prototypes/`: former prototype and logo directories.

### Documentation

- `README.md`: current project entry point.
- `docs/architecture/mobile-web.md`: runtime boundaries and data flow.
- `docs/deployment/mobile-web.md`: Vercel/Sealos deployment and environment variables.
- `archive/non-mobile/README.md`: archive contents and restoration notes.

---

### Task 1: Establish Mobile Regression Baseline and Boundary Tests

**Files:**
- Create: `tests/mobile-project-boundary.test.ts`
- Modify: `tests/mobile-work-board-layout.test.ts`
- Preserve: `components/mobile/mobile-boss-dashboard.tsx`
- Preserve: `app/globals.css`

**Interfaces:**
- Consumes: current mobile routes, components, API helper and CSS source.
- Produces: regression tests that define the desired post-archive structure and current Sealos request behavior.

- [ ] **Step 1: Capture the current mobile source fingerprint**

Run:

```powershell
Get-FileHash components\mobile\mobile-boss-dashboard.tsx,components\mobile\mobile-boss-charts.tsx,components\mobile\mobile-boss-login.tsx | Format-Table Path,Hash
```

Record the hashes in the implementation notes. They must remain unchanged unless a later task explicitly updates imports only.

- [ ] **Step 2: Capture baseline phone screenshots**

Run the existing app on an unused port:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3010
```

Use Playwright at widths `390` and `430` to capture `/mobile/login`. If an authenticated local session is available, also capture `/mobile`. Save temporary screenshots under `.playwright-cli/`; do not commit them.

- [ ] **Step 3: Write the failing project-boundary test**

Create `tests/mobile-project-boundary.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pathFromRoot = (...parts: string[]) => join(root, ...parts);

describe("mobile-only project boundary", () => {
  it("keeps only mobile routes in the active Next app", () => {
    expect(existsSync(pathFromRoot("app", "mobile", "page.tsx"))).toBe(true);
    expect(existsSync(pathFromRoot("app", "mobile", "login", "page.tsx"))).toBe(true);
    expect(existsSync(pathFromRoot("app", "stats"))).toBe(false);
    expect(existsSync(pathFromRoot("app", "api"))).toBe(false);
  });

  it("archives non-mobile applications and legacy Next backend code", () => {
    expect(existsSync(pathFromRoot("archive", "non-mobile", "tauri"))).toBe(true);
    expect(existsSync(pathFromRoot("archive", "non-mobile", "desktop-dashboard"))).toBe(true);
    expect(existsSync(pathFromRoot("archive", "non-mobile", "legacy-next-api"))).toBe(true);
  });

  it("keeps the root browser bundle free of MongoDB backend dependencies", () => {
    expect(existsSync(pathFromRoot("models"))).toBe(false);
    expect(existsSync(pathFromRoot("lib", "mongodb.ts"))).toBe(false);
    expect(existsSync(pathFromRoot("lib", "mobile-monthly-stats-service.ts"))).toBe(false);
    expect(existsSync(pathFromRoot("lib", "mobile-open-api-proxy.ts"))).toBe(false);
  });

  it("excludes archived files from active toolchains", () => {
    const tsconfig = readFileSync(pathFromRoot("tsconfig.json"), "utf8");
    const vitest = readFileSync(pathFromRoot("vitest.config.ts"), "utf8");
    expect(tsconfig).toContain('"archive"');
    expect(vitest).toContain("archive/**");
  });
});
```

- [ ] **Step 4: Update the stale API-path assertion before changing production code**

In `tests/mobile-work-board-layout.test.ts`, replace the obsolete direct-path assertion with current API-builder assertions:

```ts
expect(source).toContain('buildBossApiUrl("/api/mobile/workflow/daily-monitor")');
expect(source).toContain("buildBossApiUrl(`/api/mobile/aftersales/daily-records?date=");
expect(source).toContain('credentials: "include"');
```

- [ ] **Step 5: Run tests and verify the intended red state**

Run:

```powershell
npm run test:unit -- tests/mobile-project-boundary.test.ts tests/mobile-work-board-layout.test.ts
```

Expected: `mobile-work-board-layout.test.ts` passes; `mobile-project-boundary.test.ts` fails because active desktop/API directories still exist and the archive has not been created.

- [ ] **Step 6: Commit the regression tests**

```powershell
git add tests/mobile-project-boundary.test.ts tests/mobile-work-board-layout.test.ts
git commit -m "test: define mobile-only project boundary"
```

---

### Task 2: Isolate Mobile Frontend Contracts from Desktop Statistics Code

**Files:**
- Create: `lib/mobile-contracts.ts`
- Create: `lib/mobile-month.ts`
- Modify: `lib/mobile-dashboard.ts`
- Modify: `components/mobile/mobile-boss-dashboard.tsx`
- Modify: `components/mobile/mobile-boss-charts.tsx`
- Modify: `tests/mobile-dashboard-data.test.ts`
- Modify: `tests/month-rotation.test.ts`

**Interfaces:**
- Produces `TrendItem`, `DailyAmountPoint`, `DailySummaryRow`, `BarChartDatum`, `RecentSignedTerminationStatsResponse`, and supporting response types from `lib/mobile-contracts.ts`.
- Produces `getCurrentMonthValue`, `getPreviousMonthValue`, and `getNextAllowedMonth` from `lib/mobile-month.ts`.
- Consumers: all active mobile components and `lib/mobile-dashboard.ts`.

- [ ] **Step 1: Add contract-import assertions**

Extend `tests/mobile-project-boundary.test.ts`:

```ts
it("uses mobile-owned contracts instead of desktop statistics modules", () => {
  const dashboard = readFileSync(pathFromRoot("lib", "mobile-dashboard.ts"), "utf8");
  const charts = readFileSync(
    pathFromRoot("components", "mobile", "mobile-boss-charts.tsx"),
    "utf8"
  );
  expect(dashboard).toContain('@/lib/mobile-contracts');
  expect(charts).toContain('@/lib/mobile-contracts');
  expect(dashboard).not.toContain('@/lib/stats/');
  expect(charts).not.toContain('@/components/charts/');
});
```

- [ ] **Step 2: Run the new assertion and verify it fails**

```powershell
npx vitest run tests/mobile-project-boundary.test.ts
```

Expected: FAIL because active mobile files still import `lib/stats` and `components/charts`.

- [ ] **Step 3: Create the mobile contract module**

Create `lib/mobile-contracts.ts` by moving, without changing property names, the active frontend types currently sourced from:

```ts
export type TrendItem = { date: string; count: number };

export type DailyAmountPoint = {
  date: string;
  value: number;
};

export type DailySummaryRow = {
  date: string;
  dailyPointShopCount: number;
  totalAmount: number;
  meituanAmount: number;
  elemeAmount: number;
  wuhanAmount: number;
};

export type BarChartDatum = {
  name: string;
  value: number;
};
```

Copy `RecentSignedTerminationOperatorStat` and `RecentSignedTerminationStatsResponse` exactly from `lib/stats/recent-signed-termination-types.ts`. Add only the types directly required by `MobileMonthlyStatsPayload` and the mobile components.

- [ ] **Step 4: Create the mobile month helper**

Create `lib/mobile-month.ts` with the current implementations of:

```ts
export function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
```

Move `getPreviousMonthValue` and `getNextAllowedMonth` from `lib/stats/month-rotation.ts` without behavior changes.

- [ ] **Step 5: Update active mobile imports only**

Update the three active consumers to import from `@/lib/mobile-contracts` and `@/lib/mobile-month`. Do not change JSX, hook order, API calls, labels, CSS classes, or response handling.

- [ ] **Step 6: Fix the typed mobile fixture**

In `tests/mobile-dashboard-data.test.ts`, add the missing field required by the current payload contract:

```ts
dailyOrderShopTrend: [],
```

Place it beside `dailyAmountTrend` so the fixture matches `MobileMonthlyStatsPayload`.

- [ ] **Step 7: Run focused tests**

```powershell
npx vitest run tests/mobile-dashboard-data.test.ts tests/month-rotation.test.ts tests/mobile-project-boundary.test.ts
npx tsc --noEmit
```

Expected: contract-import assertions pass; the boundary test still fails only for directories not yet archived. TypeScript may still report the unrelated desktop chart test until Task 3 archives it.

- [ ] **Step 8: Commit the contract isolation**

```powershell
git add lib/mobile-contracts.ts lib/mobile-month.ts lib/mobile-dashboard.ts components/mobile/mobile-boss-dashboard.tsx components/mobile/mobile-boss-charts.tsx tests/mobile-dashboard-data.test.ts tests/mobile-project-boundary.test.ts tests/month-rotation.test.ts
git commit -m "refactor: isolate mobile frontend contracts"
```

---

### Task 3: Archive Desktop UI, Tauri, Prototypes, and Desktop Tests

**Files:**
- Move: `app/stats/` -> `archive/non-mobile/desktop-dashboard/app/stats/`
- Move: `components/stats/` -> `archive/non-mobile/desktop-dashboard/components/stats/`
- Move: `components/charts/` -> `archive/non-mobile/desktop-dashboard/components/charts/`
- Move: `desktop-tauri/` -> `archive/non-mobile/tauri/`
- Move: `prototype-archive/` -> `archive/non-mobile/prototypes/prototype-archive/`
- Move: `logo-原型图/` -> `archive/non-mobile/prototypes/logo-原型图/`
- Modify: `app/globals.css`
- Move desktop-only test files listed below to `archive/non-mobile/legacy-tests/desktop/`

**Interfaces:**
- Consumes: mobile contracts introduced in Task 2, which remove the last active dependency on `components/charts`.
- Produces: an active Next.js tree containing mobile routes and mobile components only.

- [ ] **Step 1: Add a failing active-CSS assertion**

Extend `tests/mobile-project-boundary.test.ts`:

```ts
it("keeps active CSS mobile-only", () => {
  const css = readFileSync(pathFromRoot("app", "globals.css"), "utf8");
  expect(css).toContain(".mobile-page");
  expect(css).toContain(".mobile-login-page");
  expect(css).not.toContain(".dashboard-shell");
  expect(css).not.toContain(".overview-grid");
});
```

- [ ] **Step 2: Verify the CSS assertion fails**

```powershell
npx vitest run tests/mobile-project-boundary.test.ts
```

Expected: FAIL because desktop selectors remain in `app/globals.css`.

- [ ] **Step 3: Verify move targets before bulk moves**

```powershell
$root = (Resolve-Path .).Path
$archive = Join-Path $root "archive\non-mobile"
if (-not $archive.StartsWith($root)) { throw "Archive target escaped workspace" }
New-Item -ItemType Directory -Force "$archive\desktop-dashboard\app", "$archive\desktop-dashboard\components", "$archive\legacy-tests\desktop", "$archive\prototypes" | Out-Null
```

- [ ] **Step 4: Move the desktop applications and assets**

Use PowerShell `Move-Item -LiteralPath` for the exact directories listed in this task. Do not move `components/mobile`, `app/mobile`, or the root `app/page.tsx`.

- [ ] **Step 5: Move desktop-only tests**

Move these files to `archive/non-mobile/legacy-tests/desktop/`:

```text
bar-chart-option.test.ts
bottom-trend-layout.test.ts
dashboard-chart-sections-removal.test.ts
dashboard-header-copy.test.ts
dashboard-header-layout.test.ts
dashboard-header-style.test.ts
daily-summary-exception-layout.test.ts
daily-summary-section-layout.test.ts
map-focus.test.ts
metric-grid.test.ts
middle-strip-height.test.ts
monthly-stats-metrics-copy.test.ts
overview-average-line.test.ts
overview-grid-style.test.ts
overview-total-amount-trend.test.ts
platform-amount-style.test.ts
province-carousel.test.ts
province-map-regions.test.ts
province-map-style.test.ts
province-map.test.ts
sales-exception-comparison-chart.test.ts
service-summary-panel.test.ts
side-panel-height.test.ts
tauri-desktop-scaffold.test.ts
wuhan-summary-strip-layout.test.ts
wuhan-summary-strip-style.test.ts
```

- [ ] **Step 6: Reduce `app/globals.css` to base and mobile styles**

Preserve root variables, reset rules, mobile login styles, mobile dashboard styles, responsive rules, and animations. Move the removed desktop CSS into `archive/non-mobile/desktop-dashboard/app/desktop-globals.css`. Do not rename or alter any `.mobile-*` selector.

- [ ] **Step 7: Run the focused boundary and mobile layout tests**

```powershell
npx vitest run tests/mobile-project-boundary.test.ts tests/mobile-layout-source.test.ts tests/mobile-work-board-layout.test.ts
```

Expected: active CSS assertions pass; archive directory assertions for legacy Next backend remain red until Task 4.

- [ ] **Step 8: Commit the desktop archive**

```powershell
git add -A app/stats components/stats components/charts desktop-tauri prototype-archive "logo-原型图" archive/non-mobile app/globals.css tests
git commit -m "refactor: archive non-mobile user interfaces"
```

---

### Task 4: Archive the Legacy Next Backend and Obsolete Tests

**Files:**
- Move: `app/api/` -> `archive/non-mobile/legacy-next-api/app/api/`
- Move: `models/` -> `archive/non-mobile/legacy-next-api/models/`
- Move: `proxy.ts` -> `archive/non-mobile/legacy-next-api/proxy.ts`
- Move: root backend-only `lib` files -> `archive/non-mobile/legacy-next-api/lib/`
- Move: root `lib/stats/` -> `archive/non-mobile/legacy-next-api/lib/stats/`
- Modify: `tests/mobile-auth.test.ts`
- Modify: `tests/mobile-open-api-proxy.test.ts`
- Modify: `tests/mobile-route-protection.test.ts`
- Modify: `tests/mobile-stats-api-source.test.ts`
- Move obsolete tests to `archive/non-mobile/legacy-tests/next-backend/`

**Interfaces:**
- Consumes: active frontend no longer imports `lib/stats` after Task 2.
- Produces: Hono as the only active backend; root tests reference Hono source where backend behavior remains important.

- [ ] **Step 1: Point backend behavior tests at the Hono implementation**

Change `tests/mobile-auth.test.ts` to import:

```ts
import {
  createMobileSessionToken,
  verifyMobileSessionToken
} from "../server/boss-shuju/src/auth/session";
```

Change `tests/mobile-open-api-proxy.test.ts` to import the equivalent exported helpers from `../server/boss-shuju/src/services/open-api-client`. Keep the existing assertions for timeout/error serialization and insecure TLS base matching.

- [ ] **Step 2: Rewrite source-boundary tests for Hono-only ownership**

Update `tests/mobile-route-protection.test.ts` so it asserts `proxy.ts` does not exist and verifies Hono `mobileAuthMiddleware` is applied to protected routes.

Update `tests/mobile-stats-api-source.test.ts` so it reads:

```text
server/boss-shuju/src/routes/mobile-stats.ts
server/boss-shuju/src/services/mobile-monthly-stats-service.ts
server/boss-shuju/src/models/online-shop-count-snapshot.ts
```

The assertions must keep checking lightweight mobile payload behavior, online-shop counts, and absence of desktop-only statistics.

- [ ] **Step 3: Run the rewritten tests before moving files**

```powershell
npx vitest run tests/mobile-auth.test.ts tests/mobile-open-api-proxy.test.ts tests/mobile-route-protection.test.ts tests/mobile-stats-api-source.test.ts
```

Expected: rewritten Hono tests pass while the project-boundary test still fails because legacy root backend files remain active.

- [ ] **Step 4: Move the legacy Next backend**

Move these exact root paths under `archive/non-mobile/legacy-next-api/`:

```text
app/api/
models/
proxy.ts
lib/daily-point-derived.ts
lib/mobile-auth.ts
lib/mobile-monthly-stats-service.ts
lib/mobile-open-api-proxy.ts
lib/mongodb.ts
lib/report-cache.ts
lib/sales-city.ts
lib/stats/
```

Before moving `lib/stats/`, verify `rg -n '@/lib/stats/' app components/mobile lib/mobile-*.ts` returns no active imports.

- [ ] **Step 5: Move obsolete root-backend tests**

Move all tests that import archived root statistics or inspect archived Next routes to `archive/non-mobile/legacy-tests/next-backend/`. Retain these active test families:

```text
mobile-dashboard-data.test.ts
mobile-layout-source.test.ts
mobile-project-boundary.test.ts
mobile-sealos-api-base.test.ts
mobile-work-board-layout.test.ts
mobile-work-boards.test.ts
month-rotation.test.ts
mobile-auth.test.ts
mobile-open-api-proxy.test.ts
mobile-route-protection.test.ts
mobile-stats-api-source.test.ts
recent-signed-termination-source.test.ts
sealos-auth-source.test.ts
sealos-backend-source.test.ts
sealos-mobile-stats-source.test.ts
sealos-work-board-source.test.ts
```

Any retained test must import only active root mobile code or `server/boss-shuju/src`.

- [ ] **Step 6: Run the complete active test suite**

```powershell
npm run test:unit
```

Expected: all active test files pass; Vitest does not scan `archive/non-mobile/legacy-tests`.

- [ ] **Step 7: Commit the backend archive**

```powershell
git add -A app/api models proxy.ts lib archive/non-mobile/legacy-next-api archive/non-mobile/legacy-tests tests
git commit -m "refactor: make Hono the sole mobile backend"
```

---

### Task 5: Tighten Tooling, Environment Templates, and Documentation

**Files:**
- Modify: `tsconfig.json`
- Modify: `vitest.config.ts`
- Modify: `package.json`
- Modify: `.env.example`
- Create: `server/boss-shuju/.env.example`
- Create: `README.md`
- Create: `docs/architecture/mobile-web.md`
- Create: `docs/deployment/mobile-web.md`
- Create: `archive/non-mobile/README.md`
- Modify: `tests/mobile-project-boundary.test.ts`

**Interfaces:**
- Produces: documented mobile-only build boundary and separate frontend/backend environment contracts.

- [ ] **Step 1: Extend the failing boundary test for environment separation**

Add:

```ts
it("separates frontend and backend environment templates", () => {
  const frontendEnv = readFileSync(pathFromRoot(".env.example"), "utf8");
  const backendEnv = readFileSync(
    pathFromRoot("server", "boss-shuju", ".env.example"),
    "utf8"
  );
  expect(frontendEnv).toContain("NEXT_PUBLIC_BOSS_API_BASE");
  expect(frontendEnv).not.toContain("MONGODB_URI");
  expect(frontendEnv).not.toContain("MOBILE_SESSION_SECRET");
  expect(backendEnv).toContain("MONGODB_URI");
  expect(backendEnv).toContain("MOBILE_SESSION_SECRET");
  expect(backendEnv).toContain("BOSS_WEB_ORIGIN");
});
```

- [ ] **Step 2: Run and verify the environment assertion fails**

```powershell
npx vitest run tests/mobile-project-boundary.test.ts
```

Expected: FAIL because backend variables are still in the root template and the backend template does not exist.

- [ ] **Step 3: Update toolchain boundaries**

Update `tsconfig.json` exclusions to include:

```json
"exclude": ["node_modules", "archive", "server"]
```

Update `vitest.config.ts`:

```ts
test: {
  environment: "node",
  include: ["tests/**/*.test.ts"],
  exclude: ["archive/**", "node_modules/**"]
}
```

Update the root package name to `boss-mobile-web` while preserving `dev`, `build`, `start`, and `test:unit`. Add:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 4: Separate environment templates**

Root `.env.example` must contain only:

```dotenv
NEXT_PUBLIC_BOSS_API_BASE=https://jxdlmtjubdkn.sealosbja.site
```

Create `server/boss-shuju/.env.example` with names and non-secret examples for:

```dotenv
PORT=8789
NODE_ENV=production
MONGODB_URI=mongodb://username:password@host:27017/database
MOBILE_DASHBOARD_PASSWORD=replace-me
MOBILE_SESSION_SECRET=replace-with-a-long-random-secret
MOBILE_COOKIE_SAME_SITE=None
BOSS_WEB_ORIGIN=https://your-vercel-domain.example
CHENGSHANG_OPEN_API_BASES=https://your-open-api.example
CHENGSHANG_OPEN_API_INSECURE_TLS_BASES=
CHENGSHANG_OPEN_API_TOKEN=replace-me
```

- [ ] **Step 5: Write current-state documentation**

`README.md` must include:

- Project purpose: mobile BOSS dashboard.
- Root frontend and `server/boss-shuju` backend responsibilities.
- `npm install`, `npm run dev`, `npm run test:unit`, `npm run typecheck`, `npm run build`.
- Backend install, build and start commands.
- Link to architecture and deployment documents.
- Archive explanation.

`docs/architecture/mobile-web.md` must document this data flow:

```text
Browser -> Next.js mobile UI -> Sealos Hono API -> MongoDB
                                      -> workflow/aftersales Open API
Browser -> gw.hbcsch.pw for generation/resource public statistics
```

`docs/deployment/mobile-web.md` must separate Vercel and Sealos variables, document cross-site `credentials: include`, Cookie `SameSite=None; Secure`, CORS origin, health check, and production verification.

`archive/non-mobile/README.md` must list archived directories and state that imports, build scripts and relative paths are intentionally not maintained.

- [ ] **Step 6: Run documentation and boundary tests**

```powershell
npx vitest run tests/mobile-project-boundary.test.ts tests/mobile-sealos-api-base.test.ts tests/sealos-backend-source.test.ts
npm run typecheck
```

Expected: all commands exit `0`.

- [ ] **Step 7: Commit tooling and documentation**

```powershell
git add tsconfig.json vitest.config.ts package.json .env.example server/boss-shuju/.env.example README.md docs/architecture/mobile-web.md docs/deployment/mobile-web.md archive/non-mobile/README.md tests/mobile-project-boundary.test.ts
git commit -m "docs: define mobile web architecture and deployment"
```

---

### Task 6: Full Verification and Mobile Visual Regression

**Files:**
- Verify: all active source and documentation.
- Do not modify production files unless a failing verification is reproduced with a focused test first.

**Interfaces:**
- Consumes: completed mobile-only frontend, Hono backend, archive and documentation.
- Produces: fresh evidence that the project is testable, buildable and visually compatible.

- [ ] **Step 1: Verify the active file boundary**

```powershell
rg --files app components lib tests | Sort-Object
rg -n '@/lib/stats/|@/components/stats|@/components/charts|/api/stats/monthly' app components lib tests
```

Expected: active files are mobile-owned; the second command returns no legacy imports.

- [ ] **Step 2: Run the complete root test suite**

```powershell
npm run test:unit
```

Expected: exit `0`, zero failed test files and zero failed tests.

- [ ] **Step 3: Run root TypeScript validation**

```powershell
npm run typecheck
```

Expected: exit `0` with no TypeScript errors.

- [ ] **Step 4: Run the Hono backend build**

```powershell
npm run build
```

Working directory: `server/boss-shuju`.

Expected: `tsc -p tsconfig.json` exits `0`.

- [ ] **Step 5: Run the Next.js production build**

```powershell
npm run build
```

Working directory: repository root. Allow at least five minutes and inspect the complete output instead of treating a timeout as success.

Expected: exit `0`; generated routes include `/`, `/mobile`, and `/mobile/login`, and do not include `/stats` or root `/api` handlers.

- [ ] **Step 6: Compare mobile source fingerprints**

```powershell
Get-FileHash components\mobile\mobile-boss-dashboard.tsx,components\mobile\mobile-boss-login.tsx | Format-Table Path,Hash
```

Expected: login component hash is unchanged. Dashboard differences, if any, are restricted to import paths introduced by Task 2.

- [ ] **Step 7: Perform phone-width visual verification**

Start the production server on an unused port:

```powershell
npm run start -- --hostname 127.0.0.1 --port 3011
```

Use Playwright to inspect `/mobile/login` at `390x844` and `430x932`. Compare against Task 1 screenshots for:

- no horizontal scrolling;
- unchanged brand, password input and primary action;
- no overlapping text;
- stable card widths and spacing;
- no console errors from missing archived modules.

If an authenticated session is available, inspect `/mobile` for unchanged KPI order, charts, daily repayment list, resource statistics, rankings, generation statistics, termination statistics, workflow and aftersales sections.

- [ ] **Step 8: Inspect repository status and secret safety**

```powershell
git status --short
git diff --check
rg -n "BEGIN OPENSSH PRIVATE KEY|mongodb://root:|CHENGSHANG_OPEN_API_TOKEN=" --glob '!archive/non-mobile/**' --glob '!后端数据库迁移初始需求'
```

Expected: only the user's unrelated Excel files remain untracked; no whitespace errors; no newly committed secret values.
