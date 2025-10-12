BEGIN;

-- Employees (พนักงานตัวอย่าง)  ✅ ใช้ emp_code และ base_salary ตามสคีมา
INSERT INTO employees
(emp_code, first_name, last_name, department, position, base_salary, bank_account, pvd_rate, withholding_rate, sso_enabled, status, hired_at)
VALUES
('E001', 'สมชาย',  'สุขใจ',    'ฝ่ายบุคคล',  'HR Manager',       50000, '123-456-7890', 0.03, 0.05, TRUE,  'active', DATE '2023-01-01'),
('E002', 'สุดา',   'ดีงาม',    'ฝ่ายบัญชี',  'Accountant',       40000, '987-654-3210', 0.03, 0.05, TRUE,  'active', DATE '2023-03-01'),
('E003', 'อนันต์', 'มีชัย',    'ฝ่ายไอที',   'Developer',        60000, '111-222-3333', 0.03, 0.05, TRUE,  'active', DATE '2024-01-01'),
('E004', 'กมล',    'ใจดี',     'ฝ่ายขาย',     'Sales Executive',  45000, '222-333-4444', 0.03, 0.05, TRUE,  'active', DATE '2022-06-01'),
('E005', 'พรทิพย์','รุ่งเรือง','ฝ่ายการเงิน', 'Finance Officer', 48000, '555-666-7777', 0.03, 0.05, TRUE,  'active', DATE '2021-10-01');

-- Payroll run (ตัวอย่างเดือนกันยายน 2025) ✅ ใช้ period_year/period_month
INSERT INTO payroll_runs (period_year, period_month, locked)
VALUES (2025, 9, FALSE);

-- Payslips ✅ อ้างอิง id ด้วย subquery เพื่อไม่ผูกกับเลขลำดับ
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, tax_withheld, sso, pvd, net_pay)
VALUES
((SELECT id FROM payroll_runs WHERE period_year=2025 AND period_month=9),
 (SELECT id FROM employees WHERE emp_code='E001'), 50000, 2500, 750, 1500, 45250),
((SELECT id FROM payroll_runs WHERE period_year=2025 AND period_month=9),
 (SELECT id FROM employees WHERE emp_code='E002'), 40000, 2000, 600, 1200, 36200),
((SELECT id FROM payroll_runs WHERE period_year=2025 AND period_month=9),
 (SELECT id FROM employees WHERE emp_code='E003'), 60000, 3000, 900, 1800, 54300),
((SELECT id FROM payroll_runs WHERE period_year=2025 AND period_month=9),
 (SELECT id FROM employees WHERE emp_code='E004'), 45000, 2250, 675, 1350, 40725),
((SELECT id FROM payroll_runs WHERE period_year=2025 AND period_month=9),
 (SELECT id FROM employees WHERE emp_code='E005'), 48000, 2400, 720, 1440, 43440);

-- Leaves
INSERT INTO leaves (employee_id, leave_date, note)
VALUES
((SELECT id FROM employees WHERE emp_code='E001'), DATE '2025-10-15', 'ลาพักร้อน'),
((SELECT id FROM employees WHERE emp_code='E002'), DATE '2025-10-20', 'ลากิจ'),
((SELECT id FROM employees WHERE emp_code='E003'), DATE '2025-10-25', 'ลาป่วย');

-- Exports (ตัวอย่างไฟล์โอนเงิน)
INSERT INTO exports (payroll_run_id, kind, file_path)
VALUES
((SELECT id FROM payroll_runs WHERE period_year=2025 AND period_month=9), 'bank', '/exports/payroll_sep2025_bank.csv'),
((SELECT id FROM payroll_runs WHERE period_year=2025 AND period_month=9), 'gov',  '/exports/payroll_sep2025_gov.csv');

COMMIT;
