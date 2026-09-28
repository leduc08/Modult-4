@echo off
REM ============================================================
REM  Chay VietGo voi ban MOI NHAT tu GitHub (nhanh main)
REM  Bam dup file nay: tu dong git pull -> npm install -> chay localhost:3000
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo [1/4] Lay ban moi nhat tu GitHub (nhanh main)...
git checkout main
if errorlevel 1 goto :loi_git
git pull --ff-only origin main
if errorlevel 1 goto :loi_git

echo.
echo [2/4] Cai / cap nhat thu vien...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo Loi khi cai thu vien. Kiem tra ket noi mang roi chay lai.
  pause
  exit /b 1
)

echo.
echo [3/4] Giai phong cong 3000 (tat server cu neu dang chay)...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /PID %%p /T /F >nul 2>&1

echo.
echo [4/4] Dang chay tai http://localhost:3000  (dong cua so nay hoac Ctrl+C de dung)
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3000"
call npm run dev
exit /b 0

:loi_git
echo.
echo Khong cap nhat duoc tu GitHub.
echo  - Neu ban dang sua file chua commit: commit/stash truoc, hoac xem bang lenh "git status".
echo  - Neu mat mang: kiem tra ket noi roi chay lai.
pause
exit /b 1
