package services

import (
	"backend/internal/models"
	"backend/internal/repository"
	"errors"
	"math"
	"time"
)

type PayrollService struct {
	Repo *repository.PayrollRepository
}

func NewPayrollService(repo *repository.PayrollRepository) *PayrollService {
	return &PayrollService{Repo: repo}
}

// CalculateRun คำนวณ payroll run และสร้าง PayrollItem
func (s *PayrollService) CalculateRun(runID uint) (int, error) {
	run, err := s.Repo.GetRunByID(runID)
	if err != nil {
		return 0, errors.New("run not found")
	}

	// ลบ items เก่าก่อน
	if err := s.Repo.ClearItems(run.ID); err != nil {
		return 0, err
	}

	emps, err := s.Repo.ListActiveEmployees()
	if err != nil {
		return 0, err
	}

	count := 0
	for _, e := range emps {
		if e.Employment == nil {
			continue
		}

		worked, total := overlapDays(e.Employment.HireDate, e.Employment.EndDate, run.PeriodStart, run.PeriodEnd)
		if total <= 0 || worked <= 0 {
			continue
		}

		// คำนวณเงินเดือนตามสัดส่วนวันทำงาน
		gross := e.Employment.BaseSalary * (float64(worked) / float64(total))
		tax := gross * 0.05
		net := gross - tax

		item := &models.PayrollItem{
			RunID:       run.ID,
			EmployeeID:  e.ID,
			Gross:       round2(gross),
			TaxWithheld: round2(tax),
			NetPay:      round2(net),
			Details:     "base prorated; tax 5%",
		}

		if err := s.Repo.SaveItem(item); err != nil {
			return count, err
		}
		count++
	}

	return count, nil
}

// overlapDays คำนวณจำนวนวันทำงานที่ซ้อนกับ period
func overlapDays(hire time.Time, end *time.Time, ps, pe time.Time) (worked, total int) {
	total = int(pe.Sub(ps).Hours()/24) + 1
	if total < 0 {
		total = 0
	}

	start := maxTime(ps, hire)
	var last time.Time
	if end != nil {
		if end.Before(ps) {
			return 0, total
		}
		last = minTime(pe, *end)
	} else {
		last = pe
	}

	w := int(last.Sub(start).Hours()/24) + 1
	if w < 0 {
		w = 0
	}
	return w, total
}

func maxTime(a, b time.Time) time.Time {
	if a.After(b) {
		return a
	}
	return b
}

func minTime(a, b time.Time) time.Time {
	if a.Before(b) {
		return a
	}
	return b
}

func round2(n float64) float64 {
	return math.Round(n*100) / 100
}
