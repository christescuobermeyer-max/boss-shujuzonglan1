# 全部日期回款趋势 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 BOSS 手机看板中增加受登录保护的全部日期每日总回款接口，并增加支持精简坐标、缩放和全视口最大化的历史趋势图表。

**Architecture:** Hono 后端通过独立服务复用现有 MongoDB 全量回款聚合，并使用现有三分钟内存缓存返回轻量 `{date, value}` 点集。Next.js 前端使用独立客户端组件加载一次该接口，专用 ECharts 组件负责全历史绘制和 dataZoom，覆盖层组件负责最大化、键盘关闭和页面滚动锁定。

**Tech Stack:** Next.js 16、React 19、TypeScript 5、Hono、Mongoose、MongoDB、ECharts 6、echarts-for-react、Vitest、lucide-react。

## Global Constraints

- 新图表是现有“每日回款趋势”的补充，不替换当前月度图表。
- 新接口固定为 `GET /api/mobile/stats/repayment-trend/all`，并使用现有 `mobileAuthMiddleware`。
- 图表只展示每日总回款，不拆分美团、饿了么或城市趋势线。
- 默认展示全部历史完整日期，不默认截取最近 30 天或 90 天。
- 排除最新一个可能尚未导入完整的日期。
- 新图表不受月度选择器影响，切换月份不重新请求全量趋势。
- 不修改现有月度回款统计公式，不修改 MongoDB schema，不迁移数据。
- 不返回原始商户、店铺、运营人员或导入行数据。
- 最大化和关闭按钮使用 `lucide-react` 的 `Maximize2` 与 `X`，不使用文字胶囊按钮或手绘 SVG。
- 新接口或新图表失败不能阻塞、隐藏或清空现有月度看板。

---

## File Map

- Modify `server/boss-shuju/src/lib/stats/daily-point-monthly.ts`: 导出可测试的全量趋势标准化函数，保留现有 MongoDB 聚合入口。
- Create `server/boss-shuju/src/services/all-repayment-trend-service.ts`: 构造接口响应并接入独立三分钟缓存。
- Modify `server/boss-shuju/src/routes/mobile-stats.ts`: 注册受认证保护的全量趋势路由。
- Modify `lib/mobile-contracts.ts`: 定义浏览器端全量趋势响应类型。
- Modify `lib/mobile-api-client.ts`: 构造全量趋势接口 URL。
- Modify `package.json` and `package-lock.json`: 增加 `lucide-react`。
- Modify `components/mobile/mobile-boss-charts.tsx`: 增加专用全历史回款趋势图表。
- Create `components/mobile/mobile-all-repayment-trend.tsx`: 独立管理请求、状态、最大化和滚动锁定。
- Modify `components/mobile/mobile-boss-dashboard.tsx`: 在月度回款趋势与每日开单趋势之间挂载新组件。
- Modify `app/globals.css`: 增加图标按钮、图表状态和全视口覆盖层样式。
- Create `tests/all-repayment-trend-backend.test.ts`: 覆盖后端标准化、服务响应、缓存和路由契约。
- Create `tests/mobile-all-repayment-trend.test.ts`: 覆盖前端契约、URL、图表配置、加载行为和页面位置。

---

### Task 1: 固化全量聚合输出并创建缓存服务

**Files:**
- Modify: `server/boss-shuju/src/lib/stats/daily-point-monthly.ts:21`
- Create: `server/boss-shuju/src/services/all-repayment-trend-service.ts`
- Create: `tests/all-repayment-trend-backend.test.ts`

**Interfaces:**
- Consumes: `DailyPointDetail.aggregate()`、`getCachedReportPayload()`、`setCachedReportPayload()`。
- Produces: `normalizeAllDailyPointAmountTrend(rows)`、`buildAllRepaymentTrendPayload(points)`、`getAllRepaymentTrendPayload()`、`AllRepaymentTrendPayload`。

- [ ] **Step 1: 编写失败测试，锁定最新日期排除和响应范围**

创建 `tests/all-repayment-trend-backend.test.ts`：

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeAllDailyPointAmountTrend } from "../server/boss-shuju/src/lib/stats/daily-point-monthly";
import { buildAllRepaymentTrendPayload } from "../server/boss-shuju/src/services/all-repayment-trend-service";

const readProjectFile = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts), "utf8");

