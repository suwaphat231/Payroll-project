@echo off
echo ========================================
echo  Stopping all servers...
echo ========================================
taskkill /F /IM node.exe 2>nul
taskkill /F /IM go.exe 2>nul
timeout /t 2

echo.
echo ========================================
echo  Starting Backend (Port 3000)...
echo ========================================
start "Payroll Backend" cmd /k "cd backend && set USE_DATABASE=0 && set PORT=3000 && set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production && go run cmd/main.go"
timeout /t 5

echo.
echo ========================================
echo  Starting Frontend (Port 5173)...
echo ========================================
start "Payroll Frontend" cmd /k "cd frontend && set PORT=5173 && npm start"

echo.
echo ========================================
echo  Servers Starting...
echo ========================================
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:5173
echo.
echo  Login credentials:
echo  Email:    admin@example.com
echo  Password: Admin@123
echo.
echo ========================================
pause
