# 2026-06-22 22:44 - mobile-spec-review

## 用户原始需求
- 用户要求调用一个子代理 review `docs/superpowers/specs/2026-06-22-mobile-boss-quick-view-design.md`。

## 本次理解
- 需要让独立子代理只读审查 spec，不修改文件。
- 审查重点是 Next.js 16/Vercel 可行性、密码保护、数据泄露风险、StatsMonthlyPayload 对齐、每日回款列表口径、测试策略和验收遗漏。

## 本次完成情况
### 已完成
- 启动子代理 `Kuhn` 对移动端老板快看版 spec 做只读 review。
- 收到 7 条 finding：2 条高风险、5 条中风险。
- 验证 review 反馈后，修订 spec 以补齐认证边界、桌面密码 fallback 风险、登录路由规则、session cookie 签名、每日回款列表语义、排名数据源和验证矩阵。

### 未完成
- 尚未进入实施计划。
- 尚未实现 `/mobile` 页面或认证代码。
- 尚未运行测试或构建。

### 阻塞/待确认
- 需要用户 review 修订后的 spec，再决定是否进入 implementation plan。

## 修改文件
- `docs/superpowers/specs/2026-06-22-mobile-boss-quick-view-design.md`
- `docs/memory/2026-06-22-224459-mobile-spec-review.md`

## 验证证据
- 命令/方法：子代理只读 review；本地 `rg` 检查占位词；本地 `rg` 检查新增认证和验证条款。
- 结果：spec 中无 `TBD`、`TODO`、placeholder 等占位词；能检索到 `/api/stats/monthly` 保护、`MOBILE_SESSION_SECRET`、`Session Cookie`、`npm run build` 和手机视口验证条款。
- 无法验证项：未运行测试和构建，因为本次仍处于 spec 阶段。

## 需求与约束变化
- 公网部署时 `/stats` 和 `/api/stats/monthly` 也必须受同一 Web session 保护。
- Mobile Web 使用 `MOBILE_DASHBOARD_PASSWORD` 和 `MOBILE_SESSION_SECRET`，不得把桌面源码 fallback 密码当成真实密码来源。
- 每日回款列表的“本月全部”定义为现有统计派生出的 active daily summary rows，不补 synthetic zero rows。

## 下一步
- 请用户 review 修订后的 spec。
- 用户确认后，使用 `writing-plans` 写实施计划。

## 风险与注意事项
- 认证边界是实施阶段最高风险点，不能只保护页面而不保护数据 API。
- Vercel 环境变量必须配置完整，否则登录或数据加载应 fail closed。
