# 新签解约运营汇总接口与前端替换开发文档

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前前端“解约”展示板块从旧的“当月解约排行”替换为新接口返回的“运营汇总”数据，并在当前 Sealos 后端实现 `shops` 集合直连统计接口。

**Architecture:** Sealos 后端新增一个受手机看板登录态保护的接口，读取同一个 MongoDB `shops` 集合，按 `month=YYYY-MM` 计算“上月 + 本月签约店铺中，本月解约”的运营汇总。Next.js 前端通过现有 `NEXT_PUBLIC_BOSS_API_BASE` 访问 Sealos 后端，把原来的“运营解约店铺数”板块替换为“新签解约运营汇总”板块。

**Tech Stack:** Next.js 16 + React 19 前端，Sealos Hono + TypeScript + Mongoose 后端，Vitest 单元测试。

## 需求确认

- 用户要移除当前“解约”板块前端展示的旧接口数据。
- 用户要将该位置替换为新接口输出的“运营汇总”数据。
- 新接口还未开发，需要在当前 Sealos 后端实现并连接正式 MongoDB。
- 新接口参考文档：`F:/tuosir90-claude-code/biaodanguanli-dianpuluru-xin/docs/plans/2026-07-02-recent-signed-termination-api-spec.md`。
- 新接口核心口径不是“当月全部解约”，而是“上月 + 本月签约店铺中，在本月解约”的运营汇总。
- 前端替换位置是桌面统计页右侧当前“运营解约店铺数”板块，即 `components/stats/dashboard-overview-section.tsx` 中 `termination-panel-shell` 内的 `CountRankPanel`。
- 当前手机看板登录鉴权已迁移到 Sealos；新接口应复用 Sealos 后端登录态保护，避免在 Vercel 上重新依赖 MongoDB 或敏感变量。

## Global Constraints

- 所有日期范围按中国时区 `Asia/Shanghai` 计算。
- `month` 参数必须是 `YYYY-MM`，月份范围必须为 `01` 到 `12`。
- 不传 `month` 时默认当前中国时区月份。
- 数据库只使用正式 `MONGODB_URI` 指向的 MongoDB。
- 集合名称固定为 `shops`。
- 空运营名统一归为 `未分配`。
- 统计签约范围为上月第一天 `00:00:00 +08:00` 到下月第一天之前。
- 统计解约范围为本月第一天 `00:00:00 +08:00` 到下月第一天之前。
- `shopStatus` 必须等于 `已解约` 且 `terminationDate` 在本月范围内，才计入解约数量。
- 前端展示 `terminationRate` 时使用整数百分比，例如 `Math.round(rate * 100) + "%"`.
- 不能把 Sealos 后端依赖纳入 Vercel 根项目构建。
- 不提交真实 `MONGODB_URI`、登录密码、Session Secret、开放 API Token 或 SSH 私钥。

---

## File Structure

- Create: `server/boss-shuju/src/lib/stats/recent-signed-termination.ts`
  - 负责月份校验、上海时区日期范围、运营汇总、店铺明细构建和排序。
- Create: `server/boss-shuju/src/services/recent-signed-termination-service.ts`
  - 负责查询 `Shop` 模型并调用纯函数生成响应。
- Create: `server/boss-shuju/src/routes/recent-signed-termination.ts`
  - 暴露 `GET /api/termination/recent-signed-stats?month=YYYY-MM`，复用 Sealos 登录态鉴权。
- Modify: `server/boss-shuju/src/index.ts`
  - 注册新路由。
- Modify: `lib/mobile-api-client.ts`
  - 复用现有 Sealos API Base，增加新签解约接口 URL 构造函数。
- Create: `lib/stats/recent-signed-termination-types.ts`
  - 前端共享响应类型。
- Create: `components/stats/recent-signed-termination-panel.tsx`
  - 新的“运营汇总”展示组件，替换旧的 `CountRankPanel`。
- Modify: `components/stats/dashboard-overview-section.tsx`
  - 移除旧“运营解约店铺数”展示 props，接入新组件。
- Modify: `components/stats/monthly-stats-dashboard.tsx`
  - 随月份变化请求新接口，维护 loading/error/data 状态并传给概览区。
- Test: `tests/recent-signed-termination.test.ts`
  - 验证核心统计口径、排序、空运营归属和日期边界。
