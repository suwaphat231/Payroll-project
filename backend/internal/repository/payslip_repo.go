package repository

import "backend/internal/models"

type PayslipRepository struct {
	*Repository
}

func NewPayslipRepository(dbRepo *Repository) *PayslipRepository {
	return &PayslipRepository{dbRepo}
}

// ListByRun ดึง payslips ทั้งหมดของ payroll run
func (r *PayslipRepository) ListByRun(runID uint) ([]models.Payslip, error) {
	return r.Store.ListPayslipsByRun(runID)
}

// Create บันทึก payslip ใหม่
func (r *PayslipRepository) Create(slip *models.Payslip) error {
	return r.Store.CreatePayslip(slip)
}

// FindByEmployeeAndRun ดึง payslip ของพนักงานใน run ที่กำหนด
func (r *PayslipRepository) FindByEmployeeAndRun(empID, runID uint) (*models.Payslip, error) {
	return r.Store.FindPayslip(empID, runID)
}

// DeleteByRun ลบ payslips ทั้งหมดของ run
func (r *PayslipRepository) DeleteByRun(runID uint) error {
	return r.Store.DeletePayslipsByRun(runID)
}
