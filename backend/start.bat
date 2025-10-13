@echo off
set USE_DATABASE=1
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=payroll_user
set DB_PASS=payroll_pass
set DB_NAME=payroll
set DB_SSLMODE=disable
set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
set PORT=3000
go run cmd/main.go
