package models

import "time"

type Payslip struct {
	ID         uint `gorm:"primaryKey" json:"id"`
	RunID      uint `gorm:"index" json:"runId"`
	EmployeeID uint `gorm:"index" json:"employeeId"`

	// รายละเอียดเงินเดือน
	BaseSalary float64 `json:"baseSalary"`
	Allowance  float64 `json:"allowance"`
	Deductions float64 `json:"deductions"`
	NetPay     float64 `json:"netPay"`

	// วันที่ออกสลิป
	PayDate   time.Time `json:"payDate"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
