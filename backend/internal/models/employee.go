package models

import "time"

// Employee represents an employee record in the payroll system.
type Employee struct {
	ID         uint        `json:"id"`
	Code       string      `json:"code"`
	FirstName  string      `json:"firstName"`
	LastName   string      `json:"lastName"`
	Email      string      `json:"email,omitempty"`
	Active     bool        `json:"active"`
	Employment *Employment `json:"employment,omitempty"`
	CreatedAt  time.Time   `json:"createdAt"`
	UpdatedAt  time.Time   `json:"updatedAt"`
}

// Employment stores employment specific information for an employee.
type Employment struct {
	ID         uint       `json:"id"`
	EmployeeID uint       `json:"employeeId"`
	HireDate   time.Time  `json:"hireDate"`
	EndDate    *time.Time `json:"endDate,omitempty"`
	BaseSalary float64    `json:"baseSalary"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}
