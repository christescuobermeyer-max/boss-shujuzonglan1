# Sealos Mobile Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the full BOSS mobile dashboard backend, including login authentication, from Vercel route handlers to a Sealos Hono TypeScript service.

**Architecture:** Build a standalone Hono backend in `boss-shuju` on Sealos port `8789`, then change the existing Next.js mobile frontend to call that backend with credentialed requests. Keep current MongoDB-driven monthly statistics and open API work-board payload shapes compatible with the existing mobile UI.

**Tech Stack:** Hono, TypeScript, Node.js runtime first, Mongoose, Vitest, existing Next.js mobile frontend.

## Global Constraints

- Do not commit SSH private keys, MongoDB passwords, mobile passwords, session secrets, or open API tokens.
- Keep the existing mobile response contracts compatible with `components/mobile/mobile-boss-dashboard.tsx`.
- Preserve the platform actual repayment rule: unassigned or unmatched shops must be included in totals and attributed to `未分配`, not filtered out of total repayment.
- First production runtime is Node.js; Bun is a later optimization only after compatibility checks.
- Sealos backend listens on `PORT=8789`.
- Sealos public base is `https://jxdlmtjubdkn.sealosbja.site` unless an `api.yujinkeji.fun` binding is added.
- Frontend fetches must use `credentials: "include"` for Sealos API calls.

---

## File Structure

Create a new backend package under `server/boss-shuju` inside this repo first, then deploy that folder to the Sealos `boss-shuju` directory.

- Create `server/boss-shuju/package.json`: backend scripts and dependencies.
- Create `server/boss-shuju/tsconfig.json`: backend TypeScript config.
- Create `server/boss-shuju/src/index.ts`: Hono app, health route, middleware mounting, server startup.
- Create `server/boss-shuju/src/config/env.ts`: environment parsing and required variable checks.
- Create `server/boss-shuju/src/auth/session.ts`: mobile session token creation and verification.
- Create `server/boss-shuju/src/middleware/auth.ts`: Hono auth middleware.
- Create `server/boss-shuju/src/middleware/cors.ts`: credentialed CORS for Vercel frontend origin.
- Create `server/boss-shuju/src/db/mongodb.ts`: Mongoose connection cache.
- Create `server/boss-shuju/src/models/shop.ts`: `shops` model copied from current root model.
- Create `server/boss-shuju/src/models/daily-point-detail.ts`: `daily_point_details` model copied from current root model.
- Create `server/boss-shuju/src/models/online-shop-count-snapshot.ts`: `online_shop_count_snapshots` model copied from current root model.
- Create `server/boss-shuju/src/services/open-api-client.ts`: open API fetch client with timeout, retries, and clear errors.
- Create `server/boss-shuju/src/services/mobile-monthly-stats-service.ts`: Hono-safe monthly stats service ported from `lib/mobile-monthly-stats-service.ts`.
- Create `server/boss-shuju/src/routes/mobile-login.ts`: `POST /api/mobile/login`.
- Create `server/boss-shuju/src/routes/mobile-stats.ts`: `GET /api/mobile/stats/monthly`.
- Create `server/boss-shuju/src/routes/mobile-workflow.ts`: `GET /api/mobile/workflow/daily-monitor`.
- Create `server/boss-shuju/src/routes/mobile-aftersales.ts`: `GET /api/mobile/aftersales/daily-records`.
- Modify `components/mobile/mobile-boss-dashboard.tsx`: use backend API base and credentialed fetch.
- Modify `components/mobile/mobile-boss-login.tsx`: submit login to backend API base with credentials.
- Modify `proxy.ts`: stop protecting `/api/mobile/*` after backend migration; keep only page-level redirect if still needed.
- Modify `.env.example`: document frontend `NEXT_PUBLIC_BOSS_API_BASE` and backend server variables without real secrets.
- Add tests under `tests/` for source compatibility and frontend backend-base usage.

---

### Task 1: Scaffold Hono Backend Package

**Files:**
- Create: `server/boss-shuju/package.json`
- Create: `server/boss-shuju/tsconfig.json`
- Create: `server/boss-shuju/src/index.ts`
- Create: `server/boss-shuju/src/config/env.ts`
- Test: `tests/sealos-backend-source.test.ts`

