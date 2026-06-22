use std::{
  fs::{self, File},
  io,
  net::TcpStream,
  path::Path,
  process::{Child, Command, Stdio},
  sync::Mutex,
  thread,
  time::{Duration, Instant},
};

use tauri::{AppHandle, Manager};

const DESKTOP_SERVER_HOST: &str = "127.0.0.1";
const DESKTOP_SERVER_PORT: u16 = 3210;
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Default)]
pub struct DesktopServerState {
  pub child: Mutex<Option<Child>>,
}

pub fn launch_desktop_server(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  let state = app.state::<DesktopServerState>();
  if state.child.lock().expect("桌面服务锁异常").is_some() {
    return Ok(());
  }

  let resource_dir = app.path().resource_dir()?;
  let runtime_root = resource_dir.join("resources");
  let runtime_dir = runtime_root.join("desktop-runtime");
  let node_path = runtime_root.join("node-runtime").join("node.exe");

  if !runtime_dir.join("server.js").exists() {
    return Err("缺少桌面版 Next 运行时文件".into());
  }
  if !node_path.exists() {
    return Err("缺少桌面版 Node 运行时文件".into());
  }

  let log_dir = std::env::temp_dir().join("boss-shujuzonglan1");
  fs::create_dir_all(&log_dir)?;

  let stdout_log = File::create(log_dir.join("desktop-server.log"))?;
  let stderr_log = File::create(log_dir.join("desktop-server.err.log"))?;

  let mut command = Command::new(node_path);
  command
    .arg("server.js")
    .current_dir(&runtime_dir)
    .env("HOSTNAME", DESKTOP_SERVER_HOST)
    .env("PORT", DESKTOP_SERVER_PORT.to_string())
    .env("NODE_ENV", "production")
    .stdout(Stdio::from(stdout_log))
    .stderr(Stdio::from(stderr_log));

  inject_env_file(&mut command, &runtime_dir.join(".env.local"))?;

  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    command.creation_flags(CREATE_NO_WINDOW);
  }

  let child = command.spawn()?;
  *state.child.lock().expect("桌面服务锁异常") = Some(child);

  wait_for_server_ready()?;
  Ok(())
}

pub fn stop_desktop_server(app: &AppHandle) {
  let state = app.state::<DesktopServerState>();
  let mut child = {
    let mut guard = state.child.lock().expect("桌面服务锁异常");
    guard.take()
  };

  if let Some(child_process) = child.as_mut() {
    let _ = child_process.kill();
    let _ = child_process.wait();
  }
}

fn inject_env_file(command: &mut Command, env_path: &Path) -> io::Result<()> {
  if !env_path.exists() {
    return Ok(());
  }

  for line in fs::read_to_string(env_path)?.lines() {
    let trimmed = line.trim();
    if trimmed.is_empty() || trimmed.starts_with('#') {
      continue;
    }

    let Some((key, value)) = trimmed.split_once('=') else {
      continue;
    };

    command.env(key.trim(), strip_wrapping_quotes(value.trim()));
  }

  Ok(())
}

fn strip_wrapping_quotes(value: &str) -> String {
  let trimmed = value.trim();
  if trimmed.len() >= 2 {
    let first = trimmed.chars().next().unwrap_or_default();
    let last = trimmed.chars().last().unwrap_or_default();
    if (first == '"' && last == '"') || (first == '\'' && last == '\'') {
      return trimmed[1..trimmed.len() - 1].to_string();
    }
  }
  trimmed.to_string()
}

fn wait_for_server_ready() -> io::Result<()> {
  let server_addr = format!("{DESKTOP_SERVER_HOST}:{DESKTOP_SERVER_PORT}");
  let deadline = Instant::now() + Duration::from_secs(25);

  while Instant::now() < deadline {
    if TcpStream::connect(&server_addr).is_ok() {
      return Ok(());
    }
    thread::sleep(Duration::from_millis(500));
  }

  Err(io::Error::new(
    io::ErrorKind::TimedOut,
    "桌面统计服务启动超时"
  ))
}
