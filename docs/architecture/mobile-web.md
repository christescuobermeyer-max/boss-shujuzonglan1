# 手机 Web 架构

## 边界

浏览器只加载根目录 Next.js 的手机页面。`server/boss-shuju` 使用 Hono、TypeScript 和 Mongoose，负责认证、MongoDB 统计和外部工作看板代理。Vercel 不再直接连接 MongoDB，也不再承载业务 API。

## 数据流

```text
Browser -> Next.js mobile UI -> Sealos Hono API -> MongoDB
                                      -> workflow/aftersales Open API
Browser -> gw.hbcsch.pw for generation/resource public statistics
```

手机请求统一通过 `lib/mobile-api-client.ts` 构建 Sealos 地址，并为认证请求设置 `credentials: "include"`。收到 `401` 时页面跳转 `/mobile/login`。

## API

- `POST /api/mobile/login`
- `GET /api/mobile/stats/monthly?month=YYYY-MM`
- `GET /api/termination/recent-signed-stats?month=YYYY-MM`
- `GET /api/mobile/workflow/daily-monitor`
- `GET /api/mobile/aftersales/daily-records?date=YYYY-MM-DD`

所有业务接口由 Hono `mobileAuthMiddleware` 保护；`/healthz` 不需要登录。

## 前端模块

- `components/mobile/mobile-boss-dashboard.tsx`：页面编排和加载状态。
- `components/mobile/mobile-boss-charts.tsx`：手机图表。
- `lib/mobile-api-client.ts`：请求地址。
- `lib/mobile-contracts.ts`：浏览器端 API 和图表类型。
- `lib/mobile-dashboard.ts`：服务端 payload 到卡片、趋势、排行的转换。
- `lib/mobile-work-boards.ts`：工作流和售后展示转换。
