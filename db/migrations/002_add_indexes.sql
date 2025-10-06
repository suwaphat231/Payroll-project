--  เพิ่ม INDEX สำหรับตาราง employees
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_position   ON employees(position);
CREATE INDEX idx_employees_status     ON employees(status);

--  เพิ่ม INDEX สำหรับตาราง payroll_runs
CREATE INDEX idx_payroll_runs_period  ON payroll_runs(period_year, period_month);

--  เพิ่ม INDEX สำหรับ payslips (เพราะ query บ่อย)
CREATE INDEX idx_payslips_run ON payslips(payroll_run_id);
CREATE INDEX idx_payslips_emp ON payslips(employee_id);

--  เพิ่ม FOREIGN KEY ให้มั่นใจว่า payslips ผูกกับ payroll_runs และ employees เสมอ
ALTER TABLE payslips
  ADD CONSTRAINT fk_payslips_run FOREIGN KEY (payroll_run_id)
  REFERENCES payroll_runs(id)
  ON DELETE CASCADE;

ALTER TABLE payslips
  ADD CONSTRAINT fk_payslips_emp FOREIGN KEY (employee_id)
  REFERENCES employees(id)
  ON DELETE CASCADE;

--  เพิ่ม FOREIGN KEY ให้ leaves ผูกกับ employees เสมอ (ถ้ายังไม่มี)
ALTER TABLE leaves
  ADD CONSTRAINT fk_leaves_emp FOREIGN KEY (employee_id)
  REFERENCES employees(id)
  ON DELETE CASCADE;

--  เพิ่ม UNIQUE constraint เพื่อป้องกัน payslip ซ้ำ (พนักงาน+เดือน)
ALTER TABLE payslips
  ADD CONSTRAINT uq_payslip_per_run UNIQUE (payroll_run_id, employee_id);

--  เพิ่ม CHECK constraint ให้ค่า base_salary ต้องมากกว่า 0 เสมอ
ALTER TABLE employees
  ADD CONSTRAINT chk_salary_positive CHECK (base_salary > 0);

--  เพิ่ม DEFAULT value ถ้าขาด (ป้องกัน null)
ALTER TABLE employees
  ALTER COLUMN pvd_rate SET DEFAULT 0.03,
  ALTER COLUMN withholding_rate SET DEFAULT 0.00,
  ALTER COLUMN sso_enabled SET DEFAULT TRUE;

--  เพิ่ม INDEX สำหรับ exports
CREATE INDEX idx_exports_kind ON exports(kind);
CREATE INDEX idx_exports_run  ON exports(payroll_run_id);
