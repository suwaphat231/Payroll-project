package models

import "time"

type Employment struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	EmployeeID   uint       `gorm:"uniqueIndex;not null" json:"employeeId"`

	// ==== วันที่เริ่มงาน ====
	// ชื่อที่ service ต้องการ:
	HireDate     time.Time  `json:"hireDate"`
	// ชื่อเดิม (คงไว้เพื่อ backward compatibility):
	StartDate    time.Time  `json:"startDate"`

	EndDate      *time.Time `json:"endDate"`
	ContractType string     `json:"contractType"` // permanent/contract

	// ==== เงินเดือน ====
	// ชื่อที่ service ต้องการ:
	BaseSalary   float64    `json:"baseSalary"`
	// ชื่อเดิม (คงไว้เพื่อ backward compatibility):
	Salary       float64    `json:"salary"`

	Allowance    float64    `json:"allowance"`
	TaxRate      float64    `json:"taxRate"`
	SSOPercent   float64    `json:"ssoPercent"`
	PVDPercent   float64    `json:"pvdPercent"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// ใช้ pointer เพื่อเลี่ยง recursive size
	Employee *Employee `gorm:"constraint:OnDelete:CASCADE;" json:"-"`
}
