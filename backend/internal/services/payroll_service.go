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
	if err != nil || run == nil {
		return 0, errors.New("run not found")
	}

	// หา periodStart/periodEnd จาก year/month ของ run
	ps, pe, err := monthStartEnd(run.PeriodYear, run.PeriodMonth)
	if err != nil {
		return 0, err
	}

	// ล้าง items เก่าก่อน
	if err := s.Repo.ClearItems(run.ID); err != nil {
		return 0, err
	}

	emps, err := s.Repo.ListActiveEmployees()
	if err != nil {
		return 0, err
	}

	count := 0
	for _, e := range emps {
		// ข้อมูลอยู่บน employees โดยตรง
		hire := e.HiredAt
		var end *time.Time = e.TerminatedAt

		worked, total := overlapDays(hire, end, ps, pe)
		if total <= 0 || worked <= 0 {
			continue
		}

		// เงินเดือนตามสัดส่วนวันทำงาน (prorate)
		gross := e.BaseSalary * (float64(worked) / float64(total))

		// ใช้อัตราภาษีรายบุคคล ถ้าไม่มีให้ fallback เป็น 5%
		rate := e.WithholdingRate
		if rate <= 0 {
			rate = 0.05
		}
		tax := gross * rate

		// ตอนนี้ยังไม่คิด SSO และ PVD -> ใส่ 0 ไว้ก่อน
		sso := 0.0
		pvd := 0.0

		net := gross - tax - sso - pvd

		item := &models.PayrollItem{
			RunID:       run.ID,
			EmployeeID:  e.ID,
			BaseSalary:  round2(gross), // ใส่ยอดหลัง prorate ลง base_salary
			TaxWithheld: round2(tax),
			SSO:         round2(sso),
			PVD:         round2(pvd),
			NetPay:      round2(net),
			// GeneratedAt: ใช้ autoCreateTime ของ GORM
		}

		if err := s.Repo.SaveItem(item); err != nil {
			return count, err
		}
		count++
	}

	return count, nil
}

// monthStartEnd คืนค่า (วันแรก, วันสุดท้าย) ของเดือนที่กำหนด (เวลา 00:00:00)
func monthStartEnd(year, month int) (time.Time, time.Time, error) {
	if year < 1 || month < 1 || month > 12 {
		return time.Time{}, time.Time{}, errors.New("invalid payroll period")
	}
	loc := time.Local
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, loc)
	end := start.AddDate(0, 1, -1) // วันสุดท้ายของเดือน
	return start, end, nil
}

// overlapDays คำนวณจำนวนวันทำงานที่ซ้อนกับ period (inclusive)
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
