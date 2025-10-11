package models

import "time"

type Employment struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	EmployeeID   uint       `gorm:"uniqueIndex;not null" json:"employeeId"` // 1:1 กับพนักงาน
	HireDate     time.Time  `json:"hireDate"`   // สำหรับ service ที่เรียกใช้
	StartDate    time.Time  `json:"startDate"`  // คงไว้เพื่อ backward compatibility
	EndDate      *time.Time `json:"endDate"`
	ContractType string     `json:"contractType"`

	BaseSalary   float64    `json:"baseSalary"` // สำหรับ service ที่เรียกใช้
	Salary       float64    `json:"salary"`     // คงไว้เพื่อ backward compatibility
	Allowance    float64    `json:"allowance"`
	TaxRate      float64    `json:"taxRate"`
	SSOPercent   float64    `json:"ssoPercent"`
	PVDPercent   float64    `json:"pvdPercent"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	// pointer เพื่อเลี่ยง recursive type
	Employee *Employee `gorm:"constraint:OnDelete:CASCADE;" json:"-"`
}
