param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $TauriArgs
)

$ErrorActionPreference = "Stop"

$vswhere = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path $vswhere)) {
  throw "vswhere.exe not found."
}

$installationPath = & $vswhere `
  -latest `
  -products * `
  -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
  -property installationPath

if (-not $installationPath) {
  throw "No Visual Studio installation with VC tools was found."
}

$vcvarsPath = Join-Path $installationPath "VC\Auxiliary\Build\vcvars64.bat"
if (-not (Test-Path $vcvarsPath)) {
  throw "vcvars64.bat not found: $vcvarsPath"
}

$tauriArgsText = [string]::Join(" ", $TauriArgs)
$tempBatchPath = Join-Path $env:TEMP "codex-tauri-run.cmd"
$batchContent = @"
@echo off
call "$vcvarsPath" >nul
if errorlevel 1 exit /b 1
npx tauri $tauriArgsText
"@

Set-Content -LiteralPath $tempBatchPath -Value $batchContent -Encoding ASCII
cmd /c $tempBatchPath
exit $LASTEXITCODE