- Test: `tests/recent-signed-termination-source.test.ts`
  - 验证 Sealos 后端新增接口、前端从 Sealos API Base 拉取数据、旧解约排行不再作为该板块数据源。

---

## API Contract

### Request

```text
GET /api/termination/recent-signed-stats?month=YYYY-MM
```

### 400 Response

```json
{
  "message": "month 参数无效"
}
```

### 200 Response

```ts
type RecentSignedTerminationStatsResponse = {
  month: string;
  signedMonthRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  twoMonthSignedRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  totalTerminatedCount: number;
  twoMonthSignedShopCount: number;
  operatorCount: number;
  operatorStats: Array<{
    operatorName: string;
    count: number;
    twoMonthSignedShopCount: number;
    terminationRate: number;
  }>;
  shops: Array<{
    id: string;
    shopName: string;
    merchantId: string;
    deliveryPlatform: string;
    operatorName: string;
    contractSignedDate: string;
    terminationDate: string;
    terminationCooperationDays: number | null;
  }>;
};
```

---

## Task 1: 后端统计纯函数

**Files:**
- Create: `server/boss-shuju/src/lib/stats/recent-signed-termination.ts`
- Test: `tests/recent-signed-termination.test.ts`

**Interfaces:**
- Produces: `resolveRecentSignedTerminationMonth(monthParam: string | null): RecentSignedTerminationRange`
- Produces: `buildRecentSignedTerminationStats(month: string, shops: RecentSignedTerminationShopRow[]): RecentSignedTerminationStatsResponse`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  buildRecentSignedTerminationStats,
  resolveRecentSignedTerminationMonth
} from "../server/boss-shuju/src/lib/stats/recent-signed-termination";

