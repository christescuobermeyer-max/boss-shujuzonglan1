# 非手机代码归档

本目录保存桌面数据大屏、Tauri 工程、旧 Next.js API、重复的根目录后端实现、历史原型及其测试。它们不参与当前 Vercel 手机 Web 构建，也不保证移动后的相对导入仍可直接运行。

当前生产入口只有：

- 根目录 Next.js：`/`、`/mobile`、`/mobile/login`
- `server/boss-shuju`：手机业务 Hono API

归档代码仅用于历史追溯。恢复某个历史应用时，应从 Git 历史或本目录复制到独立分支，不要重新加入手机 Web 构建。
