package repository

import (
	"backend/internal/models"
)

type PayslipRepository struct {
	*Repository
}

func NewPayslipRepository(dbRepo *Repository) *PayslipRepository {
	return &PayslipRepository{dbRepo}
}

// ListByRun ดึง payslips ทั้งหมดของ payroll run
func (r *PayslipRepository) ListByRun(runID uint) ([]models.Payslip, error) {
	var slips []models.Payslip
	err := r.DB.Where("run_id = ?", runID).Find(&slips).Error
	return slips, err
}

// Create บันทึก payslip ใหม่
func (r *PayslipRepository) Create(slip *models.Payslip) error {
	return r.DB.Create(slip).Error
}

// FindByEmployeeAndRun ดึง payslip ของพนักงานใน run ที่กำหนด
func (r *PayslipRepository) FindByEmployeeAndRun(empID, runID uint) (*models.Payslip, error) {
	var slip models.Payslip
	if err := r.DB.Where("employee_id = ? AND run_id = ?", empID, runID).First(&slip).Error; err != nil {
		return nil, err
	}
	return &slip, nil
}

// DeleteByRun ลบ payslips ทั้งหมดของ run
func (r *PayslipRepository) DeleteByRun(runID uint) error {
	return r.DB.Where("run_id = ?", runID).Delete(&models.Payslip{}).Error
}