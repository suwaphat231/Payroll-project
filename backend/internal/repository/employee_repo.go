package repository

import "backend/internal/models"

type EmployeeRepository struct {
	*Repository
}

func NewEmployeeRepository(dbRepo *Repository) *EmployeeRepository {
	return &EmployeeRepository{dbRepo}
}

// List ดึงพนักงานทั้งหมดพร้อมข้อมูล Employment
func (r *EmployeeRepository) List() ([]models.Employee, error) {
	return r.Store.ListEmployees()
}

// Create เพิ่มพนักงานใหม่
func (r *EmployeeRepository) Create(e *models.Employee) error {
	return r.Store.CreateEmployee(e)
}
