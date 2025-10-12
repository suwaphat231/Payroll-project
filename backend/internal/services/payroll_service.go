package services

import (
	"backend/internal/models"
	"backend/internal/payrollcalc"
	"backend/internal/repository"
	"errors"
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
	ps, pe, err := payrollcalc.MonthStartEnd(run.PeriodYear, run.PeriodMonth)
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

		worked, total := payrollcalc.OverlapDays(hire, e.TerminatedAt, ps, pe)
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
			BaseSalary:  payrollcalc.Round2(gross), // ใส่ยอดหลัง prorate ลง base_salary
			TaxWithheld: payrollcalc.Round2(tax),
			SSO:         payrollcalc.Round2(sso),
			PVD:         payrollcalc.Round2(pvd),
			NetPay:      payrollcalc.Round2(net),
			// GeneratedAt: ใช้ autoCreateTime ของ GORM
		}

		if err := s.Repo.SaveItem(item); err != nil {
			return count, err
		}
		count++
	}

	return count, nil
}
