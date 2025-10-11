package models

import "gorm.io/gorm"

type Employee struct {
	gorm.Model
	Code       string       `gorm:"uniqueIndex;size:50;not null" json:"code"`
	FirstName  string       `gorm:"size:100;not null" json:"firstName"`
	LastName   string       `gorm:"size:100;not null" json:"lastName"`
	Email      string       `gorm:"size:150" json:"email"`
	Position   string       `gorm:"size:100" json:"position"`
	Salary     float64      `json:"salary"`

	// ✅ ใช้สำหรับเปิด/ปิดการใช้งานพนักงาน
	Active     bool         `gorm:"default:true" json:"active"`

	// has-one (pointer เพื่อตัด recursive size)
	Employment *Employment  `json:"employment"`
}
