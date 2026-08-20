@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Draft A Lore - Installer
color 0E

rem ============================================================
rem  Draft A Lore - Windows shortcut installer
rem  Creates a Desktop shortcut (and optionally a Start Menu
rem  entry) that launches the local app in its own window using
rem  the installed Chromium browser's app mode, with the app's
rem  own icon. Nothing is copied, registered or sent anywhere -
rem  the app keeps running from this folder, fully offline.
rem  Re-run this file any time to recreate or update shortcuts.
rem ============================================================

set "DAL_APPDIR=%~dp0"
if "%DAL_APPDIR:~-1%"=="\" set "DAL_APPDIR=%DAL_APPDIR:~0,-1%"

echo.
echo   ============================================
echo      DRAFT A LORE - Installer
echo   ============================================
echo.
echo   App folder: %DAL_APPDIR%
echo.

if not exist "%DAL_APPDIR%\DraftALore.html" (
  echo   [X] DraftALore.html was not found next to this installer.
  echo       Keep Install-DraftALore.bat in the same folder as
  echo       DraftALore.html and run it again.
  echo.
  pause
  exit /b 1
)

set "DAL_DESKTOP=0"
set "DAL_STARTMENU=0"

:ASK_DESKTOP
set "ANS="
set /p "ANS=  Would you like to create a Desktop Shortcut? (Y/N): "
if /i "%ANS%"=="Y" ( set "DAL_DESKTOP=1" & goto ASK_STARTMENU )
if /i "%ANS%"=="N" goto ASK_STARTMENU
echo   Please type Y or N.
goto ASK_DESKTOP

:ASK_STARTMENU
set "ANS="
set /p "ANS=  Add Draft A Lore to the Windows Start Menu? (Y/N): "
if /i "%ANS%"=="Y" ( set "DAL_STARTMENU=1" & goto RUN )
if /i "%ANS%"=="N" goto RUN
echo   Please type Y or N.
goto ASK_STARTMENU

:RUN
if "%DAL_DESKTOP%"=="0" if "%DAL_STARTMENU%"=="0" (
  echo.
  echo   Nothing selected - no shortcuts were created.
  echo   You can always open DraftALore.html directly.
  echo.
  pause
  exit /b 0
)

echo.
echo   Working...
echo.

rem The PowerShell payload lives at the bottom of this file after
rem the PS marker; PowerShell reads this .bat and runs that part.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-Content -LiteralPath '%~f0' -Raw; $i = $c.LastIndexOf('#PS_START'); Invoke-Expression $c.Substring($i + 9)"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo   [X] Something went wrong while creating the shortcuts.
  echo       You can still run the app by opening DraftALore.html.
) else (
  echo   Done. Launch Draft A Lore from your shortcut any time.
)
echo.
pause
exit /b %RC%

#PS_START
$ErrorActionPreference = 'Stop'
try {
  $appDir = $env:DAL_APPDIR
  $index  = Join-Path $appDir 'DraftALore.html'
  $icon   = Join-Path $appDir 'favicon.ico'
  if (-not (Test-Path -LiteralPath $icon)) { $icon = Join-Path $appDir 'icons\draft-a-lore.ico' }

  # file:/// URL for Chromium app mode (backslashes -> forward slashes, spaces escaped)
  $fileUrl = 'file:///' + (($index -replace '\\', '/') -replace ' ', '%20')

  # Prefer a Chromium browser so the app opens in its own clean window
  # (no tabs, no address bar) and shows the Draft A Lore icon.
  $pf   = ${env:ProgramFiles}
  $pf86 = ${env:ProgramFiles(x86)}
  $lad  = $env:LOCALAPPDATA
  $candidates = @(
    "$pf\Microsoft\Edge\Application\msedge.exe",
    "$pf86\Microsoft\Edge\Application\msedge.exe",
    "$pf\Google\Chrome\Application\chrome.exe",
    "$pf86\Google\Chrome\Application\chrome.exe",
    "$lad\Google\Chrome\Application\chrome.exe",
    "$pf\BraveSoftware\Brave-Browser\Application\brave.exe",
    "$pf86\BraveSoftware\Brave-Browser\Application\brave.exe",
    "$pf\Vivaldi\Application\vivaldi.exe",
    "$lad\Vivaldi\Application\vivaldi.exe"
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  $browser = $candidates | Select-Object -First 1

  if ($browser) {
    $targetPath = $browser
    $arguments  = '--app="' + $fileUrl + '" --window-size=1400,900'
    $mode       = "app window via $([System.IO.Path]::GetFileName($browser))"
  } else {
    # No Chromium browser found: hand the file to the default browser.
    $targetPath = $index
    $arguments  = ''
    $mode       = 'default browser (no Chromium browser found)'
  }

  function New-DalShortcut([string]$LinkPath) {
    $shell = New-Object -ComObject WScript.Shell
    $sc = $shell.CreateShortcut($LinkPath)
    $sc.TargetPath       = $targetPath
    $sc.Arguments        = $arguments
    $sc.WorkingDirectory = $appDir
    $sc.Description      = 'Draft A Lore - writing and RPG adventure design tool'
    $sc.WindowStyle      = 1
    if (Test-Path -LiteralPath $icon) { $sc.IconLocation = "$icon,0" }
    $sc.Save()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($shell) | Out-Null
  }

  Write-Host ("  Launch mode : " + $mode)
  $made = 0

  if ($env:DAL_DESKTOP -eq '1') {
    $desktop = [Environment]::GetFolderPath('Desktop')
    $link = Join-Path $desktop 'Draft A Lore.lnk'
    New-DalShortcut $link
    Write-Host ("  [OK] Desktop shortcut  : " + $link)
    $made++
  }

  if ($env:DAL_STARTMENU -eq '1') {
    $programs = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
    if (-not (Test-Path -LiteralPath $programs)) { New-Item -ItemType Directory -Path $programs -Force | Out-Null }
    $link = Join-Path $programs 'Draft A Lore.lnk'
    New-DalShortcut $link
    Write-Host ("  [OK] Start Menu entry  : " + $link)
    $made++
  }

  if ($made -eq 0) { Write-Host '  Nothing to do.' }
  exit 0
}
catch {
  Write-Host ("  [X] " + $_.Exception.Message)
  exit 1
}
