# Sealos 手机看板后端迁移设计

## 背景

当前 `boss-shujuzonglan1` 的手机看板运行在 Vercel 前端项目中，部分接口由 Next.js Route Handler 直接连接 MongoDB，另外两个工作看板接口由 Vercel 代理到现有开放 API。线上已经出现过 Vercel 到上游接口 `ECONNRESET`、开放 API Token 校验失败、自动部署触发不稳定等问题。

本次迁移目标是把 BOSS 手机看板的后端能力整体迁移到 Sealos 云服务器新服务 `boss-shuju`，包括登录鉴权、月度统计、运营工作进度、售后每日工作。迁移后 Vercel 只承担手机网页前端渲染和静态资源交付，所有业务数据请求走 Sealos 后端。

敏感配置只进入服务器环境变量，不写入仓库文档和代码。原始需求文档中包含 SSH 私钥、MongoDB 密码和开放 API Token，不应提交到 Git。

## 推荐方案

采用 Hono + TypeScript 构建独立后端服务，第一阶段运行在 Node.js，端口 `8789`。Hono 的路由和中间件足够轻量，适合承接当前手机看板接口；Node.js 运行时可以最大化复用现有 Mongoose、统计计算和日期逻辑，降低一次性迁移风险。

Bun 可以作为第二阶段优化项。当前项目依赖 Mongoose 和现有 TypeScript 模块，直接切到 Bun 需要额外验证 MongoDB 驱动、Mongoose 连接池、构建脚本和生产进程管理。第一阶段先完成稳定迁移，后续再用压测数据决定是否 Bun 化。

## 服务边界

### Vercel 前端

- 保留 `/mobile` 页面和手机端 React UI。
- 保留 `/mobile/login` 页面，但登录提交目标改为 Sealos 后端。
- 不再在 Vercel Route Handler 中直接连接 MongoDB。
- 不再在 Vercel 中保存 MongoDB URI、开放 API Token 等后端敏感变量。
- 只保留非敏感的后端地址配置，例如 `NEXT_PUBLIC_BOSS_API_BASE`。

### Sealos 后端

- 新目录：`boss-shuju`。
- 服务端口：`8789`。
- 对外地址：`https://jxdlmtjubdkn.sealosbja.site`。
- 承接手机看板全部后端接口。
- 负责登录鉴权、Session Cookie 签发、MongoDB 查询、工作看板开放 API 聚合或内化。
- 统一返回 JSON 错误结构，便于手机端展示明确错误。

## 登录鉴权设计

登录鉴权一起迁移到 Sealos 后端。

### Cookie 策略

推荐使用服务端签名 Cookie：

- Cookie 名称沿用：`mobile_dashboard_session`。
- Cookie 内容：base64url JSON payload + HMAC-SHA256 签名。
- 有效期沿用：12 小时。
- `HttpOnly: true`。
- `Secure: true`。
- `SameSite: Lax`。
- `Path: /`。

如果前端域名仍是 `www.yujinkeji.fun`，后端域名是 `jxdlmtjubdkn.sealosbja.site`，浏览器会把它们视为跨站。跨站 Cookie 在移动浏览器和未来浏览器策略下更容易失效。因此生产环境建议把 Sealos 后端绑定为同站子域名，例如：

- 前端：`https://www.yujinkeji.fun`
- 后端：`https://api.yujinkeji.fun`
- Cookie Domain：`.yujinkeji.fun`

如果暂时不能绑定 API 子域名，则前端需要用 `credentials: "include"` 调用 Sealos，后端必须配置明确 CORS，且 Cookie 行为需要在手机浏览器实测。

### 登录接口

`POST /api/mobile/login`

请求：

```json
{
  "password": "用户输入的密码"
}
```

成功响应：

```json
{
  "ok": true
}
```

失败响应：

```json
{
  "message": "密码错误，请重新输入",
  "error": "invalid_password"
}
```

### 会话校验

所有业务接口都通过 Hono 中间件校验 `mobile_dashboard_session`。未登录统一返回：

```json
{
  "message": "未授权访问",
  "error": "unauthorized"
}
```

## 当前手机看板接口清单

### `POST /api/mobile/login`

用途：手机看板登录。

当前实现：`app/api/mobile/login/route.ts`。

迁移策略：迁移到 Sealos Hono 服务，Vercel 前端改为请求 Sealos 后端。

依赖环境变量：

- `MOBILE_DASHBOARD_PASSWORD`
- `MOBILE_SESSION_SECRET`

### `GET /api/mobile/stats/monthly`

用途：手机看板主数据。

