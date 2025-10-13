package handlers

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

// PayrollHandler จัดการ endpoint เกี่ยวกับการจ่ายเงินเดือน
type PayrollHandler struct {
	Store storage.Port
}

func NewPayrollHandler(store storage.Port) *PayrollHandler {
	return &PayrollHandler{Store: store}
}

// POST /api/v1/auth/login
func (h *PayrollHandler) Login(c *gin.Context) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	adminEmail := "admin@example.com"
	adminPassword := "Admin@123"

	if !strings.EqualFold(body.Email, adminEmail) || body.Password != adminPassword {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := middleware.GenerateToken(1, "ADMIN", body.Email, 8*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    1,
			"name":  "Administrator",
			"email": strings.ToLower(body.Email),
			"role":  "admin",
		},
	})
}

// POST /api/v1/payroll/runs
// body: {"year":2025,"month":10} หรือ {"payDate":"2025-10"} / "2025-10-31"
func (h *PayrollHandler) CreateRun(c *gin.Context) {
	var body struct {
		Year    int     `json:"year"`
		Month   int     `json:"month"`
		PayDate *string `json:"payDate"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	if (body.Year == 0 || body.Month == 0) && body.PayDate != nil && *body.PayDate != "" {
		if t, err := time.Parse("2006-01-02", *body.PayDate); err == nil {
			body.Year, body.Month = t.Year(), int(t.Month())
		} else if t2, err2 := time.Parse("2006-01", *body.PayDate); err2 == nil {
			body.Year, body.Month = t2.Year(), int(t2.Month())
		} else if t3, err3 := time.Parse(time.RFC3339, *body.PayDate); err3 == nil {
			body.Year, body.Month = t3.Year(), int(t3.Month())
		}
	}
	if body.Year <= 0 || body.Month < 1 || body.Month > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "year/month is required and must be valid"})
		return
	}

	// Check if run already exists
	existingRun, err := h.Store.GetPayrollRunByPeriod(body.Year, body.Month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if existingRun != nil {
		// Return existing run
		c.JSON(http.StatusOK, existingRun)
		return
	}

	// Create new run
	run := models.PayrollRun{
		PeriodYear:  body.Year,
		PeriodMonth: body.Month,
		Locked:      false,
	}
	if err := h.Store.CreatePayrollRun(&run); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "create run failed"})
		return
	}
	c.JSON(http.StatusCreated, run)
}

// POST /api/v1/payroll/runs/:id/calculate
func (h *PayrollHandler) CalculateRun(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	run, err := h.Store.GetPayrollRun(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "run not found"})
		return
	}

	if err := h.Store.ClearPayrollItems(run.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "clear items failed"})
		return
	}

	ps, pe := monthStartEnd(run.PeriodYear, run.PeriodMonth)

	emps, err := h.Store.ListActiveEmployees()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "list employees failed"})
		return
	}

	count := 0
	for _, e := range emps {
		worked, total := overlapDays(e.HiredAt, e.TerminatedAt, ps, pe)
		if total <= 0 || worked <= 0 {
			continue
		}

		// เงินเดือนตามสัดส่วนวันทำงาน
		gross := e.BaseSalary * (float64(worked) / float64(total))

		// คำนวณประกันสังคม (SSO): สูงสุด 750 บาท (เงินเดือน 15,000 บาท x 5%)
		sso := calculateSSO(gross)

		// คำนวณกองทุนสำรองเลี้ยงชีพ (PVD): 3% ของเงินเดือน (ตัวอย่าง)
		pvd := gross * 0.03

		// คำนวณภาษี: 5% ของเงินเดือนหลังหัก SSO และ PVD
		taxableIncome := gross - sso - pvd
		tax := calculateTax(taxableIncome)

		net := gross - tax - sso - pvd

		item := &models.PayrollItem{
			RunID:       run.ID,
			EmployeeID:  e.ID,
			BaseSalary:  round2(gross), // ใส่ยอดหลัง prorate ลงคอลัมน์ base_salary
			TaxWithheld: round2(tax),
			SSO:         round2(sso),
			PVD:         round2(pvd),
			NetPay:      round2(net),
			// GeneratedAt: autoCreateTime โดย GORM
		}
		if err := h.Store.SavePayrollItem(item); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "save item failed"})
			return
		}
		count++
	}

	c.JSON(http.StatusOK, gin.H{"calculated": count})
}

// GET /api/v1/payroll/runs/:id/items
func (h *PayrollHandler) ListRunItems(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	items, err := h.Store.ListPayrollItems(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// POST /api/v1/payroll/runs/:id/export-bank-csv
func (h *PayrollHandler) ExportBankCSV(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	items, err := h.Store.ListPayrollItems(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	_ = w.Write([]string{"employee_code", "name", "bank_code", "amount", "ref"})

	for _, it := range items {
		row := []string{
			fmt.Sprintf("%d", it.EmployeeID),
			fmt.Sprintf("Employee-%d", it.EmployeeID),
			"XXX",
			fmt.Sprintf("%.2f", it.NetPay),
			fmt.Sprintf("RUN-%d", it.RunID),
		}
		_ = w.Write(row)
	}
	w.Flush()

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=payroll%d.csv", id))
	c.String(http.StatusOK, buf.String())
}

// POST /api/v1/payroll/items/:id
func (h *PayrollHandler) UpdatePayrollItem(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))

	var body struct {
		TaxWithheld float64 `json:"taxWithheld"`
		SSO         float64 `json:"sso"`
		PVD         float64 `json:"pvd"`
		NetPay      float64 `json:"netPay"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	// Get existing item
	item, err := h.Store.GetPayrollItem(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}

	// Update fields
	item.TaxWithheld = round2(body.TaxWithheld)
	item.SSO = round2(body.SSO)
	item.PVD = round2(body.PVD)
	item.NetPay = round2(body.NetPay)

	// Save
	if err := h.Store.UpdatePayrollItem(item); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// ------------------ helpers ------------------

// monthStartEnd คืนวันที่เริ่มและสิ้นสุดของเดือนนั้น ๆ
func monthStartEnd(year, month int) (time.Time, time.Time) {
	loc := time.UTC
	start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, loc)
	end := start.AddDate(0, 1, -1)
	return start, end
}

// overlapDays: คำนวณจำนวนวันทำงานที่ซ้อนกับช่วง ps..pe (นับแบบรวมปลายทั้งสองด้าน)
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
		if end.Before(pe) {
			last = *end
		} else {
			last = pe
		}
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

func round2(n float64) float64 {
	return math.Round(n*100) / 100
}

// calculateSSO คำนวณประกันสังคม
// อัตรา 5% ของเงินเดือน แต่สูงสุดไม่เกิน 750 บาท (ฐาน 15,000 บาท)
func calculateSSO(grossSalary float64) float64 {
	maxBase := 15000.0
	rate := 0.05

	base := grossSalary
	if base > maxBase {
		base = maxBase
	}

	return base * rate
}

// calculateTax คำนวณภาษีหัก ณ ที่จ่าย
// ใช้อัตราแบบง่าย: 5% ของรายได้หลังหักค่าลดหย่อน
func calculateTax(taxableIncome float64) float64 {
	if taxableIncome <= 0 {
		return 0
	}

	// อัตราภาษีแบบง่าย
	// รายได้ถึง 150,000 บาท/ปี (12,500/เดือน) = ยกเว้น
	monthlyExemption := 12500.0
	if taxableIncome <= monthlyExemption {
		return 0
	}

	// เกิน 12,500 บาท คิด 5%
	return (taxableIncome - monthlyExemption) * 0.05
}