describe("all repayment trend backend", () => {
  it("normalizes, sorts, merges matching dates, and removes the latest date", () => {
    expect(
      normalizeAllDailyPointAmountTrend([
        { date: "2026-07-12", value: 100 },
        { date: "2026/07/10", value: 30.126 },
        { date: "2026-07-11", value: 40 },
        { date: "2026-07-10", value: 9.874 },
        { date: "", value: 999 }
      ])
    ).toEqual([
      { date: "2026-07-10", value: 40 },
      { date: "2026-07-11", value: 40 }
    ]);
  });

  it("builds null bounds for empty data", () => {
    expect(buildAllRepaymentTrendPayload([])).toEqual({
      startDate: null,
      endDate: null,
      points: []
    });
  });

  it("uses the first and last sorted points as response bounds", () => {
    const points = [
      { date: "2025-01-27", value: 299.92 },
      { date: "2026-07-11", value: 5237.58 }
    ];

    expect(buildAllRepaymentTrendPayload(points)).toEqual({
      startDate: "2025-01-27",
      endDate: "2026-07-11",
      points
    });
  });

  it("uses an isolated three-minute report cache", () => {
    const source = readProjectFile(
      "server",
      "boss-shuju",
      "src",
      "services",
      "all-repayment-trend-service.ts"
    );

    expect(source).toContain('const CACHE_NAMESPACE = "all-repayment-trend"');
    expect(source).toContain('const CACHE_KEY = "all"');
    expect(source).toContain("getCachedReportPayload<AllRepaymentTrendPayload>");
    expect(source).toContain("fetchAllDailyPointAmountTrend()");
    expect(source).toContain("setCachedReportPayload(CACHE_NAMESPACE, CACHE_KEY, payload)");
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
npx vitest run tests/all-repayment-trend-backend.test.ts
```

Expected: FAIL，提示 `normalizeAllDailyPointAmountTrend` 或 `all-repayment-trend-service` 尚不存在。

- [ ] **Step 3: 导出全量趋势标准化函数**

在 `server/boss-shuju/src/lib/stats/daily-point-monthly.ts` 中将现有私有标准化函数替换为：

```ts
export function normalizeAllDailyPointAmountTrend(
  rows: AggregatedAmountTrendRow[]
): DailyAmountPoint[] {
  const totalByDate = new Map<string, number>();

  rows.forEach((row) => {
    const date = normalizeDateKey(row.date) || normalizeText(row.date);
    const amount = Number(row.value ?? 0);
    if (!date || !Number.isFinite(amount)) return;

    totalByDate.set(
      date,
      Number(((totalByDate.get(date) ?? 0) + amount).toFixed(2))
    );
  });

  return Array.from(totalByDate.entries())
    .map(([date, value]) => ({
      date,
      value: Number(value.toFixed(2))
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, -1);
}
```

并把 `fetchAllDailyPointAmountTrend()` 的最后一行改为：

```ts
return normalizeAllDailyPointAmountTrend(rows);
```

- [ ] **Step 4: 创建全量趋势服务**

创建 `server/boss-shuju/src/services/all-repayment-trend-service.ts`：

```ts
import {
  getCachedReportPayload,
  setCachedReportPayload
} from "../lib/report-cache.js";
import { fetchAllDailyPointAmountTrend } from "../lib/stats/daily-point-monthly.js";
import type { DailyAmountPoint } from "../lib/stats/daily-total-amount-trend.js";

const CACHE_NAMESPACE = "all-repayment-trend";
const CACHE_KEY = "all";

export type AllRepaymentTrendPayload = {
  startDate: string | null;
  endDate: string | null;
  points: DailyAmountPoint[];
};

export function buildAllRepaymentTrendPayload(
  points: DailyAmountPoint[]
): AllRepaymentTrendPayload {
  return {
    startDate: points.at(0)?.date ?? null,
    endDate: points.at(-1)?.date ?? null,
    points
  };
}

export async function getAllRepaymentTrendPayload() {
  const cached = getCachedReportPayload<AllRepaymentTrendPayload>(
    CACHE_NAMESPACE,
    CACHE_KEY
  );
  if (cached) return cached;

  const points = await fetchAllDailyPointAmountTrend();
  const payload = buildAllRepaymentTrendPayload(points);
  setCachedReportPayload(CACHE_NAMESPACE, CACHE_KEY, payload);
  return payload;
}
```

- [ ] **Step 5: 运行后端趋势测试和类型检查**

Run:

```powershell
npx vitest run tests/all-repayment-trend-backend.test.ts
npx tsc -p server/boss-shuju/tsconfig.json --noEmit
```

Expected: 两条命令均退出码 `0`；Vitest 显示 4 tests passed。

- [ ] **Step 6: 提交聚合服务**

```powershell
git add server/boss-shuju/src/lib/stats/daily-point-monthly.ts server/boss-shuju/src/services/all-repayment-trend-service.ts tests/all-repayment-trend-backend.test.ts
git commit -m "feat: add all repayment trend service"
```

---

### Task 2: 暴露受认证保护的全量趋势接口

**Files:**
- Modify: `server/boss-shuju/src/routes/mobile-stats.ts`
- Modify: `tests/all-repayment-trend-backend.test.ts`

**Interfaces:**
- Consumes: `connectMongo()`、`mobileAuthMiddleware`、`getAllRepaymentTrendPayload()`。
- Produces: `GET /api/mobile/stats/repayment-trend/all`，返回 `AllRepaymentTrendPayload`。

- [ ] **Step 1: 增加失败的路由契约测试**

在 `tests/all-repayment-trend-backend.test.ts` 的 `describe` 内追加：

```ts
it("registers an authenticated all repayment trend route", () => {
  const source = readProjectFile(
    "server",
    "boss-shuju",
    "src",
    "routes",
    "mobile-stats.ts"
  );

  expect(source).toMatch(
    /mobileStatsRoute\.get\(\s*"\/api\/mobile\/stats\/repayment-trend\/all"\s*,\s*mobileAuthMiddleware/
  );
  expect(source).toContain("await connectMongo()");
  expect(source).toContain("await getAllRepaymentTrendPayload()");
  expect(source).toContain("获取全部日期回款趋势失败");
});
```

- [ ] **Step 2: 运行测试并确认新用例失败**

Run:

```powershell
npx vitest run tests/all-repayment-trend-backend.test.ts
```

Expected: FAIL，路由源码不包含 `/api/mobile/stats/repayment-trend/all`。

- [ ] **Step 3: 注册路由并保持月度接口不变**

将 `server/boss-shuju/src/routes/mobile-stats.ts` 更新为：

```ts
import { Hono } from "hono";
import { connectMongo } from "../db/mongodb.js";
import { mobileAuthMiddleware } from "../middleware/auth.js";
import { getAllRepaymentTrendPayload } from "../services/all-repayment-trend-service.js";
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

mobileStatsRoute.get(
  "/api/mobile/stats/repayment-trend/all",
  mobileAuthMiddleware,
  async (c) => {
    try {
      await connectMongo();
      const payload = await getAllRepaymentTrendPayload();
      return c.json(payload);
    } catch {
      return c.json(
        {
          message: "获取全部日期回款趋势失败"
        },
        500
      );
    }
  }
);
```

- [ ] **Step 4: 运行路由测试和后端类型检查**

Run:

```powershell
npx vitest run tests/all-repayment-trend-backend.test.ts
npx tsc -p server/boss-shuju/tsconfig.json --noEmit
```

Expected: Vitest 显示 5 tests passed；TypeScript 退出码 `0`。

- [ ] **Step 5: 提交路由**

```powershell
git add server/boss-shuju/src/routes/mobile-stats.ts tests/all-repayment-trend-backend.test.ts
git commit -m "feat: expose all repayment trend api"
```

---

### Task 3: 增加前端响应契约和接口 URL

**Files:**
- Modify: `lib/mobile-contracts.ts`
- Modify: `lib/mobile-api-client.ts`
- Create: `tests/mobile-all-repayment-trend.test.ts`

**Interfaces:**
- Consumes: `buildBossApiUrl(path)`、现有 `DailyAmountPoint`。
- Produces: `AllRepaymentTrendResponse`、`buildAllRepaymentTrendUrl()`。

- [ ] **Step 1: 编写失败的浏览器契约测试**

创建 `tests/mobile-all-repayment-trend.test.ts`：

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildAllRepaymentTrendUrl } from "@/lib/mobile-api-client";

const readProjectFile = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts), "utf8");

describe("mobile all repayment trend", () => {
  it("builds the dedicated backend URL", () => {
    expect(buildAllRepaymentTrendUrl()).toMatch(
      /\/api\/mobile\/stats\/repayment-trend\/all$/
    );
  });

  it("defines the lightweight response contract", () => {
    const source = readProjectFile("lib", "mobile-contracts.ts");

    expect(source).toContain("export type AllRepaymentTrendResponse");
    expect(source).toContain("startDate: string | null");
    expect(source).toContain("endDate: string | null");
    expect(source).toContain("points: DailyAmountPoint[]");
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```powershell
npx vitest run tests/mobile-all-repayment-trend.test.ts
```

Expected: FAIL，`buildAllRepaymentTrendUrl` 尚未导出。

- [ ] **Step 3: 增加前端响应类型**

在 `lib/mobile-contracts.ts` 的 `DailyAmountPoint` 后增加：

```ts
export type AllRepaymentTrendResponse = {
  startDate: string | null;
  endDate: string | null;
  points: DailyAmountPoint[];
};
```

- [ ] **Step 4: 增加 URL 构造函数**

在 `lib/mobile-api-client.ts` 的 `buildBossApiUrl()` 后增加：

```ts
export function buildAllRepaymentTrendUrl() {
  return buildBossApiUrl("/api/mobile/stats/repayment-trend/all");
}
```

- [ ] **Step 5: 运行前端契约测试和类型检查**

Run:

```powershell
npx vitest run tests/mobile-all-repayment-trend.test.ts
npm run typecheck
```

Expected: Vitest 显示 2 tests passed；TypeScript 退出码 `0`。

- [ ] **Step 6: 提交前端契约**

```powershell
git add lib/mobile-contracts.ts lib/mobile-api-client.ts tests/mobile-all-repayment-trend.test.ts
git commit -m "feat: add all repayment trend client contract"
```

---

### Task 4: 创建支持精简坐标与缩放的全历史图表

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `components/mobile/mobile-boss-charts.tsx`
- Modify: `tests/mobile-all-repayment-trend.test.ts`

**Interfaces:**
- Consumes: `DailyAmountPoint[]`。
- Produces: `MobileAllRepaymentTrendChart({ data, height, fullScreen })`。

- [ ] **Step 1: 增加失败的图表配置测试**

在 `tests/mobile-all-repayment-trend.test.ts` 的 `describe` 内追加：

```ts
it("defines a full-history chart with concise axes and zoom controls", () => {
  const source = readProjectFile(
    "components",
    "mobile",
    "mobile-boss-charts.tsx"
  );

  expect(source).toContain("MobileAllRepaymentTrendChart");
  expect(source).toContain("hideOverlap: true");
  expect(source).toContain("shouldShowHistoryDateLabel");
  expect(source).toContain('type: "inside"');
  expect(source).toContain('type: "slider"');
  expect(source).toContain("start: 0");
  expect(source).toContain("end: 100");
  expect(source).toContain("symbol: \"none\"");
  expect(source).toContain("animation: false");
});
```

- [ ] **Step 2: 运行测试并确认图表用例失败**

Run:

```powershell
npx vitest run tests/mobile-all-repayment-trend.test.ts
```

Expected: FAIL，源码中不存在 `MobileAllRepaymentTrendChart`。

- [ ] **Step 3: 安装标准图标依赖**

Run:

```powershell
npm install lucide-react
```

Expected: `package.json` 和 `package-lock.json` 增加 `lucide-react`，命令退出码 `0`。

- [ ] **Step 4: 增加全历史图表组件**

在 `components/mobile/mobile-boss-charts.tsx` 中，保留现有两个图表不变，并在 `MobileAmountTrendChart` 后增加：

```tsx
function shouldShowHistoryDateLabel(params: {
  date: string;
  index: number;
  lastIndex: number;
  fullScreen: boolean;
}) {
  if (params.index === 0 || params.index === params.lastIndex) return true;
  if (!params.date.endsWith("-01")) return false;
  if (params.fullScreen) return true;

  const month = Number(params.date.slice(5, 7));
  return Number.isFinite(month) && (month - 1) % 3 === 0;
}

export function MobileAllRepaymentTrendChart({
  data,
  height = 220,
  fullScreen = false
}: {
  data: DailyAmountPoint[];
  height?: number | string;
  fullScreen?: boolean;
}) {
  const lastIndex = Math.max(0, data.length - 1);
  const option = {
    animation: false,
    grid: { top: 16, right: 12, bottom: 54, left: 48 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#ffffff",
      borderColor: "#eaeaea",
      textStyle: { color: "#000000", fontSize: 11 },
      formatter: (params: Array<{ name: string; value: number }>) =>
        `${params[0]?.name ?? ""}<br/>总回款：<b>¥${Number(
          params[0]?.value ?? 0
        ).toLocaleString("zh-CN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</b>`
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((item) => item.date),
      axisLabel: {
        color: "#999999",
        fontSize: 9,
        hideOverlap: true,
        interval: (index: number, value: string) =>
          shouldShowHistoryDateLabel({
            date: value,
            index,
            lastIndex,
            fullScreen
          }),
        formatter: (value: string) => value.slice(0, 7)
      },
      axisLine: { lineStyle: { color: "#eaeaea" } },
      axisTick: { show: false }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#999999",
        fontSize: 9,
        formatter: (value: number) => formatAxisAmount(value)
      },
      splitLine: { lineStyle: { color: "#f2f2f2", type: "dashed" } }
    },
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false
      },
      {
        type: "slider",
        start: 0,
        end: 100,
        height: 16,
        bottom: 6,
        borderColor: "#eaeaea",
        backgroundColor: "#f7f7f7",
        fillerColor: "rgba(0, 0, 0, 0.12)",
        handleSize: 12,
        showDetail: false
      }
    ],
    series: [
      {
        type: "line",
        data: data.map((item) => item.value),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#000000", width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(0, 0, 0, 0.12)" },
              { offset: 1, color: "rgba(0, 0, 0, 0)" }
            ]
          }
        }
      }
    ]
  };

  return <ReactECharts option={option} notMerge lazyUpdate style={{ height }} />;
}
```

- [ ] **Step 5: 运行图表测试和类型检查**

Run:

```powershell
npx vitest run tests/mobile-all-repayment-trend.test.ts
npm run typecheck
```

Expected: Vitest 显示 3 tests passed；TypeScript 退出码 `0`。

- [ ] **Step 6: 提交图表和依赖**

```powershell
git add package.json package-lock.json components/mobile/mobile-boss-charts.tsx tests/mobile-all-repayment-trend.test.ts
git commit -m "feat: add zoomable all repayment chart"
```

---

### Task 5: 对接独立加载组件、最大化覆盖层和页面布局

**Files:**
- Create: `components/mobile/mobile-all-repayment-trend.tsx`
- Modify: `components/mobile/mobile-boss-dashboard.tsx`
- Modify: `app/globals.css`
- Modify: `tests/mobile-all-repayment-trend.test.ts`

**Interfaces:**
- Consumes: `buildAllRepaymentTrendUrl()`、`AllRepaymentTrendResponse`、`MobileAllRepaymentTrendChart`、`Maximize2`、`X`。
- Produces: `MobileAllRepaymentTrend`，无 props，因此不会依赖或响应月度选择器变化。

- [ ] **Step 1: 增加失败的加载、最大化和页面顺序测试**

在 `tests/mobile-all-repayment-trend.test.ts` 的 `describe` 内追加：

```ts
it("loads the all-time trend independently with authenticated credentials", () => {
  const source = readProjectFile(
    "components",
    "mobile",
    "mobile-all-repayment-trend.tsx"
  );

  expect(source).toContain("buildAllRepaymentTrendUrl()");
  expect(source).toContain('credentials: "include"');
  expect(source).toContain('window.location.href = "/mobile/login"');
  expect(source).toContain('useEffect(() => {');
  expect(source).not.toContain("month:");
  expect(source).not.toContain("[month]");
});

it("provides accessible maximize and close controls", () => {
  const source = readProjectFile(
    "components",
    "mobile",
    "mobile-all-repayment-trend.tsx"
  );

  expect(source).toContain("Maximize2");
  expect(source).toContain("X");
  expect(source).toContain('aria-label="最大化全部日期回款趋势"');
  expect(source).toContain('aria-label="关闭全部日期回款趋势全屏"');
  expect(source).toContain('role="dialog"');
  expect(source).toContain('aria-modal="true"');
  expect(source).toContain('event.key !== "Escape"');
  expect(source).toContain('document.body.style.overflow = "hidden"');
  expect(source).toContain("previousOverflow");
});

it("shows explicit loading, empty, and failure states", () => {
  const source = readProjectFile(
    "components",
    "mobile",
    "mobile-all-repayment-trend.tsx"
  );

  expect(source).toContain("mobile-all-repayment-skeleton");
  expect(source).toContain("暂无全部日期回款数据");
  expect(source).toContain("全部日期回款趋势暂时无法加载");
});

it("places the all-time chart between monthly repayment and daily orders", () => {
  const source = readProjectFile(
    "components",
    "mobile",
    "mobile-boss-dashboard.tsx"
  );

  const monthlyTrendIndex = source.indexOf("每日回款趋势");
  const allTrendIndex = source.indexOf("<MobileAllRepaymentTrend />");
  const orderTrendIndex = source.indexOf("每日开单趋势");

  expect(monthlyTrendIndex).toBeGreaterThan(-1);
  expect(allTrendIndex).toBeGreaterThan(monthlyTrendIndex);
  expect(orderTrendIndex).toBeGreaterThan(allTrendIndex);
});

it("defines a full-viewport overlay without horizontal overflow", () => {
  const source = readProjectFile("app", "globals.css");

  expect(source).toContain(".mobile-all-repayment-overlay");
  expect(source).toContain("position: fixed");
  expect(source).toContain("inset: 0");
  expect(source).toContain("100dvh");
  expect(source).toContain("overflow: hidden");
});
```

- [ ] **Step 2: 运行测试并确认新用例失败**

Run:

```powershell
npx vitest run tests/mobile-all-repayment-trend.test.ts
```

Expected: FAIL，独立组件、覆盖层样式和页面挂载尚不存在。

- [ ] **Step 3: 创建独立加载和最大化组件**

创建 `components/mobile/mobile-all-repayment-trend.tsx`：

```tsx
"use client";

import { Maximize2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MobileAllRepaymentTrendChart } from "@/components/mobile/mobile-boss-charts";
import { buildAllRepaymentTrendUrl } from "@/lib/mobile-api-client";
import type { AllRepaymentTrendResponse } from "@/lib/mobile-contracts";

const EMPTY_PAYLOAD: AllRepaymentTrendResponse = {
  startDate: null,
  endDate: null,
  points: []
};

async function parseTrendResponse(response: Response) {
  if (response.status === 401) {
    window.location.href = "/mobile/login";
    return null;
  }

  const rawBody = await response.text();
  let result: unknown = null;
  try {
    result = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error("全部日期回款趋势暂时无法加载");
  }

  if (!response.ok) {
    throw new Error("全部日期回款趋势暂时无法加载");
  }

  return result as AllRepaymentTrendResponse;
}

export function MobileAllRepaymentTrend() {
  const titleId = useId();
  const maximizeButtonRef = useRef<HTMLButtonElement>(null);
  const [payload, setPayload] = useState<AllRepaymentTrendResponse>(EMPTY_PAYLOAD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullScreen, setFullScreen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(buildAllRepaymentTrendUrl(), {
      credentials: "include"
    })
      .then(parseTrendResponse)
      .then((result) => {
        if (!active || !result) return;
        setPayload(result);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "全部日期回款趋势暂时无法加载"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!fullScreen) return;

    const previousOverflow = document.body.style.overflow;
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setFullScreen(false);
      window.setTimeout(() => maximizeButtonRef.current?.focus(), 0);
    };

    document.body.style.overflow = "hidden";
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullScreen]);

  const closeFullScreen = () => {
    setFullScreen(false);
    window.setTimeout(() => maximizeButtonRef.current?.focus(), 0);
  };
  const dateRange =
    payload.startDate && payload.endDate
      ? `${payload.startDate} 至 ${payload.endDate}`
      : "完整历史回款走势";

  return (
    <section className="mobile-section mobile-all-repayment-section">
      <div className="mobile-section-head mobile-section-head-row">
        <div>
          <h2 id={titleId}>全部日期回款趋势</h2>
          <span>{dateRange}</span>
        </div>
        {payload.points.length > 0 ? (
          <button
            ref={maximizeButtonRef}
            type="button"
            className="mobile-icon-button"
            aria-label="最大化全部日期回款趋势"
            title="最大化"
            onClick={() => setFullScreen(true)}
          >
            <Maximize2 size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="mobile-all-repayment-skeleton mobile-skeleton" />
      ) : null}
      {!loading && error ? <div className="mobile-empty">{error}</div> : null}
      {!loading && !error && payload.points.length === 0 ? (
        <div className="mobile-empty">暂无全部日期回款数据</div>
      ) : null}
      {!loading && !error && payload.points.length > 0 ? (
        <div className="mobile-all-repayment-chart-shell">
          <MobileAllRepaymentTrendChart data={payload.points} />
        </div>
      ) : null}

      {fullScreen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="mobile-all-repayment-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <div className="mobile-all-repayment-overlay-head">
                <div>
                  <h2>全部日期回款趋势</h2>
                  <span>{dateRange}</span>
                </div>
                <button
                  type="button"
                  className="mobile-icon-button"
                  aria-label="关闭全部日期回款趋势全屏"
                  title="关闭"
                  autoFocus
                  onClick={closeFullScreen}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="mobile-all-repayment-overlay-chart">
                <MobileAllRepaymentTrendChart
                  data={payload.points}
                  height={Math.max(320, viewportHeight - 92)}
                  fullScreen
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </section>
  );
}
```

- [ ] **Step 4: 将组件挂载到确认的位置**

在 `components/mobile/mobile-boss-dashboard.tsx` 顶部增加：

```tsx
import { MobileAllRepaymentTrend } from "@/components/mobile/mobile-all-repayment-trend";
```

在现有“每日回款趋势”区块结束后、`每日开单趋势` 区块开始前增加：

```tsx
<MobileAllRepaymentTrend />
```

- [ ] **Step 5: 增加普通与全视口样式**

在 `app/globals.css` 的 `.mobile-section-head` 相关样式后增加：

```css
.mobile-icon-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-strong);
  border-radius: 7px;
  background: #ffffff;
  color: var(--text-strong);
  padding: 0;
  cursor: pointer;
}

