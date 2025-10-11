package db

import (
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
)

// Seed inserts demo data so the UI has meaningful content on first launch.
func Seed(conn *gorm.DB) error {
	var count int64
	if err := conn.Model(&models.Employee{}).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	employees := []models.Employee{
		{
			Code:           "EMP-0001",
			FirstName:      "Somchai",
			LastName:       "Prasert",
			Email:          "somchai@example.com",
			Phone:          "0812345678",
			Department:     "Finance",
			Position:       "Payroll Officer",
			EmploymentType: "Full-time",
			Status:         "Active",
			Active:         true,
			Employment: &models.Employment{
				HireDate:   time.Now().AddDate(-2, -3, 0),
				BaseSalary: 32000,
			},
		},
		{
			Code:           "EMP-0002",
			FirstName:      "Suda",
			LastName:       "Chaiyo",
			Email:          "suda@example.com",
			Phone:          "0891112222",
			Department:     "Engineering",
			Position:       "Software Engineer",
			EmploymentType: "Full-time",
			Status:         "Active",
			Active:         true,
			Employment: &models.Employment{
				HireDate:   time.Now().AddDate(-1, 0, 0),
				BaseSalary: 45000,
			},
		},
		{
			Code:           "EMP-0003",
			FirstName:      "Anan",
			LastName:       "Sritong",
			Email:          "anan@example.com",
			Phone:          "0867778888",
			Department:     "Operations",
			Position:       "Ops Specialist",
			EmploymentType: "Full-time",
			Status:         "On Leave",
			Active:         true,
			Employment: &models.Employment{
				HireDate:   time.Now().AddDate(-3, -6, 0),
				BaseSalary: 28000,
			},
		},
	}

	for i := range employees {
		if err := conn.Create(&employees[i]).Error; err != nil {
			return err
		}
	}

	return nil
}
