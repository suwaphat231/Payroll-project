package db

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

// Migrate applies the database schema required by the application.
func Migrate(conn *gorm.DB) error {
	return conn.AutoMigrate(
		&models.Employee{},
		&models.Employment{},
		&models.PayrollRun{},
		&models.PayrollItem{},
		&models.Payslip{},
		&models.Leave{},
	)
}
