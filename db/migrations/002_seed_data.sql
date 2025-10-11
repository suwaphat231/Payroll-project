-- Employees (ไม่ใส่ base_salary/BankAccount เพราะอยู่/ไม่มีในโมเดล)
INSERT INTO employees (code, first_name, last_name, department, position, employment_type, status, active, email, phone)
VALUES
('EMP-0001', 'สมชาย', 'สุขใจ', 'ฝ่ายบุคคล', 'HR Manager', 'Full-time', 'Active', TRUE, 'somchai@example.com', '0812345678'),
('EMP-0002', 'สุดา', 'ดีงาม', 'ฝ่ายบัญชี', 'Accountant', 'Full-time', 'Active', TRUE, 'suda@example.com', '0891112222'),
('EMP-0003', 'อนันต์', 'มีชัย', 'ฝ่ายไอที', 'Developer', 'Full-time', 'Active', TRUE, 'anan@example.com', '0867778888'),
('EMP-0004', 'กมล', 'ใจดี', 'ฝ่ายขาย', 'Sales Executive', 'Full-time', 'Active', TRUE, 'kamol@example.com', '0823456789'),
('EMP-0005', 'พรทิพย์', 'รุ่งเรือง', 'ฝ่ายการเงิน', 'Finance Officer', 'Full-time', 'Active', TRUE, 'porntip@example.com', '0855557777');

-- Employments (ฐานเงินเดือนอยู่ที่นี่ ตามโมเดล Go)
INSERT INTO employments (employee_id, hire_date, base_salary, contract_type, tax_rate, allowance)
VALUES
((SELECT id FROM employees WHERE code='EMP-0001'), CURRENT_DATE - INTERVAL '2 years 3 months', 50000, 'Permanent', 0.05, 2000),
((SELECT id FROM employees WHERE code='EMP-0002'), CURRENT_DATE - INTERVAL '1 year',         40000, 'Permanent', 0.05, 1500),
((SELECT id FROM employees WHERE code='EMP-0003'), CURRENT_DATE - INTERVAL '1 year 6 months',60000, 'Permanent', 0.05, 2500),
((SELECT id FROM employees WHERE code='EMP-0004'), CURRENT_DATE - INTERVAL '2 years',        45000, 'Permanent', 0.05, 1800),
((SELECT id FROM employees WHERE code='EMP-0005'), CURRENT_DATE - INTERVAL '3 years',        48000, 'Permanent', 0.05, 1800);

-- Payroll run (ตัวอย่างเดือนกันยายน 2025)
INSERT INTO payroll_runs (period_year, period_month, locked)
VALUES (2025, 9, FALSE);

-- Payslips (อ้างอิง employee_id ด้วย subquery ป้องกันเลข id ไม่ตรง)
INSERT INTO payslips (payroll_run_id, employee_id, base_salary, tax_withheld, sso, pvd, net_pay)
VALUES
(1, (SELECT id FROM employees WHERE code='EMP-0001'), 50000, 2500, 750, 1500, 45250),
(1, (SELECT id FROM employees WHERE code='EMP-0002'), 40000, 2000, 600, 1200, 36200),
(1, (SELECT id FROM employees WHERE code='EMP-0003'), 60000, 3000, 900, 1800, 54300),
(1, (SELECT id FROM employees WHERE code='EMP-0004'), 45000, 2250, 675, 1350, 40725),
(1, (SELECT id FROM employees WHERE code='EMP-0005'), 48000, 2400, 720, 1440, 43440);

-- Leaves
INSERT INTO leaves (employee_id, leave_date, note)
VALUES
((SELECT id FROM employees WHERE code='EMP-0001'), DATE '2025-10-15', 'ลาพักร้อน'),
((SELECT id FROM employees WHERE code='EMP-0002'), DATE '2025-10-20', 'ลากิจ'),
((SELECT id FROM employees WHERE code='EMP-0003'), DATE '2025-10-25', 'ลาป่วย');

-- Exports (ไฟล์โอนเงิน)
INSERT INTO exports (payroll_run_id, kind, file_path)
VALUES
(1, 'bank', '/exports/payroll_sep2025_bank.csv'),
(1, 'gov',  '/exports/payroll_sep2025_gov.csv');
