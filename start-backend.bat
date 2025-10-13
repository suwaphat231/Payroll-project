@echo off
cd backend
set USE_DATABASE=0
set PORT=3001
set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
go run cmd/main.go
