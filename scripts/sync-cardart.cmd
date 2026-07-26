@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT=%%~fI"
set "DEST=%ROOT%\prototype\core-loop\public\cardart"

if "%~1"=="" (
  echo Usage: %~nx0 ^<external-cardart-directory^>
  echo.
  echo Copies final card PNG files from an external storage folder.
  echo Existing local files may be updated. No files are deleted.
  exit /b 2
)

for %%I in ("%~1") do set "SOURCE=%%~fI"
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

echo Card art sync complete: "%SOURCE%" ^-^> "%DEST%"
exit /b 0
