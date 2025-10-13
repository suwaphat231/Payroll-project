package models

import "time"

type Employee struct {
	ID              uint       `gorm:"primaryKey;column:id" json:"id"`
	EmpCode         string     `gorm:"column:emp_code;uniqueIndex;not null" json:"empCode"`
	FirstName       string     `gorm:"column:first_name;not null" json:"firstName"`
	LastName        string     `gorm:"column:last_name;not null" json:"lastName"`
	Department      string     `gorm:"column:department" json:"department"`
	Position        string     `gorm:"column:position" json:"position"`
	BaseSalary      float64    `gorm:"column:base_salary;not null" json:"baseSalary"`
	BankAccount     string     `gorm:"column:bank_account" json:"bankAccount"`
	PVDRate         float64    `gorm:"column:pvd_rate;default:0.03" json:"pvdRate"`
	WithholdingRate float64    `gorm:"column:withholding_rate;default:0" json:"withholdingRate"`
	SSOEnabled      bool       `gorm:"column:sso_enabled;default:true" json:"ssoEnabled"`
	Status          string     `gorm:"column:status;default:active" json:"status"`
	HiredAt         time.Time  `gorm:"column:hired_at;default:current_date" json:"hiredAt"`
	TerminatedAt    *time.Time `gorm:"column:terminated_at" json:"terminatedAt"`
}

// บังคับชื่อ table ให้ตรงกับ DDL (ถ้าโปรเจ็กต์ไม่ได้ตั้ง naming strategy เป็นพหูพจน์)
func (Employee) TableName() string { return "employees" }
