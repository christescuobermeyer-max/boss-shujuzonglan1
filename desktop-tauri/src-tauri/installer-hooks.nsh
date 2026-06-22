!macro CS_CLEAN_STALE_BOSS_PROCESSES
  DetailPrint "Closing stale ${PRODUCTNAME} processes..."
  nsExec::ExecToLog 'taskkill /F /T /IM "boss_shujuzonglan1_tauri.exe"'
  nsExec::ExecToLog 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$$nodePath = Join-Path $$env:LOCALAPPDATA ''呈尚策划 · BOSS看板\resources\node-runtime\node.exe''; Get-CimInstance Win32_Process | Where-Object { $$_.ExecutablePath -eq $$nodePath -and $$_.CommandLine -like ''*server.js*'' } | ForEach-Object { Stop-Process -Id $$_.ProcessId -Force }"'
  Sleep 1000
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro CS_CLEAN_STALE_BOSS_PROCESSES
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro CS_CLEAN_STALE_BOSS_PROCESSES
!macroend
