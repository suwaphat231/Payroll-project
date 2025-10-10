package storage

import (
	"errors"
	"sort"
	"sync"
	"time"

	"backend/internal/models"
)

// Storage provides an in-memory persistence layer for the backend.
type Storage struct {
	mu sync.RWMutex

	nextEmployee    uint
	nextEmployment  uint
	nextPayrollRun  uint
	nextPayrollItem uint
	nextPayslip     uint
	nextLeave       uint

	employees    map[uint]*models.Employee
	payrollRuns  map[uint]*models.PayrollRun
	payrollItems map[uint]map[uint]*models.PayrollItem
	payslips     map[uint]*models.Payslip
	leaves       map[uint]*models.Leave
}

// New creates an empty Storage instance.
func New() *Storage {
	return &Storage{
		employees:    make(map[uint]*models.Employee),
		payrollRuns:  make(map[uint]*models.PayrollRun),
		payrollItems: make(map[uint]map[uint]*models.PayrollItem),
		payslips:     make(map[uint]*models.Payslip),
		leaves:       make(map[uint]*models.Leave),
	}
}

// CreateEmployee persists a new employee and its employment record if provided.
func (s *Storage) CreateEmployee(e *models.Employee) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.nextEmployee++
	e.ID = s.nextEmployee
	now := time.Now().UTC()
	e.CreatedAt = now
	e.UpdatedAt = now

	if e.Employment != nil {
		s.nextEmployment++
		e.Employment.ID = s.nextEmployment
		e.Employment.EmployeeID = e.ID
		e.Employment.CreatedAt = now
		e.Employment.UpdatedAt = now
	}

	cp := copyEmployee(e)
	s.employees[e.ID] = &cp
	return nil
}

// ListEmployees returns all employees.
func (s *Storage) ListEmployees() ([]models.Employee, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]models.Employee, 0, len(s.employees))
	for _, e := range s.employees {
		cp := copyEmployee(e)
		out = append(out, cp)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

// ListActiveEmployees returns employees flagged as active.
func (s *Storage) ListActiveEmployees() ([]models.Employee, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]models.Employee, 0, len(s.employees))
	for _, e := range s.employees {
		if !e.Active {
			continue
		}
		cp := copyEmployee(e)
		out = append(out, cp)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

// CreatePayrollRun stores a new payroll run.
func (s *Storage) CreatePayrollRun(run *models.PayrollRun) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.nextPayrollRun++
	run.ID = s.nextPayrollRun
	now := time.Now().UTC()
	run.CreatedAt = now
	run.UpdatedAt = now

	cp := *run
	s.payrollRuns[run.ID] = &cp
	return nil
}

// GetPayrollRun fetches a payroll run by ID.
func (s *Storage) GetPayrollRun(id uint) (*models.PayrollRun, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	run, ok := s.payrollRuns[id]
	if !ok {
		return nil, errors.New("payroll run not found")
	}
	cp := *run
	return &cp, nil
}

// ClearPayrollItems removes all items for a run.
func (s *Storage) ClearPayrollItems(runID uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.payrollItems, runID)
	return nil
}

// SavePayrollItem persists a payroll item for a run.
func (s *Storage) SavePayrollItem(item *models.PayrollItem) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.nextPayrollItem++
	item.ID = s.nextPayrollItem
	now := time.Now().UTC()
	item.CreatedAt = now
	item.UpdatedAt = now

	if _, ok := s.payrollItems[item.RunID]; !ok {
		s.payrollItems[item.RunID] = make(map[uint]*models.PayrollItem)
	}
	cp := *item
	s.payrollItems[item.RunID][item.ID] = &cp
	return nil
}

// ListPayrollItems returns items associated with a run.
func (s *Storage) ListPayrollItems(runID uint) ([]models.PayrollItem, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	bucket := s.payrollItems[runID]
	out := make([]models.PayrollItem, 0, len(bucket))
	for _, it := range bucket {
		cp := *it
		out = append(out, cp)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

// CreatePayslip stores a new payslip.
func (s *Storage) CreatePayslip(slip *models.Payslip) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.nextPayslip++
	slip.ID = s.nextPayslip
	now := time.Now().UTC()
	slip.CreatedAt = now
	slip.UpdatedAt = now

	cp := *slip
	s.payslips[slip.ID] = &cp
	return nil
}

// ListPayslipsByRun returns payslips for a payroll run.
func (s *Storage) ListPayslipsByRun(runID uint) ([]models.Payslip, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]models.Payslip, 0)
	for _, slip := range s.payslips {
		if slip.RunID != runID {
			continue
		}
		cp := *slip
		out = append(out, cp)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

// FindPayslip searches for a payslip by employee and run.
func (s *Storage) FindPayslip(empID, runID uint) (*models.Payslip, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, slip := range s.payslips {
		if slip.EmployeeID == empID && slip.RunID == runID {
			cp := *slip
			return &cp, nil
		}
	}
	return nil, errors.New("payslip not found")
}

// DeletePayslipsByRun removes payslips for a run.
func (s *Storage) DeletePayslipsByRun(runID uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for id, slip := range s.payslips {
		if slip.RunID == runID {
			delete(s.payslips, id)
		}
	}
	return nil
}

// CreateLeave saves a new leave entry.
func (s *Storage) CreateLeave(lv *models.Leave) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.nextLeave++
	lv.ID = s.nextLeave
	now := time.Now().UTC()
	lv.CreatedAt = now
	lv.UpdatedAt = now

	cp := *lv
	s.leaves[lv.ID] = &cp
	return nil
}

// ListLeaves returns every leave entry.
func (s *Storage) ListLeaves() ([]models.Leave, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	out := make([]models.Leave, 0, len(s.leaves))
	for _, lv := range s.leaves {
		cp := *lv
		out = append(out, cp)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

func copyEmployee(e *models.Employee) models.Employee {
	cp := *e
	if e.Employment != nil {
		emp := *e.Employment
		cp.Employment = &emp
	}
	return cp
}
