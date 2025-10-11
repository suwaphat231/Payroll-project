package models

import (
	"time"

	"gorm.io/gorm"
)

type Employee struct {
	gorm.Model
	Code       string       `gorm:"uniqueIndex;size:50;not null" json:"code"`
	FirstName  string       `gorm:"size:100;not null" json:"firstName"`
	LastName   string       `gorm:"size:100;not null" json:"lastName"`
	Email      string       `gorm:"size:150" json:"email,omitempty"`
	Phone      string       `gorm:"size:50" json:"phone,omitempty"`
	Department string       `gorm:"size:100" json:"department,omitempty"`
	Position   string       `gorm:"size:100" json:"position,omitempty"`
	Salary     float64      `json:"salary"` // ใช้กับ in-memory handler ปัจจุบัน
	Address    string       `gorm:"size:255" json:"address,omitempty"`
	Notes      string       `gorm:"size:255" json:"notes,omitempty"`
	Active     bool         `gorm:"default:true" json:"active"`
	Employment *Employment  `json:"employment,omitempty"`
}

// ชื่อเต็มสำหรับฝั่ง frontend
func (e Employee) FullName() string {
	if e.LastName == "" {
		return e.FirstName
	}
	if e.FirstName == "" {
		return e.LastName
	}
	return e.FirstName + " " + e.LastName
}

type Employment struct {
	gorm.Model
	EmployeeID uint        `gorm:"uniqueIndex" json:"employeeId"`
	HireDate   time.Time   `json:"hireDate,omitempty"`
	EndDate    *time.Time  `json:"endDate,omitempty"`
	BaseSalary float64     `json:"baseSalary,omitempty"`
}
