-- Employees
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  emp_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  department TEXT,
  position   TEXT,
  base_salary NUMERIC(12,2) NOT NULL CHECK (base_salary >= 0),
  bank_account TEXT,
  pvd_rate NUMERIC(5,4) DEFAULT 0.03,
  withholding_rate NUMERIC(5,4) DEFAULT 0,
  sso_enabled BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','terminated')),
  hired_at DATE DEFAULT CURRENT_DATE,
  terminated_at DATE
);

-- Leaves
CREATE TABLE leaves (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

-- Payroll Runs
CREATE TABLE payroll_runs (
  id SERIAL PRIMARY KEY,
  period_year  INT NOT NULL,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (period_year, period_month)
);

-- Payslips
CREATE TABLE payslips (
  id SERIAL PRIMARY KEY,
  payroll_run_id INT REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id    INT REFERENCES employees(id) ON DELETE CASCADE,
  base_salary NUMERIC(12,2) NOT NULL,
  tax_withheld NUMERIC(12,2) NOT NULL,
  sso NUMERIC(12,2) NOT NULL,
  pvd NUMERIC(12,2) NOT NULL,
  net_pay NUMERIC(12,2) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (payroll_run_id, employee_id)
);

-- Exports
CREATE TABLE exports (
  id SERIAL PRIMARY KEY,
  payroll_run_id INT REFERENCES payroll_runs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('bank','gov')),
  file_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);
CREATE INDEX idx_payslips_payroll_run_id ON payslips(payroll_run_id);