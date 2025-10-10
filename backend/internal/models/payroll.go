package models

import "time"

type PayrollRun struct {
	ID          uint          `gorm:"primaryKey" json:"id"`
	PeriodStart time.Time     `json:"periodStart"`
	PeriodEnd   time.Time     `json:"periodEnd"`
	PayDate     time.Time     `json:"payDate"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`

	// บอก GORM ให้ชัดเจนว่า relation ใช้ RunID ชี้มาที่ ID ของ PayrollRun
	Items []PayrollItem `gorm:"foreignKey:RunID;references:ID;constraint:OnDelete:CASCADE" json:"items"`
}

type PayrollItem struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	RunID      uint      `gorm:"index;not null" json:"runId"`
	EmployeeID uint      `gorm:"index;not null" json:"employeeId"`

	Gross       float64   `json:"gross"`
	TaxWithheld float64   `json:"taxWithheld"`
	NetPay      float64   `json:"netPay"`
	Details     string    `json:"details"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type PayrollItem struct {
	ID         uint    `gorm:"primaryKey" json:"id"`
	RunID      uint    `gorm:"index" json:"runId"`
	EmployeeID uint    `gorm:"index" json:"employeeId"`
	NetPay     float64 `json:"netPay"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
