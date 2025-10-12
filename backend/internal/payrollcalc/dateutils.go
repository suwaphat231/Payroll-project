package payrollcalc

import (
	"errors"
	"math"
	"time"
)

// MonthStartEnd returns the first and last day of the given month in the local timezone.
func MonthStartEnd(year, month int) (time.Time, time.Time, error) {
	if year < 1 || month < 1 || month > 12 {
		return time.Time{}, time.Time{}, errors.New("invalid payroll period")
	}
	loc := time.Local
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, loc)
	end := start.AddDate(0, 1, -1)
	return start, end, nil
}

// OverlapDays returns the number of worked days within the payroll period and total days in the period.
func OverlapDays(hire time.Time, end *time.Time, periodStart, periodEnd time.Time) (worked, total int) {
	loc := periodStart.Location()
	if loc == nil {
		loc = time.Local
	}

	startPeriod := normalizeDate(periodStart, loc)
	endPeriod := normalizeDate(periodEnd, loc)
	if endPeriod.Before(startPeriod) {
		return 0, 0
	}

	total = int(endPeriod.Sub(startPeriod).Hours()/24) + 1
	if total < 0 {
		total = 0
	}

	hireDate := normalizeDate(hire, loc)
	start := startPeriod
	if hireDate.After(start) {
		start = hireDate
	}

	var last time.Time
	if end != nil {
		endDate := normalizeDate(*end, loc)
		if endDate.Before(startPeriod) {
			return 0, total
		}
		last = endPeriod
		if endDate.Before(last) {
			last = endDate
		}
	} else {
		last = endPeriod
	}

	if last.Before(start) {
		return 0, total
	}

	worked = int(last.Sub(start).Hours()/24) + 1
	if worked < 0 {
		worked = 0
	}
	return worked, total
}

// Round2 rounds a float to two decimal places.
func Round2(n float64) float64 {
	return math.Round(n*100) / 100
}

func normalizeDate(t time.Time, loc *time.Location) time.Time {
	if loc == nil {
		loc = time.Local
	}
	if t.IsZero() {
		return time.Time{}
	}
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, loc)
}
