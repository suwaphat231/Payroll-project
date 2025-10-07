package repository

import ( "backend/internal/models" )

type PayrollRepository struct{ *Repository }

func NewPayrollRepository(dbRepo *Repository) *PayrollRepository { return &PayrollRepository{dbRepo} }

func (r *PayrollRepository) CreateRun(run *models.PayrollRun) error { return r.DB.Create(run).Error }

func (r *PayrollRepository) GetRunByID(id uint) (*models.PayrollRun, error) { var run models.PayrollRun if err := r.DB.First(&run, id).Error; err != nil { return nil, err } return &run, nil }

func (r *PayrollRepository) ClearItems(runID uint) error { return r.DB.Where("run_id = ?", runID).Delete(&models.PayrollItem{}).Error }

func (r *PayrollRepository) SaveItem(item *models.PayrollItem) error { return r.DB.Create(item).Error }

func (r *PayrollRepository) ListItems(runID uint) ([]models.PayrollItem, error) { var items []models.PayrollItem err := r.DB.Where("run_id = ?", runID).Find(&items).Error return items, err }

func (r *PayrollRepository) ListActiveEmployees() ([]models.Employee, error) { var emps []models.Employee err := r.DB.Preload("Employment").Where("active = ?", true).Find(&emps).Error return emps, err }