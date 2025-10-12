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
		// มีข้อมูลแล้ว ไม่ seed ซ้ำ
		return nil
	}

	now := time.Now()

	employees := []models.Employee{
		{
			EmpCode:         "E001",
			FirstName:       "สมชาย",
			LastName:        "สุขใจ",
			Department:      "ฝ่ายบุคคล",
			Position:        "HR Manager",
			BaseSalary:      50000,
			BankAccount:     "123-456-7890",
			PVDRate:         0.03, // ตาม default ก็ได้
			WithholdingRate: 0.00,
			SSOEnabled:      true,
			Status:          "active",
			HiredAt:         now.AddDate(-2, 0, 0),
		},
		{
			EmpCode:         "E002",
			FirstName:       "สุดา",
			LastName:        "ดีงาม",
			Department:      "ฝ่ายบัญชี",
			Position:        "Accountant",
			BaseSalary:      40000,
			BankAccount:     "987-654-3210",
			PVDRate:         0.03,
			WithholdingRate: 0.00,
			SSOEnabled:      true,
			Status:          "active",
			HiredAt:         now.AddDate(-1, -3, 0),
		},
		{
			EmpCode:         "E003",
			FirstName:       "อนันต์",
			LastName:        "มีชัย",
			Department:      "ฝ่ายไอที",
			Position:        "Developer",
			BaseSalary:      60000,
			BankAccount:     "111-222-3333",
			PVDRate:         0.03,
			WithholdingRate: 0.00,
			SSOEnabled:      true,
			Status:          "active",
			HiredAt:         now.AddDate(-1, 0, 0),
		},
		{
			EmpCode:         "E004",
			FirstName:       "กมล",
			LastName:        "ใจดี",
			Department:      "ฝ่ายขาย",
			Position:        "Sales Executive",
			BaseSalary:      45000,
			BankAccount:     "222-333-4444",
			PVDRate:         0.03,
			WithholdingRate: 0.00,
			SSOEnabled:      true,
			Status:          "active",
			HiredAt:         now.AddDate(-2, -6, 0),
		},
		{
			EmpCode:         "E005",
			FirstName:       "พรทิพย์",
			LastName:        "รุ่งเรือง",
			Department:      "ฝ่ายการเงิน",
			Position:        "Finance Officer",
			BaseSalary:      48000,
			BankAccount:     "555-666-7777",
			PVDRate:         0.03,
			WithholdingRate: 0.00,
			SSOEnabled:      true,
			Status:          "active",
			HiredAt:         now.AddDate(-3, 0, 0),
		},
	}

	return conn.Transaction(func(tx *gorm.DB) error {
		if err := tx.CreateInBatches(employees, len(employees)).Error; err != nil {
			return err
		}
		return nil
	})

}
