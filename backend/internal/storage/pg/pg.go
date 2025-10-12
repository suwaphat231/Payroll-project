package pg

import (
	"errors"

	"backend/internal/models"

	"gorm.io/gorm"
)

type Storage struct {
	DB *gorm.DB
}

func New(db *gorm.DB) *Storage { return &Storage{DB: db} }

// ---------- Employees ----------
func (s *Storage) CreateEmployee(e *models.Employee) error {
	return s.DB.Create(e).Error
}
func (s *Storage) ListEmployees() ([]models.Employee, error) {
	var out []models.Employee
	return out, s.DB.Order("id ASC").Find(&out).Error
}
func (s *Storage) ListActiveEmployees() ([]models.Employee, error) {
	var out []models.Employee
	return out, s.DB.Where("status = ?", "active").Order("id ASC").Find(&out).Error
}

// ---------- Payroll Runs ----------
func (s *Storage) CreatePayrollRun(run *models.PayrollRun) error {
	return s.DB.Create(run).Error
}
func (s *Storage) GetPayrollRun(id uint) (*models.PayrollRun, error) {
	var run models.PayrollRun
	if err := s.DB.First(&run, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("payroll run not found")
		}
		return nil, err
	}
	return &run, nil
}
func (s *Storage) GetPayrollRunByPeriod(year, month int) (*models.PayrollRun, error) {
	var run models.PayrollRun
	if err := s.DB.Where("period_year = ? AND period_month = ?", year, month).First(&run).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("payroll run not found for period")
		}
		return nil, err
	}
	return &run, nil
}

// ---------- Payroll Items (payslips) ----------
func (s *Storage) ClearPayrollItems(runID uint) error {
	return s.DB.Where("payroll_run_id = ?", runID).Delete(&models.PayrollItem{}).Error
}
func (s *Storage) SavePayrollItem(item *models.PayrollItem) error {
	return s.DB.Create(item).Error
}
func (s *Storage) ListPayrollItems(runID uint) ([]models.PayrollItem, error) {
	var out []models.PayrollItem
	return out, s.DB.Preload("Employee").Where("payroll_run_id = ?", runID).Order("id ASC").Find(&out).Error
}

// ---------- Payslips (ถ้าใช้งาน) ----------
func (s *Storage) CreatePayslip(slip *models.Payslip) error {
	return s.DB.Create(slip).Error
}
func (s *Storage) ListPayslipsByRun(runID uint) ([]models.Payslip, error) {
	var out []models.Payslip
	return out, s.DB.Where("run_id = ?", runID).Order("id ASC").Find(&out).Error
}
func (s *Storage) FindPayslip(empID, runID uint) (*models.Payslip, error) {
	var p models.Payslip
	if err := s.DB.Where("employee_id = ? AND run_id = ?", empID, runID).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}
func (s *Storage) DeletePayslipsByRun(runID uint) error {
	return s.DB.Where("run_id = ?", runID).Delete(&models.Payslip{}).Error
}

// ---------- Leaves ----------
func (s *Storage) CreateLeave(lv *models.Leave) error {
	return s.DB.Create(lv).Error
}
func (s *Storage) ListLeaves() ([]models.Leave, error) {
	var out []models.Leave
	return out, s.DB.Order("id ASC").Find(&out).Error
}
