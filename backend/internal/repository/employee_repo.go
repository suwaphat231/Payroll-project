package repository

import "backend/internal/models"

type EmployeeRepository struct {
	*Repository
}

func NewEmployeeRepository(repo *Repository) *EmployeeRepository {
	return &EmployeeRepository{repo}
}

// List ดึงพนักงานทั้งหมด (in-memory)
func (r *EmployeeRepository) List() ([]models.Employee, error) {
	return r.Store.ListEmployees()
}

// Create เพิ่มพนักงานใหม่ (in-memory)
func (r *EmployeeRepository) Create(e *models.Employee) error {
	return r.Store.CreateEmployee(e)
}
