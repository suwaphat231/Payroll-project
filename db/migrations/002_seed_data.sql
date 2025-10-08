-- Employees (พนักงานตัวอย่าง)
INSERT INTO employees (emp_code, first_name, last_name, department, position, base_salary, bank_account)
VALUES
('E001', 'สมชาย', 'สุขใจ', 'ฝ่ายบุคคล', 'HR Manager', 50000, '123-456-7890'),
('E002', 'สุดา', 'ดีงาม', 'ฝ่ายบัญชี', 'Accountant', 40000, '987-654-3210'),
('E003', 'อนันต์', 'มีชัย', 'ฝ่ายไอที', 'Developer', 60000, '111-222-3333'),
('E004', 'กมล', 'ใจดี', 'ฝ่ายขาย', 'Sales Executive', 45000, '222-333-4444'),
('E005', 'พรทิพย์', 'รุ่งเรือง', 'ฝ่ายการเงิน', 'Finance Officer', 48000, '555-666-7777');

-- Payroll run (ตัวอย่างเดือนกันยายน 2025)
INSERT INTO payroll_runs (period_year, period_month, locked)
VALUES (2025, 9, FALSE);

-- Payslips
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, tax_withheld, sso, pvd, net_pay)
VALUES
(1, 1, 50000, 2500, 750, 1500, 45250),
(1, 2, 40000, 2000, 600, 1200, 36200),
(1, 3, 60000, 3000, 900, 1800, 54300),
(1, 4, 45000, 2250, 675, 1350, 40725),
(1, 5, 48000, 2400, 720, 1440, 43440);

-- Leaves
INSERT INTO leaves (employee_id, leave_date, note)
VALUES
(1, '2025-10-15', 'ลาพักร้อน'),
(2, '2025-10-20', 'ลากิจ'),
(3, '2025-10-25', 'ลาป่วย');

-- Exports (ตัวอย่างไฟล์โอนเงิน)
INSERT INTO exports (payroll_run_id, kind, file_path)
VALUES
(1, 'bank', '/exports/payroll_sep2025_bank.csv'),
(1, 'gov', '/exports/payroll_sep2025_gov.csv');