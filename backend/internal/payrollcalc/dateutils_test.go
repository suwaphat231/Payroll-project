package payrollcalc

import (
	"testing"
	"time"
)

func TestMonthStartEnd(t *testing.T) {
	start, end, err := MonthStartEnd(2025, 9)
	if err != nil {
		t.Fatalf("MonthStartEnd returned error: %v", err)
	}
	if start.Day() != 1 || start.Month() != time.September || start.Year() != 2025 {
		t.Fatalf("unexpected start date: %v", start)
	}
	if end.Day() != 30 || end.Month() != time.September || end.Year() != 2025 {
		t.Fatalf("unexpected end date: %v", end)
	}
}

func TestMonthStartEndInvalid(t *testing.T) {
	if _, _, err := MonthStartEnd(2025, 13); err == nil {
		t.Fatal("expected error for invalid month")
	}
}

func TestOverlapDaysHandlesTimezoneMismatch(t *testing.T) {
	// Payroll period created in UTC while employee dates are stored in a local timezone
	ps := time.Date(2025, time.September, 1, 0, 0, 0, 0, time.UTC)
	pe := time.Date(2025, time.September, 30, 0, 0, 0, 0, time.UTC)

	loc := time.FixedZone("Asia/Bangkok", 7*3600)
	hire := time.Date(2025, time.September, 1, 0, 0, 0, 0, loc)
	term := time.Date(2025, time.September, 15, 0, 0, 0, 0, loc)

	worked, total := OverlapDays(hire, &term, ps, pe)
	if total != 30 {
		t.Fatalf("expected total days 30, got %d", total)
	}
	if worked != 15 {
		t.Fatalf("expected worked days 15, got %d", worked)
	}
}

func TestOverlapDaysTerminatedBeforePeriod(t *testing.T) {
	ps := time.Date(2025, time.October, 1, 0, 0, 0, 0, time.UTC)
	pe := time.Date(2025, time.October, 31, 0, 0, 0, 0, time.UTC)

	hire := time.Date(2025, time.September, 1, 0, 0, 0, 0, time.UTC)
	term := time.Date(2025, time.September, 20, 0, 0, 0, 0, time.UTC)

	worked, total := OverlapDays(hire, &term, ps, pe)
	if worked != 0 {
		t.Fatalf("expected worked days 0, got %d", worked)
	}
	if total != 31 {
		t.Fatalf("expected total days 31, got %d", total)
	}
}