describe("recent signed termination stats", () => {
  it("按上月加本月签约范围统计本月解约运营汇总", () => {
    const result = buildRecentSignedTerminationStats("2026-06", [
      {
        _id: "a",
        shopName: "A",
        merchantId: "1001",
        deliveryPlatform: "美团",
        operatorName: "张三",
        contractSignedDate: new Date("2026-05-10T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-08T00:00:00+08:00"),
        terminationCooperationDays: 29
      },
      {
        _id: "b",
        shopName: "B",
        merchantId: "1002",
        deliveryPlatform: "饿了么",
        operatorName: "张三",
        contractSignedDate: new Date("2026-06-03T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-20T00:00:00+08:00"),
        terminationCooperationDays: 18
      },
      {
        _id: "c",
        shopName: "C",
        merchantId: "1003",
        deliveryPlatform: "美团",
        operatorName: "",
        contractSignedDate: new Date("2026-05-15T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-12T00:00:00+08:00"),
        terminationCooperationDays: 28
      },
      {
        _id: "d",
        shopName: "D",
        merchantId: "1004",
        deliveryPlatform: "美团",
        operatorName: "李四",
        contractSignedDate: new Date("2026-04-28T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-06-12T00:00:00+08:00"),
        terminationCooperationDays: 45
      },
      {
        _id: "e",
        shopName: "E",
        merchantId: "1005",
        deliveryPlatform: "饿了么",
        operatorName: "王五",
        contractSignedDate: new Date("2026-05-15T00:00:00+08:00"),
        shopStatus: "已解约",
        terminationDate: new Date("2026-07-01T00:00:00+08:00"),
        terminationCooperationDays: 48
      },
      {
        _id: "f",
        shopName: "F",
        merchantId: "1006",
        deliveryPlatform: "美团",
        operatorName: "赵六",
        contractSignedDate: new Date("2026-06-15T00:00:00+08:00"),
        shopStatus: "正常",
        terminationDate: null,
        terminationCooperationDays: null
      }
    ]);

    expect(result.twoMonthSignedShopCount).toBe(5);
    expect(result.totalTerminatedCount).toBe(3);
    expect(result.operatorStats).toEqual([
      { operatorName: "张三", count: 2, twoMonthSignedShopCount: 2, terminationRate: 1 },
      { operatorName: "未分配", count: 1, twoMonthSignedShopCount: 1, terminationRate: 1 },
      { operatorName: "王五", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 },
      { operatorName: "赵六", count: 0, twoMonthSignedShopCount: 1, terminationRate: 0 }
    ]);
    expect(result.shops.map((shop) => shop.shopName)).toEqual(["B", "C", "A"]);
  });

  it("拒绝无效 month 参数", () => {
    expect(() => resolveRecentSignedTerminationMonth("2026-13")).toThrow("month 参数无效");
    expect(() => resolveRecentSignedTerminationMonth("2026-6")).toThrow("month 参数无效");
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm run test:unit -- tests/recent-signed-termination.test.ts`

Expected: FAIL because `server/boss-shuju/src/lib/stats/recent-signed-termination.ts` does not exist.

- [ ] **Step 3: Implement pure functions**

Create `server/boss-shuju/src/lib/stats/recent-signed-termination.ts` with:

```ts
export type RecentSignedTerminationShopRow = {
  _id?: unknown;
  shopName?: string;
  merchantId?: string;
  deliveryPlatform?: string;
  operatorName?: string;
  contractSignedDate?: Date | string | null;
  shopStatus?: string;
  terminationDate?: Date | string | null;
  terminationCooperationDays?: number | null;
};

export type RecentSignedTerminationStatsResponse = {
  month: string;
  signedMonthRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  twoMonthSignedRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  totalTerminatedCount: number;
  twoMonthSignedShopCount: number;
  operatorCount: number;
  operatorStats: Array<{
    operatorName: string;
    count: number;
    twoMonthSignedShopCount: number;
    terminationRate: number;
  }>;
  shops: Array<{
    id: string;
    shopName: string;
    merchantId: string;
    deliveryPlatform: string;
    operatorName: string;
    contractSignedDate: string;
    terminationDate: string;
    terminationCooperationDays: number | null;
  }>;
};

export type RecentSignedTerminationRange = {
  month: string;
  signedMonthRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  twoMonthSignedRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  terminationDateRange: {
    startDate: string;
    endDate: string;
  };
  twoMonthSignedStart: Date;
  twoMonthSignedEnd: Date;
};

function normalizeText(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function operatorOf(shop: RecentSignedTerminationShopRow) {
  return normalizeText(shop.operatorName) || "未分配";
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function parseMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("month 参数无效");
  }

  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));
  if (!Number.isInteger(year) || monthNumber < 1 || monthNumber > 12) {
    throw new Error("month 参数无效");
  }

  return { year, monthNumber };
}

function monthValue(year: number, monthIndexZeroBased: number) {
  const date = new Date(Date.UTC(year, monthIndexZeroBased, 1));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

function dateKey(year: number, monthIndexZeroBased: number, day: number) {
  const date = new Date(Date.UTC(year, monthIndexZeroBased, day));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

function shanghaiBoundary(year: number, monthIndexZeroBased: number, day: number) {
  return new Date(Date.UTC(year, monthIndexZeroBased, day, -8, 0, 0, 0));
}

function formatShanghaiDateKey(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(date);
}

function isInClosedDateKeyRange(date: string, start: string, end: string) {
  return Boolean(date) && date >= start && date <= end;
}

export function resolveRecentSignedTerminationMonth(monthParam: string | null): RecentSignedTerminationRange {
  const now = new Date();
  const currentShanghaiMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit"
  }).format(now);
  const month = normalizeText(monthParam) || currentShanghaiMonth;
  const { year, monthNumber } = parseMonth(month);
  const monthIndex = monthNumber - 1;

  const startMonth = monthValue(year, monthIndex - 1);
  const endMonth = monthValue(year, monthIndex);
  const signedStartDate = dateKey(year, monthIndex - 1, 1);
  const terminationStartDate = dateKey(year, monthIndex, 1);
  const nextMonthStartDate = dateKey(year, monthIndex + 1, 1);
  const signedEndDate = dateKey(year, monthIndex + 1, 0);

  return {
    month,
    signedMonthRange: {
      startMonth,
      endMonth,
      startDate: signedStartDate,
      endDate: signedEndDate
    },
    twoMonthSignedRange: {
      startMonth,
      endMonth,
      startDate: signedStartDate,
      endDate: signedEndDate
    },
    terminationDateRange: {
      startDate: terminationStartDate,
      endDate: dateKey(year, monthIndex + 1, 0)
    },
    twoMonthSignedStart: shanghaiBoundary(year, monthIndex - 1, 1),
    twoMonthSignedEnd: shanghaiBoundary(year, monthIndex + 1, 1)
  };
}

export function buildRecentSignedTerminationStats(
  monthParam: string,
  shops: RecentSignedTerminationShopRow[]
): RecentSignedTerminationStatsResponse {
  const range = resolveRecentSignedTerminationMonth(monthParam);

  const twoMonthSignedShops = shops.filter((shop) => {
    const signedDateKey = formatShanghaiDateKey(shop.contractSignedDate);
    return isInClosedDateKeyRange(
      signedDateKey,
      range.twoMonthSignedRange.startDate,
      range.twoMonthSignedRange.endDate
    );
  });

  const terminatedShops = twoMonthSignedShops.filter((shop) => {
    if (normalizeText(shop.shopStatus) !== "已解约") return false;

    const signedDateKey = formatShanghaiDateKey(shop.contractSignedDate);
    const terminationDateKey = formatShanghaiDateKey(shop.terminationDate);

    return (
      isInClosedDateKeyRange(
        signedDateKey,
        range.signedMonthRange.startDate,
        range.signedMonthRange.endDate
      ) &&
      isInClosedDateKeyRange(
        terminationDateKey,
        range.terminationDateRange.startDate,
        range.terminationDateRange.endDate
      )
    );
  });

  const totalByOperator = new Map<string, number>();
  for (const shop of twoMonthSignedShops) {
    const operatorName = operatorOf(shop);
    totalByOperator.set(operatorName, (totalByOperator.get(operatorName) ?? 0) + 1);
  }

  const terminatedByOperator = new Map<string, number>();
  for (const shop of terminatedShops) {
    const operatorName = operatorOf(shop);
    terminatedByOperator.set(operatorName, (terminatedByOperator.get(operatorName) ?? 0) + 1);
  }

  const operatorStats = Array.from(
    new Set([...totalByOperator.keys(), ...terminatedByOperator.keys()])
  )
    .map((operatorName) => {
      const count = terminatedByOperator.get(operatorName) ?? 0;
      const twoMonthSignedShopCount = totalByOperator.get(operatorName) ?? 0;
      return {
        operatorName,
        count,
        twoMonthSignedShopCount,
        terminationRate:
          twoMonthSignedShopCount === 0 ? 0 : count / twoMonthSignedShopCount
      };
    })
    .sort(
      (left, right) =>
        right.count - left.count ||
        right.twoMonthSignedShopCount - left.twoMonthSignedShopCount ||
        left.operatorName.localeCompare(right.operatorName, "zh-CN")
    );

  const detailRows = terminatedShops
    .map((shop) => ({
      id: normalizeText(shop._id) || normalizeText(shop.merchantId),
      shopName: normalizeText(shop.shopName),
      merchantId: normalizeText(shop.merchantId),
      deliveryPlatform: normalizeText(shop.deliveryPlatform),
      operatorName: operatorOf(shop),
      contractSignedDate: formatShanghaiDateKey(shop.contractSignedDate),
      terminationDate: formatShanghaiDateKey(shop.terminationDate),
      terminationCooperationDays:
        typeof shop.terminationCooperationDays === "number" &&
        Number.isFinite(shop.terminationCooperationDays)
          ? shop.terminationCooperationDays
          : null
    }))
    .sort(
      (left, right) =>
        right.terminationDate.localeCompare(left.terminationDate) ||
        left.shopName.localeCompare(right.shopName, "zh-CN")
    );

  return {
    month: range.month,
    signedMonthRange: range.signedMonthRange,
    twoMonthSignedRange: range.twoMonthSignedRange,
    totalTerminatedCount: detailRows.length,
    twoMonthSignedShopCount: twoMonthSignedShops.length,
    operatorCount: operatorStats.length,
    operatorStats,
    shops: detailRows
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- tests/recent-signed-termination.test.ts`

Expected: PASS.

---

## Task 2: Sealos 后端接口

**Files:**
- Create: `server/boss-shuju/src/services/recent-signed-termination-service.ts`
- Create: `server/boss-shuju/src/routes/recent-signed-termination.ts`
- Modify: `server/boss-shuju/src/index.ts`
- Test: `tests/recent-signed-termination-source.test.ts`

**Interfaces:**
- Consumes: `resolveRecentSignedTerminationMonth`
- Consumes: `buildRecentSignedTerminationStats`
- Produces: `getRecentSignedTerminationStats(monthParam: string | null): Promise<RecentSignedTerminationStatsResponse>`
- Produces route: `GET /api/termination/recent-signed-stats?month=YYYY-MM`

- [ ] **Step 1: Write source tests**

```ts
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("recent signed termination route source", () => {
  it("Sealos 后端注册新签解约运营汇总接口", () => {
    const indexSource = read("server/boss-shuju/src/index.ts");
    const routeSource = read("server/boss-shuju/src/routes/recent-signed-termination.ts");

    expect(indexSource).toContain("recentSignedTerminationRoute");
    expect(routeSource).toContain("/api/termination/recent-signed-stats");
    expect(routeSource).toContain("authMiddleware");
    expect(routeSource).toContain("month 参数无效");
  });

  it("服务层只查询 shops 两个月签约候选集", () => {
    const serviceSource = read("server/boss-shuju/src/services/recent-signed-termination-service.ts");

    expect(serviceSource).toContain("Shop.find");
    expect(serviceSource).toContain("contractSignedDate");
    expect(serviceSource).toContain("$gte");
    expect(serviceSource).toContain("$lt");
    expect(serviceSource).toContain("buildRecentSignedTerminationStats");
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm run test:unit -- tests/recent-signed-termination-source.test.ts`

Expected: FAIL because route and service files do not exist.

- [ ] **Step 3: Create service**

Create `server/boss-shuju/src/services/recent-signed-termination-service.ts`:

```ts
import {
  buildRecentSignedTerminationStats,
  resolveRecentSignedTerminationMonth,
  type RecentSignedTerminationShopRow,
  type RecentSignedTerminationStatsResponse
} from "../lib/stats/recent-signed-termination.js";
import { Shop } from "../models/shop.js";

export async function getRecentSignedTerminationStats(
  monthParam: string | null
): Promise<RecentSignedTerminationStatsResponse> {
  const range = resolveRecentSignedTerminationMonth(monthParam);

  const shops = await Shop.find({
    contractSignedDate: {
      $gte: range.twoMonthSignedStart,
      $lt: range.twoMonthSignedEnd
    }
  })
    .select({
      _id: 1,
      shopName: 1,
      merchantId: 1,
      deliveryPlatform: 1,
      operatorName: 1,
      contractSignedDate: 1,
      shopStatus: 1,
      terminationDate: 1,
      terminationCooperationDays: 1
    })
    .lean<RecentSignedTerminationShopRow[]>();

  return buildRecentSignedTerminationStats(range.month, shops);
}
```

- [ ] **Step 4: Create route**

Create `server/boss-shuju/src/routes/recent-signed-termination.ts`:

```ts
import { Hono } from "hono";
import { connectMongo } from "../db/mongodb.js";
import { authMiddleware } from "../middleware/auth.js";
import { getRecentSignedTerminationStats } from "../services/recent-signed-termination-service.js";

export const recentSignedTerminationRoute = new Hono();

recentSignedTerminationRoute.get(
  "/api/termination/recent-signed-stats",
  authMiddleware,
  async (c) => {
    try {
      await connectMongo();
      const payload = await getRecentSignedTerminationStats(c.req.query("month") ?? null);
      return c.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取新签解约统计失败";
      if (message === "month 参数无效") {
        return c.json({ message }, 400);
      }

      console.error("recent signed termination stats exception", {
        message,
        name: error instanceof Error ? error.name : "UnknownError",
        stack: error instanceof Error ? error.stack : undefined
      });
      return c.json({ message: "获取新签解约统计失败" }, 500);
    }
  }
);
```

- [ ] **Step 5: Register route**

Modify `server/boss-shuju/src/index.ts`:

```ts
import { recentSignedTerminationRoute } from "./routes/recent-signed-termination.js";
```

Add route registration:

```ts
app.route("/", recentSignedTerminationRoute);
```

- [ ] **Step 6: Run tests and backend build**

Run:

```powershell
npm run test:unit -- tests/recent-signed-termination-source.test.ts tests/recent-signed-termination.test.ts
cd server/boss-shuju
npm run build
```

Expected: all PASS and backend TypeScript build succeeds.

---

## Task 3: 前端 API Client 与类型

**Files:**
- Create: `lib/stats/recent-signed-termination-types.ts`
- Modify: `lib/mobile-api-client.ts`
- Test: `tests/recent-signed-termination-source.test.ts`

**Interfaces:**
- Produces: `buildRecentSignedTerminationStatsUrl(month: string): string`
- Produces type: `RecentSignedTerminationStatsResponse`

- [ ] **Step 1: Extend source test**

Append to `tests/recent-signed-termination-source.test.ts`:

```ts
describe("recent signed termination frontend source", () => {
  it("前端通过 Sealos API Base 请求新签解约接口", () => {
    const clientSource = read("lib/mobile-api-client.ts");

    expect(clientSource).toContain("buildRecentSignedTerminationStatsUrl");
    expect(clientSource).toContain("/api/termination/recent-signed-stats");
    expect(clientSource).toContain("NEXT_PUBLIC_BOSS_API_BASE");
  });
});
```

- [ ] **Step 2: Create frontend type file**

Create `lib/stats/recent-signed-termination-types.ts`:

```ts
export type RecentSignedTerminationOperatorStat = {
  operatorName: string;
  count: number;
  twoMonthSignedShopCount: number;
  terminationRate: number;
};

export type RecentSignedTerminationStatsResponse = {
  month: string;
  signedMonthRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  twoMonthSignedRange: {
    startMonth: string;
    endMonth: string;
    startDate: string;
    endDate: string;
  };
  totalTerminatedCount: number;
  twoMonthSignedShopCount: number;
  operatorCount: number;
  operatorStats: RecentSignedTerminationOperatorStat[];
  shops: Array<{
    id: string;
    shopName: string;
    merchantId: string;
    deliveryPlatform: string;
    operatorName: string;
    contractSignedDate: string;
    terminationDate: string;
    terminationCooperationDays: number | null;
  }>;
};
```

- [ ] **Step 3: Add client URL helper**

Modify `lib/mobile-api-client.ts`:

```ts
export function buildRecentSignedTerminationStatsUrl(month: string) {
  return buildBossApiUrl(`/api/termination/recent-signed-stats?month=${encodeURIComponent(month)}`);
}
```

- [ ] **Step 4: Run source test**

Run: `npm run test:unit -- tests/recent-signed-termination-source.test.ts`

Expected: PASS.

---

## Task 4: 前端替换“解约”板块

**Files:**
- Create: `components/stats/recent-signed-termination-panel.tsx`
- Modify: `components/stats/dashboard-overview-section.tsx`
- Modify: `components/stats/monthly-stats-dashboard.tsx`
- Test: `tests/recent-signed-termination-source.test.ts`

**Interfaces:**
- Consumes: `RecentSignedTerminationStatsResponse`
- Consumes: `buildRecentSignedTerminationStatsUrl(month)`
- Produces UI title: `新签解约运营汇总`

- [ ] **Step 1: Extend source test**

Append to `tests/recent-signed-termination-source.test.ts`:

```ts
describe("recent signed termination dashboard replacement", () => {
  it("桌面解约位置替换为新签解约运营汇总组件", () => {
    const overviewSource = read("components/stats/dashboard-overview-section.tsx");
    const dashboardSource = read("components/stats/monthly-stats-dashboard.tsx");
    const panelSource = read("components/stats/recent-signed-termination-panel.tsx");

    expect(overviewSource).toContain("RecentSignedTerminationPanel");
    expect(overviewSource).not.toContain('title="运营解约店铺数"');
    expect(dashboardSource).toContain("buildRecentSignedTerminationStatsUrl");
    expect(panelSource).toContain("新签解约运营汇总");
    expect(panelSource).toContain("两个月总数");
    expect(panelSource).toContain("解约率");
  });
});
```

- [ ] **Step 2: Create panel component**

Create `components/stats/recent-signed-termination-panel.tsx`:

```tsx
import { ChartPanel } from "@/components/stats/chart-panel";
import type { RecentSignedTerminationStatsResponse } from "@/lib/stats/recent-signed-termination-types";

function formatRate(value: number) {
  return `${Math.round(Number(value ?? 0) * 100)}%`;
}

export function RecentSignedTerminationPanel({
  data,
  loading,
  error
}: {
  data: RecentSignedTerminationStatsResponse | null;
  loading: boolean;
  error: string;
}) {
  const rows = data?.operatorStats ?? [];

  return (
    <ChartPanel
      title="新签解约运营汇总"
      subtitle={
        data
          ? `${data.twoMonthSignedRange.startMonth}-${data.twoMonthSignedRange.endMonth} 签约，本月解约`
          : "上月 + 本月签约店铺中的本月解约情况"
      }
    >
      {error ? <div className="mini-error">{error}</div> : null}
      <div className="recent-termination-summary">
        <div>
          <span>解约数量</span>
          <strong>{loading ? "..." : data?.totalTerminatedCount ?? 0}</strong>
        </div>
        <div>
          <span>两个月总数</span>
          <strong>{loading ? "..." : data?.twoMonthSignedShopCount ?? 0}</strong>
        </div>
        <div>
          <span>运营人数</span>
          <strong>{loading ? "..." : data?.operatorCount ?? 0}</strong>
        </div>
      </div>
      <div className="recent-termination-list">
        {loading ? (
          <div className="rank-empty">加载中...</div>
        ) : rows.length ? (
          rows.slice(0, 8).map((item, index) => (
            <div className="recent-termination-row" key={item.operatorName}>
              <div className="recent-termination-rank">{index + 1}</div>
              <div className="recent-termination-name">{item.operatorName}</div>
              <div className="recent-termination-metrics">
                <strong>{item.count}家</strong>
                <span>两个月总数 {item.twoMonthSignedShopCount}</span>
                <span>解约率 {formatRate(item.terminationRate)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rank-empty">暂无新签解约数据</div>
        )}
      </div>
    </ChartPanel>
  );
}
```

- [ ] **Step 3: Add CSS**

Modify `app/globals.css` and append:

```css
.recent-termination-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.recent-termination-summary > div {
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
  padding: 10px;
  background: rgba(248, 250, 252, 0.72);
}

.recent-termination-summary span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.recent-termination-summary strong {
  display: block;
  color: #0f172a;
  font-size: 18px;
  margin-top: 4px;
}

.recent-termination-list {
  display: grid;
  gap: 9px;
}

.recent-termination-row {
  display: grid;
  grid-template-columns: 28px minmax(72px, 1fr) minmax(130px, 1.4fr);
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.86);
}

.recent-termination-row:last-child {
  border-bottom: 0;
}

.recent-termination-rank {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  font-size: 12px;
  font-weight: 700;
}

.recent-termination-name {
  color: #0f172a;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-termination-metrics {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px 8px;
  color: #64748b;
  font-size: 12px;
}

.recent-termination-metrics strong {
  color: #dc2626;
}

.mini-error {
  margin-bottom: 10px;
  border-radius: 10px;
  padding: 9px 10px;
  background: rgba(254, 226, 226, 0.8);
  color: #b91c1c;
  font-size: 13px;
}
```

- [ ] **Step 4: Wire overview props**

Modify `components/stats/dashboard-overview-section.tsx`:

```tsx
import { RecentSignedTerminationPanel } from "@/components/stats/recent-signed-termination-panel";
import type { RecentSignedTerminationStatsResponse } from "@/lib/stats/recent-signed-termination-types";
```

Remove `CountRankPanel` import if unused.

Replace props:

```ts
recentSignedTerminationData: RecentSignedTerminationStatsResponse | null;
recentSignedTerminationLoading: boolean;
recentSignedTerminationError: string;
```

Remove `operatorTerminationTopItems` from props and signatures used only for the old panel.

Replace old panel:

```tsx
<RecentSignedTerminationPanel
  data={props.recentSignedTerminationData}
  loading={props.recentSignedTerminationLoading}
  error={props.recentSignedTerminationError}
/>
```

- [ ] **Step 5: Fetch new API in dashboard**

Modify `components/stats/monthly-stats-dashboard.tsx`:

```tsx
import { buildRecentSignedTerminationStatsUrl } from "@/lib/mobile-api-client";
import type { RecentSignedTerminationStatsResponse } from "@/lib/stats/recent-signed-termination-types";
```

Add state:

```tsx
const [recentSignedTerminationData, setRecentSignedTerminationData] =
  useState<RecentSignedTerminationStatsResponse | null>(null);
const [recentSignedTerminationLoading, setRecentSignedTerminationLoading] = useState(true);
const [recentSignedTerminationError, setRecentSignedTerminationError] = useState("");
```

Add effect:

```tsx
useEffect(() => {
  let active = true;
  setRecentSignedTerminationLoading(true);

  fetch(buildRecentSignedTerminationStatsUrl(month), { credentials: "include" })
    .then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "新签解约统计加载失败");
      return result as RecentSignedTerminationStatsResponse;
    })
    .then((result) => {
      if (!active) return;
      setRecentSignedTerminationData(result);
      setRecentSignedTerminationError("");
    })
    .catch((requestError: unknown) => {
      if (!active) return;
      setRecentSignedTerminationError(
        requestError instanceof Error ? requestError.message : "新签解约统计加载失败"
      );
      setRecentSignedTerminationData(null);
    })
    .finally(() => {
      if (active) setRecentSignedTerminationLoading(false);
    });

  return () => {
    active = false;
  };
}, [month]);
```

Pass new props to `DashboardOverviewSection`.

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm run test:unit -- tests/recent-signed-termination-source.test.ts tests/recent-signed-termination.test.ts
npm run build
```

Expected: PASS and production build succeeds.

---

## Task 5: Deploy and verify

**Files:**
- Modify only if deployment script paths need adjustment.

**Interfaces:**
- Sealos public endpoint: `https://jxdlmtjubdkn.sealosbja.site/api/termination/recent-signed-stats?month=YYYY-MM`
- Frontend page: `https://www.yujinkeji.fun/stats`

- [ ] **Step 1: Build Sealos backend locally**

Run:

```powershell
cd server/boss-shuju
npm run build
```

Expected: PASS.

- [ ] **Step 2: Sync backend to Sealos**

Use the existing Sealos SSH key and deployment pattern already used for `server/boss-shuju`. Restart PM2 process `boss-shuju` after copying source/build output.

- [ ] **Step 3: Smoke test backend**

Run authenticated smoke test with existing mobile login cookie:

```powershell
$base = "https://jxdlmtjubdkn.sealosbja.site"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri "$base/api/mobile/login" -Method Post -ContentType "application/json" -Body '{"password":"<local-password>"}' -WebSession $session
Invoke-WebRequest -Uri "$base/api/termination/recent-signed-stats?month=2026-06" -WebSession $session
```

Expected: 200 with `operatorStats`, `totalTerminatedCount`, and `twoMonthSignedShopCount`.

- [ ] **Step 4: Commit and push**

Run:

```powershell
git status --short
git add server/boss-shuju/src lib components app tests docs/superpowers/plans/2026-07-06-recent-signed-termination-dashboard.md
git commit -m "feat: add recent signed termination summary"
git push origin main
```

Expected: GitHub `main` updates and Vercel auto-deploy starts.

- [ ] **Step 5: Verify Vercel**

Confirm Vercel build uses latest commit and `npm run build` passes. Open `/stats`, choose the month, and verify the old “运营解约店铺数” panel is replaced by “新签解约运营汇总”.

---

## Acceptance Criteria

- `GET /api/termination/recent-signed-stats?month=2026-06` 返回 200。
- `month=2026-13` 和 `month=2026-6` 返回 400，响应 `{ "message": "month 参数无效" }`。
- 接口只统计 `contractSignedDate` 在上月 + 本月范围内的店铺。
- 解约数量只统计 `shopStatus = 已解约` 且 `terminationDate` 在统计月份内的店铺。
- 空 `operatorName` 归入 `未分配`。
- `operatorStats` 排序为：解约数量降序、两个月总数降序、运营名中文升序。
- 前端“解约”所在位置不再展示旧 `operatorTerminationTrend` 排行。
- 前端新板块展示运营、解约数量、两个月总数、解约率。
- 本地 `npm run build` 通过。
- `server/boss-shuju npm run build` 通过。
- 新代码推送后 Vercel 构建通过。

## Current Understanding Summary

这次不是新增一个页面，也不是保留旧“解约”排行再补充数据；目标是把现有解约展示位置替换成新的“新签解约运营汇总”。后端数据源以 MongoDB `shops` 集合为准，前端通过 Sealos 后端读取，Vercel 仍只负责展示页面和调用 Sealos API。
