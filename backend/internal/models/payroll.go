package models

import "time"

type PayrollRun struct {
	ID          uint          `gorm:"primaryKey" json:"id"`
	PeriodStart time.Time     `json:"periodStart"`
	PeriodEnd   time.Time     `json:"periodEnd"`
	PayDate     time.Time     `json:"payDate"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`
	Items       []PayrollItem `gorm:"foreignKey:RunID;references:ID;constraint:OnDelete:CASCADE" json:"items"`
}

type PayrollItem struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	RunID       uint       `gorm:"index;not null" json:"runId"`
	EmployeeID  uint       `gorm:"index;not null" json:"employeeId"`
	Gross       float64    `json:"gross"`
	TaxWithheld float64    `json:"taxWithheld"`
	NetPay      float64    `json:"netPay"`
	Details     string     `json:"details,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`

	// Relations (pointer เพื่อป้องกัน recursive encode)
	Run      *PayrollRun `gorm:"foreignKey:RunID;references:ID" json:"run,omitempty"`
	Employee *Employee   `gorm:"foreignKey:EmployeeID;references:ID" json:"employee,omitempty"`
}
