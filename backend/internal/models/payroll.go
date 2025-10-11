package models

import "time"

// ✅ แก้ struct PayrollRun ให้ตรงกับ DDL ใน 001_init.sql
type PayrollRun struct {
	ID          uint          `gorm:"primaryKey;column:id" json:"id"`
	PeriodYear  int           `gorm:"column:period_year;not null" json:"periodYear"`
	PeriodMonth int           `gorm:"column:period_month;not null" json:"periodMonth"`
	Locked      bool          `gorm:"column:locked;default:false" json:"locked"`
	CreatedAt   time.Time     `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	Items       []PayrollItem `gorm:"foreignKey:RunID;constraint:OnDelete:CASCADE" json:"items"`
}

func (PayrollRun) TableName() string { return "payroll_runs" }

// ✅ PayrollItem ก็ใช้ต่อได้เหมือนเดิม
type PayrollItem struct {
	ID          uint      `gorm:"primaryKey;column:id" json:"id"`
	RunID       uint      `gorm:"column:payroll_run_id;index;not null" json:"runId"`
	EmployeeID  uint      `gorm:"column:employee_id;index;not null" json:"employeeId"`
	Gross       float64   `gorm:"column:gross" json:"gross"`
	TaxWithheld float64   `gorm:"column:tax_withheld" json:"taxWithheld"`
	SSO         float64   `gorm:"column:sso" json:"sso"`
	PVD         float64   `gorm:"column:pvd" json:"pvd"`
	NetPay      float64   `gorm:"column:net_pay" json:"netPay"`
	GeneratedAt time.Time `gorm:"column:generated_at;autoCreateTime" json:"generatedAt"`
	Details     string    `gorm:"column:details" json:"details"`
}

func (PayrollItem) TableName() string { return "payslips" }
