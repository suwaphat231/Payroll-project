# คู่มือการติดตั้งและรันโปรเจค Payroll System

## วิธีที่ 1: รันด้วย Docker Compose (แนะนำ)

### รันทั้งระบบ (Database + Backend + Frontend)

```bash
cd infra
docker compose up --build
```

เมื่อรันสำเร็จแล้ว คุณสามารถเข้าถึง:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/v1
- **Database**: localhost:5432
- **pgAdmin**: http://localhost:8080 (email: admin@payroll.local, password: admin123)

### หยุดการทำงาน

```bash
docker compose down
```

### ลบข้อมูลทั้งหมดและเริ่มใหม่

```bash
docker compose down -v
docker compose up --build
```

---

## วิธีที่ 2: รันแยกแต่ละส่วน (Development Mode)

### 1. เริ่มต้น Database

```bash
cd infra
docker compose up db -d
```

### 2. รัน Backend (Go)

```bash
cd backend
go mod download
go run cmd/main.go
```

Backend จะรันที่ http://localhost:3000

### 3. รัน Frontend (React)

```bash
cd frontend
npm install
npm start
```

Frontend จะรันที่ http://localhost:3000 (หรือ port อื่นถ้า 3000 ถูกใช้งานแล้ว)

---

## Environment Variables

### Backend (.env)

ไฟล์ `backend/.env` มีค่าเริ่มต้นดังนี้:

```env
PORT=3000
USE_DATABASE=1
DB_HOST=localhost
DB_PORT=5432
DB_USER=payroll_user
DB_PASS=payroll_pass
DB_NAME=payroll
DB_SSLMODE=disable
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Frontend (.env)

ไฟล์ `frontend/.env` มีค่าเริ่มต้นดังนี้:

```env
REACT_APP_API_URL=http://localhost:3000/api/v1
```

---

## การ Login

ระบบจะมี seed data อยู่แล้วใน `db/migrations/002_seed_data.sql`

ตรวจสอบข้อมูล login จาก migration file หรือใช้:
- Username/Email จาก seed data
- Password ที่กำหนดไว้

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login

### Employees
- `GET /api/v1/employees` - ดึงรายการพนักงาน
- `POST /api/v1/employees` - เพิ่มพนักงานใหม่

### Payroll
- `POST /api/v1/payroll/runs` - สร้าง payroll run ใหม่
- `POST /api/v1/payroll/runs/:id/calculate` - คำนวณ payroll
- `GET /api/v1/payroll/runs/:id/items` - ดูรายการ payroll items
- `POST /api/v1/payroll/runs/:id/export-bank-csv` - Export ไฟล์ CSV สำหรับธนาคาร

### Payslips
- `GET /api/v1/payslips/:runId` - ดู payslips ของ run นั้นๆ

### Leave
- `GET /api/v1/leave` - ดูรายการลา
- `POST /api/v1/leave` - สร้างรายการลา

---

## Troubleshooting

### ฐานข้อมูลไม่เชื่อมต่อ
- ตรวจสอบว่า PostgreSQL container รันอยู่: `docker ps`
- ตรวจสอบ logs: `docker logs payroll-db`

### Backend ไม่ทำงาน
- ตรวจสอบว่าค่า `USE_DATABASE=1` ใน .env
- ตรวจสอบว่า database credentials ถูกต้อง
- ตรวจสอบ logs: `docker logs payroll-backend`

### Frontend ไม่เชื่อมต่อ Backend
- ตรวจสอบว่า Backend รันอยู่ที่ port 3000
- ตรวจสอบว่า `REACT_APP_API_URL` ใน `.env` ถูกต้อง
- เปิด Browser Console เพื่อดู error

### CORS Error
- Backend มี CORS middleware อยู่แล้ว ควรจะทำงานได้
- ถ้ายังมีปัญหา ตรวจสอบ backend logs

---

## Database Schema

ดูรายละเอียด schema ได้ที่ `db/schema.sql` และ `db/migrations/`

Tables:
- `employees` - ข้อมูลพนักงาน
- `leaves` - ข้อมูลการลา
- `payroll_runs` - รอบการคำนวณเงินเดือน
- `payslips` - สลิปเงินเดือน
- `exports` - ข้อมูล export files
