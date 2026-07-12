# 手机 Web 项目归档与架构整理设计

## 背景

当前仓库已经以手机 Web 看板为主要产品形态，但仍同时保留桌面数据大屏、Tauri 桌面工程、旧 Next.js 后端接口和相关测试。多套运行入口共享或复制统计代码，导致项目边界不清晰，测试已经出现针对旧接口地址的失效断言，根 TypeScript 检查也被过期测试数据阻断。

本次整理的目标是在不改变手机页面视觉效果、数据口径和线上请求方式的前提下，把非手机端代码集中移动到归档目录，建立清晰的手机 Web 前端与 Hono 后端边界，并让有效测试、类型检查和生产构建重新成为可靠的质量门禁。

## 目标

- 保持 `/mobile` 和 `/mobile/login` 的页面结构、样式、交互及数据展示不变。
- 保持手机端通过 `NEXT_PUBLIC_BOSS_API_BASE` 调用 Sealos Hono 后端。
- 保持现有 Cookie 登录、月度统计、解约、工作流、售后、生图和资源统计行为。
- 将不参与手机 Web 生产运行的代码移动到 `archive/non-mobile/`。
- 明确手机前端、共享前端辅助代码和 Hono 后端的职责。
- 清理或归档只验证桌面功能、旧本地 API 或 Tauri 的测试。
- 修复保留测试中的过期断言和类型错误。
- 更新项目入口文档、架构文档、环境变量说明和验证命令。

## 非目标

- 不重新设计手机页面。
- 不改变统计业务口径、MongoDB 集合或 API 响应结构。
- 不在本次整理中将 Hono 后端改为 Bun。
- 不删除归档代码，也不重写历史原型。
- 不进行 workspace、monorepo 或共享 npm package 的大规模迁移。
- 不修改线上域名、Sealos 服务端口或外部网关地址。

## 推荐结构

```text
app/
  mobile/
  page.tsx
  layout.tsx
  globals.css
components/
  mobile/
lib/
  mobile-api-client.ts
  mobile-dashboard.ts
  mobile-work-boards.ts
  stats/                 # 仅保留手机前端直接依赖的纯类型和辅助函数
server/
  boss-shuju/            # Hono + MongoDB 手机业务后端
tests/                   # 仅保留手机 Web 和 Hono 边界相关测试
archive/
  non-mobile/
    desktop-dashboard/
    tauri/
    legacy-next-api/
    legacy-tests/
    prototypes/
docs/
  architecture/
  deployment/
  superpowers/
```

归档目录必须被根 TypeScript、Vitest、Next.js 和部署流程排除。归档后的代码仅作为历史参考，不保证可以在新位置直接运行。

## 归档边界

### 直接归档

- `desktop-tauri/`：完整移动到 `archive/non-mobile/tauri/`。
- `app/stats/`：桌面月度大屏入口。
- `components/stats/`：桌面大屏组件。
- `prototype-archive/`、`logo-原型图/`：历史原型和非运行资产。
- 只验证桌面布局、桌面文案、Tauri 脚手架的测试。
- 仅服务桌面大屏的 Next.js API、统计服务和类型。

### 需要导入图确认后归档

- `app/api/` 下的 Next.js Route Handler。
- `lib/stats/` 下同时可能被手机前端辅助代码引用的模块。
- 根目录 `models/` 和 `lib/mongodb.ts`。
- 与旧 Vercel 后端、旧 `/api/stats/monthly` 路径相关的测试。

判断规则是从 `app/mobile`、`components/mobile`、手机前端保留的 `lib` 文件及构建配置出发，递归追踪静态导入。被手机前端运行时或类型系统引用的文件必须保留；只被归档入口引用的文件随入口归档。

### 必须保留

- `app/mobile/`、`components/mobile/`。
- 手机登录页、手机首页和根路由重定向。
- `lib/mobile-api-client.ts`、`lib/mobile-dashboard.ts`、`lib/mobile-work-boards.ts`。
- 手机页面直接使用的月份、趋势类型和纯计算辅助函数。
- `server/boss-shuju/src` 下全部当前生产后端代码。
- 手机认证、API 地址、Sealos 后端和手机布局相关测试。

## 前端架构

手机前端继续由 Next.js App Router 提供页面和静态资源，不在 Vercel 端直接连接 MongoDB。

### 页面职责

- `/`：重定向到 `/mobile`。
- `/mobile/login`：向 Hono 后端提交密码。
- `/mobile`：展示手机看板，并在业务请求返回 `401` 时跳转登录页。

### 数据请求职责

`lib/mobile-api-client.ts` 是手机业务 API 地址的唯一入口：

- Sealos 后端接口统一通过 `buildBossApiUrl` 构建。
- 所有需要 Cookie 的请求继续使用 `credentials: "include"`。
- 生图和资源统计暂时保留现有独立外部网关地址。
- 不把业务请求改回 Vercel 本地 `/api`。

