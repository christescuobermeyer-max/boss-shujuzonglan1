# 手机 Web 部署

## Vercel 前端

仅配置：

```text
NEXT_PUBLIC_BOSS_API_BASE=https://jxdlmtjubdkn.sealosbja.site
```

不要在 Vercel 配置 `MONGODB_URI`、`MOBILE_DASHBOARD_PASSWORD`、`MOBILE_SESSION_SECRET` 或开放 API Token。

## Sealos Hono 后端

在 `server/boss-shuju/.env.example` 列出的变量全部配置在后端服务。服务监听 `8789`，公网地址为当前 Sealos API 地址。`BOSS_WEB_ORIGIN` 必须精确匹配 Vercel 页面来源，CORS 开启 credentials。

跨站部署时登录 Cookie 使用 `Secure; SameSite=None`，前端请求必须使用 `credentials: "include"`。生产切换域名后必须重新验证登录、刷新和过期 Cookie。

## 验证

1. `GET /healthz` 返回 `{ "ok": true }`。
2. 手机页面登录成功并能加载月度统计、排行、工作流和售后数据。
3. 浏览器 Network 中业务请求全部指向 Sealos。
4. 未登录请求返回 `401`，不会触发 MongoDB 查询。
5. Vercel 环境中不存在后端密钥。