当前实现：`app/api/mobile/stats/monthly/route.ts` + `lib/mobile-monthly-stats-service.ts`。

请求参数：

- `month`：可选，格式 `YYYY-MM`。
- `dept`：可选，部门或城市筛选。

响应字段：

```ts
type MobileMonthlyStatsPayload = {
  month: string;
  monthlyShopCount: number;
  monthlyPointAmount: number;
  meituanMonthlyPointAmount: number;
  elemeMonthlyPointAmount: number;
  wuhanMonthlyPointAmount: number;
  yichangMonthlyPointAmount: number;
  monthlyTerminationCount: number;
  onlineShopCounts: {
    latestDate: string;
    totalCount: number;
    meituanCount: number;
    elemeCount: number;
  };
  dailyAmountTrend: Array<{ date: string; value: number }>;
  dailyRepaymentRows: Array<{
    date: string;
    dailyPointShopCount: number;
    totalAmount: number;
    meituanAmount: number;
    elemeAmount: number;
    wuhanAmount: number;
  }>;
  rankings: {
    sales: Array<{ name: string; value: number }>;
    operatorAmount: Array<{ name: string; value: number }>;
    operatorTermination: Array<{ name: string; value: number }>;
  };
};
```

MongoDB 集合：

- `shops`
- `daily_point_details`
- `online_shop_count_snapshots`

迁移策略：

- 复用现有统计逻辑。
- 抽出可共享的服务层，避免 Hono 后端直接依赖 Next.js Route Handler。
- 保留“未匹配店铺归入未分配”的平台实际回款口径，不在总回款和每日回款中过滤掉未匹配店铺。

### `GET /api/mobile/workflow/daily-monitor`

用途：手机看板底部“运营工作进度”。

当前实现：`app/api/mobile/workflow/daily-monitor/route.ts` 代理开放 API。

当前上游路径：

- `/api/open/workflow/daily-monitor`

响应字段：

```ts
type WorkflowDailyMonitorPayload = {
  operatorStats: Array<{
    operatorName: string;
    pendingShopCount: number;
    flowPendingShopCount: number;
    patrolPendingShopCount: number;
  }>;
  totalPendingShops: number;
  generatedAt: string;
};
```

迁移策略：

- 第一阶段：Sealos 后端继续调用已有开放 API，但调用发生在同一云服务器或更稳定网络环境中，避免 Vercel 海外链路重置。
- 第二阶段：如果开放 API 源码或数据库可用，把该聚合逻辑内化到 `boss-shuju`，减少服务间依赖。

### `GET /api/mobile/aftersales/daily-records`

用途：手机看板底部“售后每日工作”。

当前实现：`app/api/mobile/aftersales/daily-records/route.ts` 代理开放 API。

请求参数：

- `date`：可选，格式 `YYYY-MM-DD`。手机端默认传昨天。

当前上游路径：

- `/api/open/aftersales/daily-records`

响应字段：

```ts
type AftersalesDailyRecordsPayload = {
  dateKey: string;
  totalCount: number;
  employees: Array<{
    operatorName: string;
    actionCount: number;
    shopCount: number;
    records: Array<{
      shopName: string;
      merchantId: string;
      deliveryPlatform: string;
      shopStatus: string;
      actionType: string;
      actionLabel: string;
      operatorName: string;
      note: string;
      rechargeAmount?: number;
      conversionRate30d?: number;
      createdAt: string;
    }>;
  }>;
  generatedAt: string;
};
```

迁移策略：

- 第一阶段：Sealos 后端继续调用已有开放 API。
- 第二阶段：视后端数据来源决定是否直接连接客服或工作流数据库生成该 payload。

## 数据流

1. 用户打开 `https://www.yujinkeji.fun/mobile`。
2. 前端检查自身登录状态或直接请求 Sealos 后端业务接口。
3. 未登录时 Sealos 返回 `401 unauthorized`，前端跳转 `/mobile/login`。
4. 用户输入密码，前端请求 Sealos `POST /api/mobile/login`。
5. Sealos 校验密码，签发 `mobile_dashboard_session`。
6. 手机看板请求 Sealos：
   - `/api/mobile/stats/monthly`
   - `/api/mobile/workflow/daily-monitor`
   - `/api/mobile/aftersales/daily-records`
7. Sealos 连接 MongoDB 或调用内部开放 API，返回统一 JSON。
8. 前端只负责展示和错误提示。

## CORS 与域名

生产推荐配置：

