package repository

import "backend/internal/models"

type PayrollRepository struct {
	*Repository
}

func NewPayrollRepository(repo *Repository) *PayrollRepository {
	return &PayrollRepository{repo}
}

// CreateRun สร้าง payroll run ใหม่
func (r *PayrollRepository) CreateRun(run *models.PayrollRun) error {
	return r.Store.CreatePayrollRun(run)
}

// GetRunByID ดึง payroll run ตาม ID
func (r *PayrollRepository) GetRunByID(id uint) (*models.PayrollRun, error) {
	return r.Store.GetPayrollRun(id)
}

// ClearItems ลบ payroll items ทั้งหมดของ run
func (r *PayrollRepository) ClearItems(runID uint) error {
	return r.Store.ClearPayrollItems(runID)
}

// SaveItem บันทึก payroll item ใหม่
func (r *PayrollRepository) SaveItem(item *models.PayrollItem) error {
	return r.Store.SavePayrollItem(item)
}

// ListItems ดึง payroll items ของ run
func (r *PayrollRepository) ListItems(runID uint) ([]models.PayrollItem, error) {
	return r.Store.ListPayrollItems(runID)
}

// ListActiveEmployees ดึงพนักงานที่ active พร้อมข้อมูล Employment
func (r *PayrollRepository) ListActiveEmployees() ([]models.Employee, error) {
	return r.Store.ListActiveEmployees()
}
