import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const assetsDir = path.join(rootDir, "scripts", "assets");
const resourcesDir = path.join(rootDir, "src-tauri", "resources");
const nodeRuntimeDir = path.join(resourcesDir, "node-runtime");
const desktopRuntimeDir = path.join(resourcesDir, "desktop-runtime");

async function ensureExists(targetPath) {
  await access(targetPath);
}

async function prepareLoaderPage() {
  await rm(distDir, { force: true, recursive: true });
  await mkdir(distDir, { recursive: true });

  await cp(
    path.join(assetsDir, "desktop-loader.html"),
    path.join(distDir, "index.html")
  );
  await cp(
    path.join(assetsDir, "desktop-loader.css"),
    path.join(distDir, "desktop-shell.css")
  );
}

async function prepareStandaloneRuntime() {
  const standaloneDir = path.join(rootDir, ".next", "standalone");
  const staticDir = path.join(rootDir, ".next", "static");
  const publicDir = path.join(rootDir, "public");
  const envLocalPath = path.join(rootDir, ".env.local");

  await ensureExists(standaloneDir);
  await ensureExists(staticDir);

  await rm(resourcesDir, { force: true, recursive: true });
  await mkdir(nodeRuntimeDir, { recursive: true });

  await cp(process.execPath, path.join(nodeRuntimeDir, "node.exe"));
  await cp(standaloneDir, desktopRuntimeDir, { recursive: true });
  await cp(staticDir, path.join(desktopRuntimeDir, ".next", "static"), {
    recursive: true
  });

  try {
    await cp(publicDir, path.join(desktopRuntimeDir, "public"), {
      recursive: true
    });
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  try {
    await cp(envLocalPath, path.join(desktopRuntimeDir, ".env.local"));
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }
}

await prepareLoaderPage();
await prepareStandaloneRuntime();
