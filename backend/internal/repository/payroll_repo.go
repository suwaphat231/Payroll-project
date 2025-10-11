package repository

import (
	"backend/internal/models"
)

type PayrollRepository struct {
	*Repository
}

func NewPayrollRepository(dbRepo *Repository) *PayrollRepository {
	return &PayrollRepository{dbRepo}
}

// CreateRun สร้าง payroll run ใหม่
func (r *PayrollRepository) CreateRun(run *models.PayrollRun) error {
	return r.DB.Create(run).Error
}

// GetRunByID ดึง payroll run ตาม ID
func (r *PayrollRepository) GetRunByID(id uint) (*models.PayrollRun, error) {
	var run models.PayrollRun
	if err := r.DB.First(&run, id).Error; err != nil {
		return nil, err
	}
	return &run, nil
}

// ClearItems ลบ payroll items ทั้งหมดของ run
func (r *PayrollRepository) ClearItems(runID uint) error {
	return r.DB.Where("run_id = ?", runID).Delete(&models.PayrollItem{}).Error
}

// SaveItem บันทึก payroll item ใหม่
func (r *PayrollRepository) SaveItem(item *models.PayrollItem) error {
	return r.DB.Create(item).Error
}

// ListItems ดึง payroll items ของ run
func (r *PayrollRepository) ListItems(runID uint) ([]models.PayrollItem, error) {
	var items []models.PayrollItem
	err := r.DB.
		Preload("Employee").
		Preload("Employee.Employment").
		Where("run_id = ?", runID).
		Order("id ASC").
		Find(&items).Error
	return items, err
}

// ListActiveEmployees ดึงพนักงานที่ active พร้อมข้อมูล Employment
func (r *PayrollRepository) ListActiveEmployees() ([]models.Employee, error) {
	var emps []models.Employee
	err := r.DB.Preload("Employment").Where("active = ?", true).Find(&emps).Error
	return emps, err
}
