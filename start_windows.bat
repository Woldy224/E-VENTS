@echo off
echo ==========================================
echo   Lancement de Secure-Events (Windows)
echo ==========================================

:: Vérification de PHP
php -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] PHP n'est pas installé ou n'est pas dans le PATH.
    pause
    exit /b
)

echo [1/2] Démarrage du Backend PHP sur http://localhost:8000...
start /B php -S localhost:8000 -t api api/router.php

echo [2/2] Démarrage du Frontend Vite...
npm run dev

pause
