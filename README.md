# 呈尚策划 · BOSS 手机快看

当前项目只服务手机 Web 看板。根目录是 Next.js 手机前端，`server/boss-shuju` 是唯一自有业务后端；桌面大屏、Tauri、旧 Next API 和原型统一存放在 `archive/non-mobile/`。

## 开发

```powershell
npm install
npm run dev
npm run test:unit
npm run typecheck
npm run build
```

前端只需要 `.env.local` 中的 `NEXT_PUBLIC_BOSS_API_BASE`。真实数据库、登录密码、Session Secret 和开放 API Token 只配置在 Hono 服务环境中。

后端：

```powershell
cd server/boss-shuju
npm install
npm run build
npm run dev
```

接口健康检查为 `GET /healthz`。架构说明见 `docs/architecture/mobile-web.md`，部署说明见 `docs/deployment/mobile-web.md`。
