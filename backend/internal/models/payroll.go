package models

import "time"

// PayrollRun ตามตาราง payroll_runs
type PayrollRun struct {
	ID          uint          `gorm:"primaryKey;column:id" json:"id"`
	PeriodYear  int           `gorm:"column:period_year;not null" json:"periodYear"`
	PeriodMonth int           `gorm:"column:period_month;not null" json:"periodMonth"`
	Locked      bool          `gorm:"column:locked;default:false" json:"locked"`
	CreatedAt   time.Time     `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	Items       []PayrollItem `gorm:"foreignKey:RunID;constraint:OnDelete:CASCADE" json:"items"`
}

func (PayrollRun) TableName() string { return "payroll_runs" }

// ⚠️ สำคัญ: ให้ตรงกับตาราง payslips
type PayrollItem struct {
	ID          uint      `gorm:"primaryKey;column:id" json:"id"`
	RunID       uint      `gorm:"column:payroll_run_id;index;not null" json:"runId"`
	EmployeeID  uint      `gorm:"column:employee_id;index;not null" json:"employeeId"`
	BaseSalary  float64   `gorm:"column:base_salary;not null" json:"baseSalary"`
	TaxWithheld float64   `gorm:"column:tax_withheld;not null" json:"taxWithheld"`
	SSO         float64   `gorm:"column:sso;not null" json:"sso"`
	PVD         float64   `gorm:"column:pvd;not null" json:"pvd"`
	NetPay      float64   `gorm:"column:net_pay;not null" json:"netPay"`
	GeneratedAt time.Time `gorm:"column:generated_at;autoCreateTime" json:"generatedAt"`
	Employee    Employee  `gorm:"foreignKey:EmployeeID" json:"employee"`
}

func (PayrollItem) TableName() string { return "payslips" }
