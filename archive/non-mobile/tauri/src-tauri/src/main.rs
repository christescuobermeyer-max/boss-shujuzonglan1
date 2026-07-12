#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod desktop_server;

use desktop_server::{launch_desktop_server, stop_desktop_server, DesktopServerState};
use tauri::RunEvent;

#[tauri::command]
fn verify_login_password(password: String) -> bool {
  let expected_password =
    std::env::var("TAURI_LOGIN_PASSWORD").unwrap_or_else(|_| "13972539707".to_string());

  password == expected_password
}

fn main() {
  let app = tauri::Builder::default()
    .manage(DesktopServerState::default())
    .setup(|app| {
      if !cfg!(debug_assertions) {
        launch_desktop_server(app.handle())?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![verify_login_password])
    .build(tauri::generate_context!())
    .expect("构建 Tauri 桌面应用失败");

  app.run(|app_handle, event| match event {
    RunEvent::ExitRequested { .. } | RunEvent::Exit => {
      stop_desktop_server(app_handle);
    }
    _ => {}
  });
}
