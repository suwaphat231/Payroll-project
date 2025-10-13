# วิธีใช้งานระบบ Payroll

## ข้อมูลสำคัญ
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Email**: admin@example.com
- **Password**: Admin@123

## ขั้นตอนการใช้งาน (สำคัญมาก!)

### 1. Login
1. เปิด browser ไปที่ http://localhost:5173
2. กรอก Email: `admin@example.com`
3. กรอก Password: `Admin@123`
4. คลิก Login

### 2. รันเงินเดือน (Payroll) - **ต้องทำก่อน!**

**หมายเหตุ**: ต้องทำขั้นตอนนี้ก่อนถึงจะดู Payslips ได้

1. คลิกเมนู **"Payroll"** ด้านซ้าย
2. เลือก **ปี** และ **เดือน** (เช่น 2025, 10)
3. คลิกปุ่ม **"คำนวณใหม่"** (สีน้ำเงิน)
4. รอสักครู่ จะเห็นตารางแสดงพนักงาน 5 คน พร้อมข้อมูล:
   - เงินเดือน
   - หัก SSO
   - หัก PVD
   - หัก Tax
   - เงินได้สุทธิ

### 3. ดู Payslips

**หลังจากคำนวณเงินเดือนแล้ว**:

1. คลิกปุ่ม **"ดู Payslips"** (สีเขียว) ที่หน้า Payroll
2. จะเห็นการ์ดสลิปเงินเดือนของพนักงานทั้ง 5 คน
3. แต่ละการ์ดแสดง:
   - ชื่อพนักงาน
   - รหัสพนักงาน
   - ตำแหน่ง
   - แผนก
   - เงินได้สุทธิ

### 4. ดูรายละเอียด Payslip

1. คลิกปุ่ม **"ดู Payslip"** ที่การ์ดใดก็ได้
2. จะเห็นสลิปเงินเดือนแบบละเอียด:
   - ข้อมูลบริษัท
   - ข้อมูลพนักงาน
   - งวดเงินเดือน
   - ตารางรายรับ (Earnings)
   - ตารางรายหัก (Deductions)
   - เงินได้สุทธิ (Net Pay)
3. คลิก **"ดาวน์โหลด PDF / พิมพ์"** เพื่อพิมพ์หรือบันทึกเป็น PDF

## พนักงาน Sample Data

ระบบมีพนักงานตัวอย่าง 5 คน:

1. **E001** - สมชาย ใจดี (IT, Senior Developer) - ฿50,000
2. **E002** - สมหญิง รักสงบ (HR, HR Manager) - ฿45,000
3. **E003** - ประเสริฐ มั่นคง (Accounting, Accountant) - ฿40,000
4. **E004** - วิไล สว่างใจ (IT, Junior Developer) - ฿30,000
5. **E005** - ธนากร มีเงิน (Finance, Financial Analyst) - ฿48,000

## การรีสตาร์ทระบบ

หากต้องการรีสตาร์ท:

### วิธีที่ 1: ใช้ batch script
Double-click ไฟล์ `restart-all.bat` ที่โฟลเดอร์หลัก

### วิธีที่ 2: รีสตาร์ทด้วยตนเอง

**Backend**:
```bash
cd backend
set USE_DATABASE=0
set PORT=3000
set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
go run cmd/main.go
```

**Frontend**:
```bash
cd frontend
set PORT=5173
npm start
```

## ปัญหาที่พบบ่อย

### 1. "ไม่พบข้อมูล payslip"
**สาเหตุ**: ยังไม่ได้รันเงินเดือน (Payroll)
**แก้ไข**: ไปที่หน้า Payroll และคลิก "คำนวณใหม่" ก่อน

### 2. "ไม่สามารถโหลดข้อมูล payslip ได้"
**สาเหตุ**: Backend ยังไม่พร้อมหรือ API ไม่ตอบสนอง
**แก้ไข**:
- เช็คว่า backend รันอยู่หรือไม่ (ควรเห็น "Server ready at http://localhost:3000")
- รีสตาร์ท backend ใหม่

### 3. "Something is already running on port..."
**สาเหตุ**: มี process รันอยู่แล้วบน port นั้น
**แก้ไข**:
- ปิด process เก่าก่อน
- หรือใช้ `restart-all.bat` ที่จะปิดทุกอย่างอัตโนมัติ

## หมายเหตุสำคัญ

- ระบบใช้ **in-memory storage** ข้อมูลจะหายเมื่อ restart backend
- ทุกครั้งที่ restart backend จะมีพนักงาน 5 คนให้ทดสอบอัตโนมัติ
- **ต้องรันเงินเดือนทุกครั้ง** หลัง restart backend ก่อนจะดู Payslips
