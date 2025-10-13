package repository

import "backend/internal/storage"

// Repository เป็น base struct ที่เก็บ instance ของ storage.Storage
// Repository อื่น ๆ จะฝัง struct นี้เพื่อใช้ storage ได้ทันที
type Repository struct {
	Store *storage.Storage
}

// New สร้าง Repository ใหม่จาก storage.Storage
func New(store *storage.Storage) *Repository {
	return &Repository{Store: store}
}
