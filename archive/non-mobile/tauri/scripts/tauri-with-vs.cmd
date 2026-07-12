@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tauri-with-vs.ps1" %*
exit /b %errorlevel%