**Interfaces:**
- Produces: `getEnv(): ServerEnv`
- Produces: `app` Hono instance from `src/index.ts`

- [ ] **Step 1: Write the failing source test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sealos backend scaffold", () => {
  it("defines a Hono backend package on port 8789", () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "server", "boss-shuju", "package.json"), "utf8")
    );
    const indexSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "index.ts"),
      "utf8"
    );

    expect(pkg.dependencies.hono).toBeTruthy();
    expect(pkg.scripts.build).toContain("tsc");
    expect(indexSource).toContain("new Hono");
    expect(indexSource).toContain("/healthz");
    expect(indexSource).toContain("PORT");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/sealos-backend-source.test.ts`

Expected: FAIL because `server/boss-shuju/package.json` does not exist.

- [ ] **Step 3: Add backend package files**

Create `server/boss-shuju/package.json`:

```json
{
  "name": "boss-shuju-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@hono/node-server": "^1.18.2",
    "hono": "^4.10.7",
    "mongoose": "^9.1.6"
  },
  "devDependencies": {
    "@types/node": "^20",
    "tsx": "^4.21.0",
    "typescript": "^5"
  }
}
```

Create `server/boss-shuju/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

Create `server/boss-shuju/src/config/env.ts`:

```ts
export type ServerEnv = {
  port: number;
  mongoUri: string;
  mobilePassword: string;
  mobileSessionSecret: string;
  bossWebOrigin: string;
  openApiBases: string[];
  openApiToken: string;
  openApiInsecureTlsBases: string[];
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function getEnv(): ServerEnv {
  return {
    port: Number(process.env.PORT ?? 8789),
    mongoUri: requireEnv("MONGODB_URI"),
    mobilePassword: requireEnv("MOBILE_DASHBOARD_PASSWORD"),
    mobileSessionSecret: requireEnv("MOBILE_SESSION_SECRET"),
    bossWebOrigin: requireEnv("BOSS_WEB_ORIGIN"),
    openApiBases: parseList(process.env.CHENGSHANG_OPEN_API_BASES || process.env.CHENGSHANG_OPEN_API_BASE),
    openApiToken: requireEnv("CHENGSHANG_OPEN_API_TOKEN"),
    openApiInsecureTlsBases: parseList(process.env.CHENGSHANG_OPEN_API_INSECURE_TLS_BASES)
  };
}
```

Create `server/boss-shuju/src/index.ts`:

```ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { getEnv } from "./config/env.js";

export const app = new Hono();

app.get("/healthz", (c) => c.json({ ok: true }));

if (process.env.NODE_ENV !== "test") {
  const env = getEnv();
  serve({ fetch: app.fetch, port: env.port });
  console.log(`boss-shuju backend listening on ${env.port}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/sealos-backend-source.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/boss-shuju/package.json server/boss-shuju/tsconfig.json server/boss-shuju/src/index.ts server/boss-shuju/src/config/env.ts tests/sealos-backend-source.test.ts
git commit -m "feat: scaffold sealos mobile backend"
```

---

### Task 2: Implement Sealos Session Authentication

**Files:**
- Create: `server/boss-shuju/src/auth/session.ts`
- Create: `server/boss-shuju/src/middleware/auth.ts`
- Create: `server/boss-shuju/src/routes/mobile-login.ts`
- Modify: `server/boss-shuju/src/index.ts`
- Test: `tests/sealos-auth-source.test.ts`

**Interfaces:**
- Consumes: `getEnv(): ServerEnv`
- Produces: `createMobileSessionToken(secret: string, nowMs?: number): string`
- Produces: `verifyMobileSessionToken(token: string | undefined, secret: string, nowMs?: number): boolean`
- Produces: `mobileAuthMiddleware`
- Produces: `mobileLoginRoute`

- [ ] **Step 1: Write the failing source test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sealos backend auth", () => {
  it("moves mobile login and signed session cookies into Hono backend", () => {
    const sessionSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "auth", "session.ts"),
      "utf8"
    );
    const loginSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "routes", "mobile-login.ts"),
      "utf8"
    );

    expect(sessionSource).toContain("mobile_dashboard_session");
    expect(sessionSource).toContain("createHmac");
    expect(sessionSource).toContain("timingSafeEqual");
    expect(loginSource).toContain("/api/mobile/login");
    expect(loginSource).toContain("HttpOnly");
    expect(loginSource).toContain("SameSite=Lax");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/sealos-auth-source.test.ts`

