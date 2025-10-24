@echo off
chcp 65001 >nul
color 0A

:MENU
cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║      🎯 AI Interview Co-pilot - Control Panel         ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  [1] 🚀 Start Server (Custom Port)
echo  [2] ⚡ Quick Start (Port 8004)
echo  [3] 🔄 Apply Migrations Only
echo  [4] 🧹 Clear Cache + Restart
echo  [5] 📦 Install/Update Dependencies
echo  [6] ❌ Exit
echo.
echo  ══════════════════════════════════════════════════════════
echo.

set /p choice="  Select option (1-6): "

if "%choice%"=="1" goto START_CUSTOM
if "%choice%"=="2" goto START_DEFAULT
if "%choice%"=="3" goto MIGRATE
if "%choice%"=="4" goto CLEAR_CACHE
if "%choice%"=="5" goto INSTALL_DEPS
if "%choice%"=="6" goto EXIT

echo  Invalid option! Please try again.
timeout /t 2 >nul
goto MENU

:START_CUSTOM
cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║           🚀 Starting Server (Custom Port)            ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

REM Ativar ambiente virtual
if exist "venv\Scripts\activate.bat" (
    echo  [✓] Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo  [⚠] Virtual environment not found. Using global Python.
)

echo.
echo  [1/3] Applying database migrations...
python manage.py migrate

echo.
set /p PORT="  Enter port number: "
if "%PORT%"=="" set PORT=8004

echo.
echo  [2/3] Starting Django server on port %PORT%...
echo  ══════════════════════════════════════════════════════════
echo  [✓] Server running at: http://localhost:%PORT%
echo  [!] Press CTRL+C to stop the server
echo  ══════════════════════════════════════════════════════════
echo.

python manage.py runserver %PORT%
goto END

:START_DEFAULT
cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║            ⚡ Quick Start (Port 8004)                  ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

REM Ativar ambiente virtual
if exist "venv\Scripts\activate.bat" (
    echo  [✓] Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo  [⚠] Virtual environment not found. Using global Python.
)

echo.
echo  [1/2] Applying database migrations...
python manage.py migrate

echo.
echo  [2/2] Starting Django server on port 8004...
echo  ══════════════════════════════════════════════════════════
echo  [✓] Server running at: http://localhost:8004
echo  [!] Press CTRL+C to stop the server
echo  ══════════════════════════════════════════════════════════
echo.

python manage.py runserver 8004
goto END

:MIGRATE
cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║              🔄 Applying Migrations                    ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

REM Ativar ambiente virtual
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

python manage.py migrate
echo.
echo  [✓] Migrations completed successfully!
echo.
pause
goto MENU

:CLEAR_CACHE
cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║            🧹 Clearing Cache + Restart                 ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

REM Deletar arquivos de cache Python
echo  [1/3] Removing Python cache files...
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del /s /q *.pyc 2>nul

echo  [2/3] Clearing Django cache...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)
python manage.py clearsessions 2>nul

echo  [3/3] Applying migrations...
python manage.py migrate

echo.
echo  [✓] Cache cleared! Starting server on port 8004...
echo.
python manage.py runserver 8004
goto END

:INSTALL_DEPS
cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║         📦 Installing/Updating Dependencies           ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

REM Ativar ambiente virtual
if exist "venv\Scripts\activate.bat" (
    echo  [✓] Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo  [!] Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
)

echo.
echo  [1/2] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo  [2/2] Installing requirements...
pip install -r requirements.txt
pip install --upgrade openai

echo.
echo  [✓] Dependencies installed successfully!
echo.
pause
goto MENU

:EXIT
cls
echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║              👋 Goodbye! Have a great day!             ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
timeout /t 2 >nul
exit

:END
echo.
pause
goto MENU
