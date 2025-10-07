package models

import "time"

type Leave struct { ID uint gorm:"primaryKey" json:"id" EmployeeID uint json:"employeeId" Type string json:"type" StartDate time.Time json:"startDate" EndDate time.Time json:"endDate" Hours float64 json:"hours" Status string json:"status" CreatedAt time.Time json:"createdAt" UpdatedAt time.Time json:"updatedAt" }