.mobile-icon-button:hover {
  background: var(--bg-soft);
}

.mobile-icon-button:focus-visible {
  outline: 2px solid #000000;
  outline-offset: 2px;
}

.mobile-all-repayment-section {
  min-width: 0;
}

.mobile-all-repayment-chart-shell {
  min-width: 0;
  min-height: 220px;
  overflow: hidden;
}

.mobile-all-repayment-skeleton {
  width: 100%;
  height: 220px;
  border-radius: 6px;
}

.mobile-all-repayment-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #ffffff;
  padding: max(12px, env(safe-area-inset-top))
    max(12px, env(safe-area-inset-right))
    max(12px, env(safe-area-inset-bottom))
    max(12px, env(safe-area-inset-left));
}

.mobile-all-repayment-overlay-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding-bottom: 8px;
}

.mobile-all-repayment-overlay-head div {
  min-width: 0;
}

.mobile-all-repayment-overlay-head h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0;
}

.mobile-all-repayment-overlay-head span {
  display: block;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
}

.mobile-all-repayment-overlay-chart {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
```

- [ ] **Step 6: 运行前端测试和类型检查**

Run:

```powershell
npx vitest run tests/mobile-all-repayment-trend.test.ts
npm run typecheck
```

Expected: Vitest 显示 8 tests passed；TypeScript 退出码 `0`。

- [ ] **Step 7: 提交前端对接**

```powershell
git add components/mobile/mobile-all-repayment-trend.tsx components/mobile/mobile-boss-dashboard.tsx app/globals.css tests/mobile-all-repayment-trend.test.ts
git commit -m "feat: show all repayment trend on mobile"
```

---

### Task 6: 全量回归、云库只读验证和手机视口验收

**Files:**
- Modify only if verification finds a defect: files from Tasks 1-5 and their matching tests.

**Interfaces:**
- Consumes: 已完成的后端服务、路由、前端组件和样式。
- Produces: 通过全部自动化检查和手机视口验收的可部署功能。

- [ ] **Step 1: 运行全部单元测试**

Run:

```powershell
npm run test:unit
```

Expected: 所有测试文件和测试用例通过，退出码 `0`。

- [ ] **Step 2: 运行前后端类型检查**

Run:

```powershell
npm run typecheck
npx tsc -p server/boss-shuju/tsconfig.json --noEmit
```

Expected: 两条命令均无 TypeScript 错误并以退出码 `0` 结束。

- [ ] **Step 3: 运行生产构建**

Run:

```powershell
npm run build
npm --prefix server/boss-shuju run build
```

Expected: Next.js 和 Hono 后端构建均成功，退出码 `0`。

- [ ] **Step 4: 使用云数据库只读验证真实聚合结果**

在 `server/boss-shuju` 目录运行：

```powershell
@'
import mongoose from "mongoose";
import { getAllRepaymentTrendPayload } from "./src/services/all-repayment-trend-service.ts";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
await mongoose.connect(process.env.MONGODB_URI, {
  appName: "boss-shuju-all-trend-verification",
  maxPoolSize: 1,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
});

try {
  const payload = await getAllRepaymentTrendPayload();
  if (payload.points.length === 0) throw new Error("trend is empty");
  if (payload.startDate !== payload.points[0]?.date) {
    throw new Error("startDate does not match first point");
  }
  if (payload.endDate !== payload.points.at(-1)?.date) {
    throw new Error("endDate does not match last point");
  }
  if (
    payload.points.some(
      (point, index) => index > 0 && point.date <= payload.points[index - 1].date
    )
  ) {
    throw new Error("points are not strictly ascending");
  }

  console.log({
    pointCount: payload.points.length,
    startDate: payload.startDate,
    endDate: payload.endDate
  });
} finally {
  await mongoose.disconnect();
}
'@ | .\node_modules\.bin\tsx.cmd --env-file=..\..\.env.local -
```

Expected: 输出非零 `pointCount`、`startDate` 和 `endDate`；当前数据基线约为 531 点、首日 `2025-01-27`、末日为最近完整日期。命令不得输出 MongoDB URI 或原始明细。

- [ ] **Step 5: 启动前端并进行 390px 与 430px 浏览器验收**

Run:

```powershell
npm run dev
```

Expected: Next.js 输出可访问的本地 URL，默认通常为 `http://localhost:3000`。使用项目配置的登录密码进入 `/mobile`，不得在终端、截图或测试记录中输出密码。

使用 Playwright 或等效真实浏览器依次检查 390x844 和 430x932：

- 新图表位于月度回款趋势之后、每日开单趋势之前。
- 默认图表非空且从完整历史起点绘制到最近完整日期。
- 横轴标签稀疏、纵轴金额紧凑，无水平页面溢出。
- tooltip 显示完整日期和两位小数金额。
- 拖动、双指或滚轮缩放以及 slider 均可改变观察范围。
- 最大化按钮打开全视口覆盖层，图表不是空白画布。
- 390px 和 430px 下标题、日期范围、关闭按钮和图表不重叠。
- 关闭按钮与 `Escape` 都能退出，退出后页面可以继续滚动。
- 切换月度选择器后，全量图表不显示加载骨架，不发起第二次全量趋势请求。

- [ ] **Step 6: 检查差异和工作区边界**

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` 无输出；只出现本计划实施产生的文件变化以及用户原有的未跟踪文件，不修改 `desktop-tauri/` 或 Excel 文件。

- [ ] **Step 7: 提交验证阶段发现的必要修复**

只有 Step 1-6 发现并修复缺陷时执行：

```powershell
git add package.json package-lock.json app/globals.css components/mobile/mobile-all-repayment-trend.tsx components/mobile/mobile-boss-charts.tsx components/mobile/mobile-boss-dashboard.tsx lib/mobile-api-client.ts lib/mobile-contracts.ts server/boss-shuju/src/lib/stats/daily-point-monthly.ts server/boss-shuju/src/routes/mobile-stats.ts server/boss-shuju/src/services/all-repayment-trend-service.ts tests/all-repayment-trend-backend.test.ts tests/mobile-all-repayment-trend.test.ts
git commit -m "fix: finalize all repayment trend"
```

Expected: 提交只包含本功能修复，不包含 `desktop-tauri/` 或任何 Excel 文件。若没有修复，不创建空提交。

---

## Completion Checklist

- [ ] `GET /api/mobile/stats/repayment-trend/all` 经过现有移动端认证保护。
- [ ] 接口响应只包含 `startDate`、`endDate` 和每日 `{date, value}` 点。
- [ ] 聚合沿用美团结算日期、饿了么记录日期、现有去重键和最新日期排除规则。
- [ ] 后端使用独立三分钟缓存。
- [ ] 前端全量趋势只加载一次，不依赖月份 state。
- [ ] 图表默认展示全部历史，坐标精简，tooltip 金额精确。
- [ ] dataZoom、最大化、关闭、`Escape`、旋转 resize 和滚动恢复均工作。
- [ ] 新图表错误不影响原月度看板。
- [ ] 根测试、前后端类型检查、两端构建和云库只读验证通过。
- [ ] 390px 与 430px 视口无重叠、无横向溢出、图表非空。
