package repository

import ( "backend/internal/models" )

type EmployeeRepository struct{ *Repository }

func NewEmployeeRepository(dbRepo *Repository) *EmployeeRepository { return &EmployeeRepository{dbRepo} }

func (r *EmployeeRepository) List() ([]models.Employee, error) { var out []models.Employee err := r.DB.Preload("Employment").Find(&out).Error return out, err }

func (r *EmployeeRepository) Create(e *models.Employee) error { return r.DB.Create(e).Error }