@echo off
echo ========================================
echo   AI Interview Co-pilot - Start Server
echo ========================================
echo.

REM Ativar ambiente virtual se existir
if exist "venv\Scripts\activate.bat" (
    echo [1/3] Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo Warning: Virtual environment not found. Using global Python.
)

echo.
echo [2/3] Applying database migrations...
python manage.py migrate

echo.
echo [3/3] Starting Django server...
echo.
set /p PORT="Enter port number (default 8004): "

REM Se o usuário não digitar nada, usar 8004 como padrão
if "%PORT%"=="" set PORT=8004

echo.
echo ========================================
echo Starting server on port %PORT%...
echo Open browser: http://localhost:%PORT%
echo Press CTRL+C to stop the server
echo ========================================
echo.

python manage.py runserver %PORT%

pause
