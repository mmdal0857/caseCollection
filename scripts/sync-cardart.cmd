@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT=%%~fI"
set "LOCAL=%ROOT%\prototype\core-loop\public\cardart"

if "%~2"=="" (
  echo Usage: %~nx0 pull^|push ^<google-drive-cardart-directory^>
  echo.
  echo   pull  Google Drive to the project working copy
  echo   push  Project working copy to Google Drive
  echo.
  echo Existing files may be updated. No files are deleted.
  exit /b 2
)

set "DIRECTION=%~1"
for %%I in ("%~2") do set "DRIVE=%%~fI"

if /I "%DIRECTION%"=="pull" (
  set "SOURCE=%DRIVE%"
  set "DEST=%LOCAL%"
) else if /I "%DIRECTION%"=="push" (
  set "SOURCE=%LOCAL%"
  set "DEST=%DRIVE%"
) else (
  echo ERROR: direction must be pull or push.
  exit /b 2
)

if not exist "%SOURCE%\" (
  echo ERROR: source directory does not exist: "%SOURCE%"
  exit /b 2
)

if not exist "%DEST%\" mkdir "%DEST%"

robocopy "%SOURCE%" "%DEST%" *.png /COPY:DAT /R:2 /W:1 /NP /NJH /NJS
set "ROBOCOPY_EXIT=%ERRORLEVEL%"

if %ROBOCOPY_EXIT% GEQ 8 (
  echo ERROR: card art sync failed with robocopy exit code %ROBOCOPY_EXIT%.
  exit /b %ROBOCOPY_EXIT%
)

echo Card art %DIRECTION% complete: "%SOURCE%" ^-^> "%DEST%"
exit /b 0
