# 呈尚策划 · BOSS 看板桌面版

这个目录是基于当前月度数据总览页面重构出的 Tauri 桌面工程。

## 目标

- 复用现有 Next.js 页面、统计接口与 MongoDB 统计逻辑
- 点击应用后直接展示最大化登录页，登录成功后继续进入同尺寸主界面
- 消除网页版本在大屏窗口中的左右留白

## 开发方式

1. 在当前目录安装依赖：

```bash
npm install
```

2. 启动桌面开发版：

```bash
npm run tauri:dev
```

Tauri 会先自动定位本机可用的 Visual Studio C++ 工具链，再拉起 `http://127.0.0.1:1420/` 的 Next 开发服务。应用会直接以最大化原生窗口显示登录页，验证密码通过后继续进入同尺寸主界面。

## 目录说明

- `app/`、`components/`、`lib/`、`models/`：从当前 Web 项目复制过来的页面与统计逻辑
- `app/desktop.css`：桌面模式专用的全宽布局覆盖
- `src-tauri/`：Tauri 宿主配置
- `scripts/build-tauri-shell.mjs`：生成桌面构建阶段使用的静态壳页面
- `scripts/tauri-with-vs.cmd` / `scripts/tauri-with-vs.ps1`：自动选择正确的 Visual Studio C++ 环境后再执行 Tauri

## 当前约束

- 当前目录优先保证 `tauri:dev` 的桌面开发体验
- `tauri:build` 已包含基础壳页面与窗口配置，后续如果要做完全离线的安装包，还需要继续把 Next 服务打包成桌面侧边车(sidecar)
- 如果本机执行 Rust/Tauri 构建时报 `excpt.h`、`msvcrt.lib` 等缺失，说明 Visual Studio C++ 工具链未安装完整，需要补齐 MSVC 头文件与标准库后再运行 `cargo check` 或 `npm run tauri:dev`
