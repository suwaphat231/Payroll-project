package models

import "time"

type Employee struct { ID uint gorm:"primaryKey" json:"id" Code string gorm:"uniqueIndex" json:"code" FirstName string json:"firstName" LastName string json:"lastName" Active bool gorm:"default:true" json:"active" Employment *Employment gorm:"foreignKey:EmployeeID" json:"employment,omitempty" CreatedAt time.Time json:"createdAt" UpdatedAt time.Time json:"updatedAt" }

type Employment struct { ID uint gorm:"primaryKey" json:"id" EmployeeID uint gorm:"uniqueIndex" json:"employeeId" HireDate time.Time json:"hireDate" EndDate *time.Time json:"endDate,omitempty" BaseSalary float64 json:"baseSalary" CreatedAt time.Time json:"createdAt" UpdatedAt time.Time json:"updatedAt" }