package repository

import "gorm.io/gorm"

// Repository เป็น base struct ที่เก็บ instance ของ gorm.DB
// Repository อื่น ๆ จะฝัง struct นี้เพื่อใช้ DB ได้ทันที
type Repository struct {
	DB *gorm.DB
}

// New สร้าง Repository ใหม่จาก gorm.DB
func New(db *gorm.DB) *Repository {
	return &Repository{DB: db}
}