Expected: FAIL because auth files do not exist.

- [ ] **Step 3: Implement session helpers and login route**

Port the current logic from `lib/mobile-auth.ts` into `server/boss-shuju/src/auth/session.ts`, keeping these exported names:

```ts
export const MOBILE_SESSION_COOKIE = "mobile_dashboard_session";
export const MOBILE_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
export function createMobileSessionToken(secret: string, nowMs = Date.now()): string;
export function verifyMobileSessionToken(token: string | undefined, secret: string, nowMs = Date.now()): boolean;
```

Create `server/boss-shuju/src/routes/mobile-login.ts`:

```ts
import { Hono } from "hono";
import { getEnv } from "../config/env.js";
import {
  MOBILE_SESSION_COOKIE,
  MOBILE_SESSION_MAX_AGE_SECONDS,
  createMobileSessionToken
} from "../auth/session.js";

export const mobileLoginRoute = new Hono();

mobileLoginRoute.post("/api/mobile/login", async (c) => {
  const env = getEnv();
  const body = await c.req.json<{ password?: string }>().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password.trim() : "";

  if (password !== env.mobilePassword) {
    return c.json({ message: "密码错误，请重新输入", error: "invalid_password" }, 401);
  }

  const token = createMobileSessionToken(env.mobileSessionSecret);
  c.header(
    "Set-Cookie",
    `${MOBILE_SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${MOBILE_SESSION_MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`
  );
  return c.json({ ok: true });
});
```

Create `server/boss-shuju/src/middleware/auth.ts`:

```ts
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { getEnv } from "../config/env.js";
import { MOBILE_SESSION_COOKIE, verifyMobileSessionToken } from "../auth/session.js";

export const mobileAuthMiddleware = createMiddleware(async (c, next) => {
  const env = getEnv();
  const token = getCookie(c, MOBILE_SESSION_COOKIE);
  if (!verifyMobileSessionToken(token, env.mobileSessionSecret)) {
    return c.json({ message: "未授权访问", error: "unauthorized" }, 401);
  }
  await next();
});
```

Mount `mobileLoginRoute` in `server/boss-shuju/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/sealos-auth-source.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/boss-shuju/src/auth/session.ts server/boss-shuju/src/middleware/auth.ts server/boss-shuju/src/routes/mobile-login.ts server/boss-shuju/src/index.ts tests/sealos-auth-source.test.ts
git commit -m "feat: move mobile auth to sealos backend"
```

---

### Task 3: Port MongoDB Models and Monthly Stats API

**Files:**
- Create: `server/boss-shuju/src/db/mongodb.ts`
- Create: `server/boss-shuju/src/models/shop.ts`
- Create: `server/boss-shuju/src/models/daily-point-detail.ts`
- Create: `server/boss-shuju/src/models/online-shop-count-snapshot.ts`
- Create: `server/boss-shuju/src/services/mobile-monthly-stats-service.ts`
- Create: `server/boss-shuju/src/routes/mobile-stats.ts`
- Modify: `server/boss-shuju/src/index.ts`
- Test: `tests/sealos-mobile-stats-source.test.ts`

**Interfaces:**
- Consumes: `mobileAuthMiddleware`
- Produces: `connectMongo(): Promise<typeof mongoose>`
- Produces: `getMobileMonthlyStatsPayload(monthParam: string | null, deptParam?: string | null)`
- Produces: `GET /api/mobile/stats/monthly`

- [ ] **Step 1: Write the failing source test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sealos monthly stats API", () => {
  it("ports mobile monthly stats to the Sealos backend", () => {
    const routeSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "routes", "mobile-stats.ts"),
      "utf8"
    );
    const serviceSource = readFileSync(
      join(process.cwd(), "server", "boss-shuju", "src", "services", "mobile-monthly-stats-service.ts"),
      "utf8"
    );

    expect(routeSource).toContain("/api/mobile/stats/monthly");
    expect(routeSource).toContain("mobileAuthMiddleware");
    expect(routeSource).toContain("connectMongo");
    expect(serviceSource).toContain("monthlyPointAmount");
    expect(serviceSource).toContain("meituanMonthlyPointAmount");
    expect(serviceSource).toContain("elemeMonthlyPointAmount");
    expect(serviceSource).toContain("onlineShopCounts");
    expect(serviceSource).toContain("未分配");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/sealos-mobile-stats-source.test.ts`

Expected: FAIL because stats route and service do not exist.

- [ ] **Step 3: Copy models and DB connector**

Copy the root model schemas into `server/boss-shuju/src/models/*` without changing collection names:

- `shops`
- `daily_point_details`
- `online_shop_count_snapshots`

Create `server/boss-shuju/src/db/mongodb.ts` using the same connection options as `lib/mongodb.ts`, but with `appName: "boss-shuju-backend"`.

- [ ] **Step 4: Port monthly stats service**

Port these existing root modules or their required functions into backend-local service files:

- `lib/mobile-monthly-stats-service.ts`
- `lib/mobile-dashboard.ts` payload types only
- `lib/daily-point-derived.ts`
- required files under `lib/stats/*`
- `lib/sales-city.ts`
- `lib/report-cache.ts`

Keep the mobile payload shape unchanged. In repayment totals, do not filter unmatched shops out of platform totals. Unmatched operator-level records must remain under `未分配`.

- [ ] **Step 5: Add Hono route**

Create `server/boss-shuju/src/routes/mobile-stats.ts`:

```ts
import { Hono } from "hono";
import { connectMongo } from "../db/mongodb.js";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { getMobileMonthlyStatsPayload } from "../services/mobile-monthly-stats-service.js";

export const mobileStatsRoute = new Hono();

mobileStatsRoute.get("/api/mobile/stats/monthly", mobileAuthMiddleware, async (c) => {
  try {
    await connectMongo();
    const payload = await getMobileMonthlyStatsPayload(
      c.req.query("month") ?? null,
      c.req.query("dept") ?? null
    );
    return c.json(payload);
  } catch (error) {
    return c.json(
      {
        message: "获取手机统计失败",
        error: error instanceof Error ? error.message : "unknown_error"
      },
      500
    );
  }
});
```

Mount `mobileStatsRoute` in `server/boss-shuju/src/index.ts`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:unit -- tests/sealos-mobile-stats-source.test.ts`

Expected: PASS.

- [ ] **Step 7: Build backend**

Run:

```bash
cd server/boss-shuju
npm install
npm run build
```

Expected: TypeScript build succeeds.

- [ ] **Step 8: Commit**

```bash
git add server/boss-shuju tests/sealos-mobile-stats-source.test.ts
git commit -m "feat: port mobile monthly stats to sealos backend"
```

---

### Task 4: Port Work Board Open API Proxies

**Files:**
- Create: `server/boss-shuju/src/services/open-api-client.ts`
- Create: `server/boss-shuju/src/routes/mobile-workflow.ts`
- Create: `server/boss-shuju/src/routes/mobile-aftersales.ts`
- Modify: `server/boss-shuju/src/index.ts`
- Test: `tests/sealos-work-board-source.test.ts`

**Interfaces:**
- Consumes: `mobileAuthMiddleware`
- Produces: `fetchOpenApiJson<T>({ path, query, logLabel }): Promise<OpenApiProxySuccess<T> | OpenApiProxyFailure>`
- Produces: `GET /api/mobile/workflow/daily-monitor`
- Produces: `GET /api/mobile/aftersales/daily-records`

- [ ] **Step 1: Write the failing source test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/sealos-work-board-source.test.ts`

Expected: FAIL because work board files do not exist.

- [ ] **Step 3: Port open API client**

Copy the behavior from `lib/mobile-open-api-proxy.ts` into `server/boss-shuju/src/services/open-api-client.ts`, with these changes:

```ts
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_RETRY_COUNT = 2;
```

Read configuration through `getEnv()` instead of `process.env` inside helper functions. Keep response error fields:

- `missing_open_api_token`
- `upstream_error`
- `proxy_exception`
- `upstreamStatus`
- `detail`
- `attempts`

- [ ] **Step 4: Add workflow route**

Create `server/boss-shuju/src/routes/mobile-workflow.ts`:

```ts
import { Hono } from "hono";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { fetchOpenApiJson } from "../services/open-api-client.js";

export const mobileWorkflowRoute = new Hono();

mobileWorkflowRoute.get("/api/mobile/workflow/daily-monitor", mobileAuthMiddleware, async (c) => {
  const result = await fetchOpenApiJson({
    path: "/api/open/workflow/daily-monitor",
    logLabel: "mobile workflow"
  });

  if (!result.ok) {
    const status = result.error === "missing_open_api_token" ? 500 : result.error === "upstream_error" ? 502 : 504;
    return c.json(
      {
        message: "获取运营工作进度失败",
        error: result.error,
        upstreamStatus: result.upstreamStatus,
        detail: result.detail,
        attempts: result.attempts
      },
      status
    );
  }

  return c.json(result.payload);
});
```

- [ ] **Step 5: Add aftersales route**

Create `server/boss-shuju/src/routes/mobile-aftersales.ts`:

```ts
import { Hono } from "hono";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { fetchOpenApiJson } from "../services/open-api-client.js";

export const mobileAftersalesRoute = new Hono();

mobileAftersalesRoute.get("/api/mobile/aftersales/daily-records", mobileAuthMiddleware, async (c) => {
  const searchParams = new URLSearchParams();
  const date = c.req.query("date") ?? "";
  if (date) searchParams.set("date", date);

  const result = await fetchOpenApiJson({
    path: "/api/open/aftersales/daily-records",
    query: searchParams.toString(),
    logLabel: "mobile aftersales"
  });

  if (!result.ok) {
    const status = result.error === "missing_open_api_token" ? 500 : result.error === "upstream_error" ? 502 : 504;
    return c.json(
      {
        message: "获取售后每日工作失败",
        error: result.error,
        upstreamStatus: result.upstreamStatus,
        detail: result.detail,
        attempts: result.attempts
      },
      status
    );
  }

  return c.json(result.payload);
});
```

Mount both routes in `server/boss-shuju/src/index.ts`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:unit -- tests/sealos-work-board-source.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add server/boss-shuju/src/services/open-api-client.ts server/boss-shuju/src/routes/mobile-workflow.ts server/boss-shuju/src/routes/mobile-aftersales.ts server/boss-shuju/src/index.ts tests/sealos-work-board-source.test.ts
git commit -m "feat: proxy mobile work boards from sealos backend"
```

---

### Task 5: Update Frontend to Use Sealos Backend

**Files:**
- Modify: `components/mobile/mobile-boss-dashboard.tsx`
- Modify: `components/mobile/mobile-boss-login.tsx`
- Modify: `.env.example`
- Test: `tests/mobile-sealos-api-base.test.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_BOSS_API_BASE`
- Produces: frontend helper `buildBossApiUrl(path: string): string`

- [ ] **Step 1: Write the failing source test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile frontend Sealos API base", () => {
  it("uses the public Sealos backend API base with credentialed requests", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-dashboard.tsx"),
      "utf8"
    );
    const loginSource = readFileSync(
      join(process.cwd(), "components", "mobile", "mobile-boss-login.tsx"),
      "utf8"
    );

    expect(dashboardSource).toContain("NEXT_PUBLIC_BOSS_API_BASE");
    expect(dashboardSource).toContain('credentials: "include"');
    expect(loginSource).toContain("NEXT_PUBLIC_BOSS_API_BASE");
    expect(loginSource).toContain('credentials: "include"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/mobile-sealos-api-base.test.ts`

Expected: FAIL because frontend still fetches relative API routes.

- [ ] **Step 3: Add frontend API URL helper**

Add this helper in both mobile components or extract it to `lib/mobile-api-client.ts`:

```ts
function buildBossApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_BOSS_API_BASE?.replace(/\/$/, "") ?? "";
  return `${base}${path}`;
}
```

Update fetch calls:

```ts
fetch(buildBossApiUrl(`/api/mobile/stats/monthly?month=${month}`), {
  credentials: "include"
});
```

```ts
fetch(buildBossApiUrl("/api/mobile/workflow/daily-monitor"), {
  credentials: "include"
});
```

```ts
fetch(buildBossApiUrl(`/api/mobile/aftersales/daily-records?date=${encodeURIComponent(aftersalesDate)}`), {
  credentials: "include"
});
```

In login:

```ts
fetch(buildBossApiUrl("/api/mobile/login"), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ password })
});
```

- [ ] **Step 4: Update `.env.example`**

Add:

```text
NEXT_PUBLIC_BOSS_API_BASE=https://jxdlmtjubdkn.sealosbja.site
```

Move server-only variables into a clearly labeled Sealos backend section.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit -- tests/mobile-sealos-api-base.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/mobile/mobile-boss-dashboard.tsx components/mobile/mobile-boss-login.tsx .env.example tests/mobile-sealos-api-base.test.ts
git commit -m "feat: point mobile frontend at sealos backend"
```

---

### Task 6: Adjust Vercel Route Protection and Environment Cleanup

**Files:**
- Modify: `proxy.ts`
- Modify: `app/api/mobile/*/route.ts` or remove after final cutover
- Test: `tests/mobile-route-protection.test.ts`

**Interfaces:**
- Consumes: Sealos backend auth as source of truth
- Produces: Vercel app no longer protects or serves `/api/mobile/*` business data

- [ ] **Step 1: Update route protection expectation**

Modify `tests/mobile-route-protection.test.ts` so it expects:

```ts
expect(source).toContain('matcher: ["/mobile/:path*", "/stats"]');
expect(source).not.toContain("/api/mobile/stats/monthly");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/mobile-route-protection.test.ts`

Expected: FAIL because `proxy.ts` still protects `/api/mobile/stats/monthly`.

- [ ] **Step 3: Update `proxy.ts`**

Keep page protection if the project still wants `/mobile` redirect behavior, but remove Vercel API protection for migrated endpoints:

```ts
export const config = {
  matcher: ["/mobile/:path*", "/stats"]
};
```

If `/mobile/login` must always be reachable while Sealos owns auth, ensure `proxy.ts` allows `/mobile/login`.

- [ ] **Step 4: Decide route handler deletion**

After production confirms Sealos endpoints are live, delete or leave deprecated Vercel API route handlers. Prefer deleting migrated handlers to avoid accidental use:

- `app/api/mobile/login/route.ts`
- `app/api/mobile/stats/monthly/route.ts`
- `app/api/mobile/workflow/daily-monitor/route.ts`
- `app/api/mobile/aftersales/daily-records/route.ts`

Keep deletion in a separate commit after production verification.

- [ ] **Step 5: Run route protection test**

Run: `npm run test:unit -- tests/mobile-route-protection.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add proxy.ts tests/mobile-route-protection.test.ts
git commit -m "chore: let sealos own mobile API auth"
```

---

### Task 7: Deploy to Sealos and Verify Production

**Files:**
- Modify only deployment scripts or docs if the existing Sealos projects require them.

**Interfaces:**
- Consumes: built backend package from `server/boss-shuju`
- Produces: live backend at `https://jxdlmtjubdkn.sealosbja.site`

- [ ] **Step 1: Prepare Sealos environment variables**

Configure these on the Sealos service:

```text
PORT=8789
NODE_ENV=production
MONGODB_URI=在 Sealos 环境变量面板填写生产 MongoDB 连接串，不写入仓库
MOBILE_DASHBOARD_PASSWORD=在 Sealos 环境变量面板填写手机看板登录密码，不写入仓库
MOBILE_SESSION_SECRET=在 Sealos 环境变量面板填写随机长密钥，不写入仓库
BOSS_WEB_ORIGIN=https://www.yujinkeji.fun
CHENGSHANG_OPEN_API_BASES=在 Sealos 环境变量面板填写开放 API 地址列表，不写入仓库
CHENGSHANG_OPEN_API_TOKEN=在 Sealos 环境变量面板填写开放 API Token，不写入仓库
CHENGSHANG_OPEN_API_INSECURE_TLS_BASES=仅可信自签备用入口需要时在 Sealos 环境变量面板填写
```

- [ ] **Step 2: Build locally before upload**

Run:

```bash
cd server/boss-shuju
npm install
npm run build
```

Expected: build exits 0.

- [ ] **Step 3: Upload or pull code on Sealos**

On Sealos, place the backend package in root folder `boss-shuju` and install production dependencies:

```bash
cd ~/boss-shuju
npm install --omit=dev
npm run build
npm run start
```

Expected: process listens on port `8789`.

- [ ] **Step 4: Verify health endpoint**

Run:

```bash
curl -i https://jxdlmtjubdkn.sealosbja.site/healthz
```

Expected: HTTP 200 with `{"ok":true}`.

- [ ] **Step 5: Verify login**

Run:

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$env:MOBILE_DASHBOARD_PASSWORD\"}" \
  https://jxdlmtjubdkn.sealosbja.site/api/mobile/login
```

Expected: HTTP 200, `Set-Cookie: mobile_dashboard_session=...`.

- [ ] **Step 6: Verify monthly stats**

Run:

```bash
curl -i -b cookies.txt "https://jxdlmtjubdkn.sealosbja.site/api/mobile/stats/monthly?month=2026-06"
```

Expected: HTTP 200 with `monthlyPointAmount`, `dailyRepaymentRows`, `onlineShopCounts`.

- [ ] **Step 7: Verify work boards**

Run:

```bash
curl -i -b cookies.txt "https://jxdlmtjubdkn.sealosbja.site/api/mobile/workflow/daily-monitor"
curl -i -b cookies.txt "https://jxdlmtjubdkn.sealosbja.site/api/mobile/aftersales/daily-records?date=2026-06-25"
```

Expected: HTTP 200 with work-board payloads or clear upstream error JSON.

- [ ] **Step 8: Commit deployment notes**

```bash
git add docs/superpowers/specs/2026-07-02-sealos-mobile-backend-migration-design.md docs/superpowers/plans/2026-07-02-sealos-mobile-backend-migration.md
git commit -m "docs: plan sealos mobile backend migration"
```

---

### Task 8: Push Frontend and Clean Vercel Variables

**Files:**
- Modify: Vercel project environment only after production verification.

**Interfaces:**
- Consumes: live Sealos backend
- Produces: Vercel frontend that only needs public backend base

- [ ] **Step 1: Configure Vercel frontend variable**

Set:

```text
NEXT_PUBLIC_BOSS_API_BASE=https://jxdlmtjubdkn.sealosbja.site
```

Use `https://api.yujinkeji.fun` instead if that domain is bound before cutover.

- [ ] **Step 2: Push frontend changes**

Run:

```bash
git push origin main
```

Expected: GitHub `main` updates and Vercel deploy starts.

- [ ] **Step 3: Verify browser behavior**

Open `https://www.yujinkeji.fun/mobile` on desktop and phone. Confirm:

- Login succeeds.
- KPI cards show total, platform repayment, city repayment, and online shop counts.
- Daily repayment list loads.
- Operation work progress loads.
- Aftersales daily work loads and date filter works.
- Network panel shows data requests going to Sealos backend.

- [ ] **Step 4: Remove Vercel server-only variables**

Only after Step 3 passes, remove these from Vercel:

```text
MONGODB_URI
CHENGSHANG_OPEN_API_BASE
CHENGSHANG_OPEN_API_BASES
CHENGSHANG_OPEN_API_INSECURE_TLS_BASES
CHENGSHANG_OPEN_API_TOKEN
OPEN_API_TOKEN
MOBILE_DASHBOARD_PASSWORD
MOBILE_SESSION_SECRET
```

- [ ] **Step 5: Final verification**

Run:

```bash
npm run test:unit
npm run build
```

Expected: all tests pass and Next.js production build succeeds.

Then verify production `/mobile` once more after Vercel redeploy.
