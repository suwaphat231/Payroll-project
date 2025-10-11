package models

import (
	"time"

	"gorm.io/gorm"
)

type Employee struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
	Code           string         `gorm:"uniqueIndex" json:"code"`
	FirstName      string         `json:"firstName"`
	LastName       string         `json:"lastName"`
	Email          string         `json:"email,omitempty"`
	Phone          string         `json:"phone,omitempty"`
	Department     string         `json:"department,omitempty"`
	Position       string         `json:"position,omitempty"`
	EmploymentType string         `json:"employmentType,omitempty"`
	Status         string         `json:"status"`
	Active         bool           `json:"active"`
	Address        string         `json:"address,omitempty"`
	Notes          string         `json:"notes,omitempty"`
	Employment     *Employment    `gorm:"constraint:OnDelete:CASCADE" json:"employment,omitempty"`
}

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
	ID         uint       `gorm:"primaryKey" json:"id"`
	EmployeeID uint       `gorm:"uniqueIndex" json:"employeeId"`
	HireDate   time.Time  `json:"hireDate"`
	EndDate    *time.Time `json:"endDate,omitempty"`
	BaseSalary float64    `json:"baseSalary"`
}