### 组件整理

本次不改变 JSX 结构和 CSS 选择器。可以在测试保护下将 `mobile-boss-dashboard.tsx` 中的请求逻辑提取为内部 hooks 或小型客户端模块，但只有在解决现有质量问题确实需要时才进行，避免整理工作演变成页面重写。

## 后端架构

`server/boss-shuju` 是手机业务的唯一自有后端，继续使用 Node.js、Hono、TypeScript 和 Mongoose。

后端负责：

- 登录密码校验和签名 Session Cookie。
- 月度经营统计和 MongoDB 查询。
- 新签解约统计。
- 工作流和售后开放 API 代理。
- CORS、认证中间件和健康检查。

Vercel 前端整理完成后不应再需要 `MONGODB_URI`、开放 API Token、手机密码或 Session Secret。前端原则上只保留 `NEXT_PUBLIC_BOSS_API_BASE`。

## 路由保护

跨域登录 Cookie 由 Sealos 后端持有，因此 Vercel 的 Next.js `proxy.ts` 无法直接校验该 Cookie 的有效性。本次不保留只保护旧 `/stats` 的代理规则。

手机数据安全由以下边界保证：

1. Hono 所有业务接口使用认证中间件。
2. 手机页面请求收到 `401` 后跳转 `/mobile/login`。
3. 页面源代码中不包含业务数据和服务端密钥。

若未来需要在页面返回前完成服务端认证，应通过同站 API 域名或服务端会话检查重新设计，不能复用当前失效的 `/stats` 代理规则。

## 测试策略

### 保留并修复

- 手机页面结构、文案和布局测试。
- 手机数据转换与排名逻辑测试。
- 手机认证 Token 测试。
- Sealos API 基地址和请求路径测试。
- Hono 后端源码边界测试。
- MongoDB 统计纯函数测试中仍被 Hono 后端使用的部分。

### 归档

- 桌面大屏组件和 CSS 源码测试。
- `/stats` 页面测试。
- Tauri 脚手架测试。
- 断言旧 Vercel 本地 API 路径且已不符合当前架构的测试。

测试不能通过简单删除失败断言来变绿。每个被保留的行为必须改成断言当前 Sealos API 构建方式或实际手机端契约。

## 构建和配置

- 根 `tsconfig.json` 只包含手机 Web 生产代码和有效测试，明确排除 `archive/` 与 `server/`。
- Vitest 只执行当前 `tests/` 下有效测试，不扫描归档目录。
- Next.js 生产构建不得读取归档代码。
- Hono 后端继续使用自己的 `tsconfig.json` 和构建脚本。
- 根 `package.json` 更新项目名称、说明或脚本时，不改变 Vercel 当前启动命令。

## 文档更新

新增或更新以下内容：

- 根 `README.md`：项目用途、快速启动、目录结构、验证命令。
- 手机架构文档：前端、Hono 后端、MongoDB 和外部 API 数据流。
- 部署文档：Vercel 与 Sealos 的职责和环境变量清单。
- `archive/non-mobile/README.md`：归档原因、内容和不可直接运行说明。
- 安全说明：敏感配置不得写入仓库，历史本地凭据必须轮换。

## 实施顺序

1. 建立当前手机入口和依赖清单。
2. 为归档边界、API 地址和构建排除规则补充失败测试。
3. 创建归档目录并分批移动明确的非手机代码。
4. 重新运行导入检查，处理剩余桌面专属文件。
5. 修复保留测试的旧 API 断言和 TypeScript fixture。
6. 清理只服务 `/stats` 的代理和本地后端入口。
7. 更新 README、架构、部署和归档文档。
8. 运行手机测试、TypeScript、Next.js 构建和 Hono 构建。
9. 使用手机宽度进行页面截图回归，确认无视觉变化或内容缺失。

## 验收标准

- `/`、`/mobile`、`/mobile/login` 路由保持可用。
- 手机页面关键文案、模块顺序、CSS 类名和数据请求保持兼容。
- 手机业务请求继续指向配置的 Sealos 后端。
- `archive/non-mobile/` 包含桌面、Tauri、旧 Next API 和历史实现。
- 根生产代码中不存在 `/stats` 入口和只服务桌面的组件。
- 根测试全部通过且不依赖归档文件。
- 根 TypeScript 检查通过。
- Next.js 生产构建通过。
- Hono 后端构建通过。
- 文档能够说明当前项目如何开发、测试和部署。
- Git 不新增任何密码、Token、数据库连接串或私钥。

## 风险控制

- 移动前使用静态导入搜索确认依赖，避免误移手机共享函数。
- 每批移动后运行针对性测试，不进行一次性大搬迁。
- 不修改手机 JSX 和 CSS，除非构建或测试证明必须修改。
- 归档而非删除，出现遗漏时可通过普通文件移动恢复。
- 不处理工作区中与本任务无关的 Excel 文件。

