package models

import (
    "time"
    "gorm.io/gorm"
)

type Employee struct {
    gorm.Model
    Name       string    `json:"name"`
    Email      string    `json:"email"`
    Active     bool      `json:"active"`
    Employment *Employment `json:"employment,omitempty"`
}

type Employment struct {
    ID         uint      `gorm:"primaryKey" json:"id"`
    EmployeeID uint      `gorm:"index" json:"employeeId"`
    HireDate   time.Time `json:"hireDate"`
    EndDate    *time.Time `json:"endDate,omitempty"`
    BaseSalary float64   `json:"baseSalary"`
}