- `BOSS_WEB_ORIGIN=https://www.yujinkeji.fun`
- `BOSS_API_BASE=https://api.yujinkeji.fun` 或当前 Sealos 公网地址。
- Hono CORS 只允许 `BOSS_WEB_ORIGIN`。
- `Access-Control-Allow-Credentials: true`。
- 前端 fetch 全部使用 `credentials: "include"`。

如果使用 `api.yujinkeji.fun`，Cookie 可以用 `.yujinkeji.fun` 做同站共享；如果使用 `sealosbja.site`，需要接受跨站 Cookie 的兼容性风险。

## 环境变量

### Sealos 后端必须配置

- `PORT=8789`
- `NODE_ENV=production`
- `MONGODB_URI`
- `MOBILE_DASHBOARD_PASSWORD`
- `MOBILE_SESSION_SECRET`
- `BOSS_WEB_ORIGIN`
- `CHENGSHANG_OPEN_API_BASES`
- `CHENGSHANG_OPEN_API_TOKEN`
- `CHENGSHANG_OPEN_API_INSECURE_TLS_BASES`：仅在可信自签入口必须启用时配置。

### Vercel 前端建议保留

- `NEXT_PUBLIC_BOSS_API_BASE`

### Vercel 前端迁移后可删除

在所有 API 都完成 Sealos 对接且生产验证通过后，可以删除：

- `MONGODB_URI`
- `CHENGSHANG_OPEN_API_BASE`
- `CHENGSHANG_OPEN_API_BASES`
- `CHENGSHANG_OPEN_API_INSECURE_TLS_BASES`
- `CHENGSHANG_OPEN_API_TOKEN`
- `OPEN_API_TOKEN`
- `MOBILE_DASHBOARD_PASSWORD`
- `MOBILE_SESSION_SECRET`

删除前必须确认 Vercel 已不再运行任何 `/api/mobile/*` 或 `/api/stats/monthly` 业务接口。

## 部署设计

Sealos `boss-shuju` 目录结构建议：

```text
boss-shuju/
  package.json
  tsconfig.json
  src/
    index.ts
    config/env.ts
    auth/session.ts
    middleware/auth.ts
    middleware/cors.ts
    routes/mobile-login.ts
    routes/mobile-stats.ts
    routes/mobile-workflow.ts
    routes/mobile-aftersales.ts
    services/mobile-monthly-stats-service.ts
    services/open-api-client.ts
    db/mongodb.ts
    models/shop.ts
    models/daily-point-detail.ts
    models/online-shop-count-snapshot.ts
```

生产进程建议：

- 使用 `npm run build` 输出 `dist`。
- 使用 `node dist/index.js` 启动。
- 如果 Sealos devbox 已有进程管理约定，沿用现有两个项目的启动方式。
- 健康检查：`GET /healthz` 返回 `{ "ok": true }`。

## 测试策略

### 单元测试

- Session 签名、过期、篡改校验。
- CORS origin 白名单。
- 月度统计 payload 字段兼容。
- 开放 API 客户端重试、401、超时、网络异常。

### 集成测试

- 未登录访问业务接口返回 401。
- 登录成功后业务接口返回数据。
- `/api/mobile/stats/monthly` 对 MongoDB 测试库返回当前手机端兼容结构。
- 工作看板和售后接口在开放 API 401 时返回可读错误。

### 生产验证

- 手机浏览器打开 `/mobile`，登录成功。
- KPI、每日回款、排行、运营工作进度、售后每日工作均能展示。
- 售后日期筛选可用。
- 浏览器 Network 中业务接口全部请求 Sealos 后端。
- Vercel 函数日志中不再出现 `/api/mobile/*` 数据代理请求。

## 风险与处理

- 跨域 Cookie 风险：优先绑定 `api.yujinkeji.fun`；临时使用 Sealos 域名时必须手机实测。
- MongoDB 内网地址风险：只有 Sealos 同 namespace 或网络可达时才能使用内网地址；否则使用公网 `dbconn` 地址。
- 开放 API Token 风险：Token 只放 Sealos 环境变量，不放 Vercel 和代码仓库。
- 统计口径风险：迁移时必须保留现有未匹配店铺“未分配”口径，防止总回款减少。
- 自动部署风险：Vercel 只部署前端，后端部署由 Sealos 单独管理，避免前后端部署机制混在一起。

## 验收标准

- Sealos `boss-shuju` 服务在 `8789` 端口启动成功。
- `GET /healthz` 正常返回。
- 手机看板登录由 Sealos 后端完成。
- 手机看板所有业务数据接口由 Sealos 后端返回。
- Vercel 前端不再需要 MongoDB 和开放 API Token。
- 生产环境 `/mobile` 能正常登录并展示全部数据。
- 本地单元测试和生产构建通过。
