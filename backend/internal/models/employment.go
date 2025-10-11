package models

import "time"

type Employment struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	EmployeeID   uint       `gorm:"uniqueIndex;not null" json:"employeeId"` // FK -> employees.id (1:1)
	HireDate     time.Time  `json:"hireDate"`   // ใช้งานจริง
	StartDate    time.Time  `json:"startDate"`  // คงไว้เพื่อ backward compatibility
	EndDate      *time.Time `json:"endDate"`
	ContractType string     `json:"contractType"`

	BaseSalary   float64    `json:"baseSalary"` // ใช้งานจริง
	Salary       float64    `json:"salary"`     // คงไว้เพื่อ backward compatibility
	Allowance    float64    `json:"allowance"`
	TaxRate      float64    `json:"taxRate"`
	SSOPercent   float64    `json:"ssoPercent"`
	PVDPercent   float64    `json:"pvdPercent"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// ให้ลบ parent แล้ว child หายตาม (CASCADE) + ไม่ serialize วน
	Employee *Employee `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;foreignKey:EmployeeID;references:ID" json:"-"`
}
