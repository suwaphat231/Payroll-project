package models

import "time"

type PayrollRun struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	PeriodStart time.Time `json:"periodStart"`
	PeriodEnd   time.Time `json:"periodEnd"`
	PayDate     time.Time `json:"payDate"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type PayrollItem struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	RunID       uint      `gorm:"index" json:"runId"`
	EmployeeID  uint      `gorm:"index" json:"employeeId"`
	Gross       float64   `json:"gross"`
	TaxWithheld float64   `json:"taxWithheld"`
	Details     string    `json:"details"`
	NetPay      float64   `json:"netPay"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
