// internal/db/connection.go
package db

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ใช้เมื่อมี DSN พร้อมอยู่แล้ว
func Connect(dsn string) (*gorm.DB, error) {
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

// สร้างการเชื่อมต่อจาก Environment Variables
// ถ้ามี DATABASE_URL อยู่จะใช้ค่านั้นก่อน (เช่น postgres://user:pass@host:5432/db?sslmode=disable)
func ConnectFromEnv() (*gorm.DB, error) {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return gorm.Open(postgres.Open(url), &gorm.Config{})
	}

	host := getenv("DB_HOST", "localhost")
	port := getenv("DB_PORT", "5432")
	user := getenv("DB_USER", "postgres")
	pass := getenv("DB_PASS", "postgres")
	name := getenv("DB_NAME", "payroll_db")
	ssl := getenv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, pass, name, ssl,
	)
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
