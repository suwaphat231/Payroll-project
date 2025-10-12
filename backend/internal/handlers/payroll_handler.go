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
	"golang.org/x/crypto/bcrypt"
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
	adminPassHash, _ := bcrypt.GenerateFromPassword([]byte("Admin@123"), 10)

	if !strings.EqualFold(body.Email, adminEmail) || bcrypt.CompareHashAndPassword(adminPassHash, []byte(body.Password)) != nil {
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
		tax := gross * 0.05 // ภาษีตัวอย่าง 5%
		// ในขั้นนี้ยังไม่คิด SSO/PVD -> ใส่ 0 ไปก่อน
		sso := 0.0
		pvd := 0.0
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

// GET /api/v1/payroll/runs/period/:period/items
// period format: "2025-10" หรือ "2025-1"
func (h *PayrollHandler) ListRunItemsByPeriod(c *gin.Context) {
	period := c.Param("period")

	// Parse period (format: "YYYY-M" or "YYYY-MM")
	parts := strings.Split(period, "-")
	if len(parts) != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid period format, use YYYY-M"})
		return
	}

	year, err1 := strconv.Atoi(parts[0])
	month, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil || year <= 0 || month < 1 || month > 12 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid year or month"})
		return
	}

	// ค้นหา PayrollRun ด้วย period
	run, err := h.Store.GetPayrollRunByPeriod(year, month)
	if err != nil {
		// ถ้าไม่เจอ run สำหรับ period นี้ ให้สร้างอัตโนมัติและคำนวณ
		newRun := &models.PayrollRun{
			PeriodYear:  year,
			PeriodMonth: month,
			Locked:      false,
		}
		if createErr := h.Store.CreatePayrollRun(newRun); createErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create run"})
			return
		}

		// คำนวณ items อัตโนมัติ
		if calcErr := h.calculateRunItems(newRun); calcErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to calculate items"})
			return
		}

		run = newRun
	}

	// ดึง items ของ run นี้
	items, err := h.Store.ListPayrollItems(run.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// Helper function to calculate run items
func (h *PayrollHandler) calculateRunItems(run *models.PayrollRun) error {
	if err := h.Store.ClearPayrollItems(run.ID); err != nil {
		return err
	}

	ps, pe := monthStartEnd(run.PeriodYear, run.PeriodMonth)
	emps, err := h.Store.ListActiveEmployees()
	if err != nil {
		return err
	}

	for _, e := range emps {
		worked, total := overlapDays(e.HiredAt, e.TerminatedAt, ps, pe)
		if total <= 0 || worked <= 0 {
			continue
		}

		gross := e.BaseSalary * (float64(worked) / float64(total))
		tax := gross * 0.05
		sso := 0.0
		pvd := 0.0
		net := gross - tax - sso - pvd

		item := &models.PayrollItem{
			RunID:       run.ID,
			EmployeeID:  e.ID,
			BaseSalary:  round2(gross),
			TaxWithheld: round2(tax),
			SSO:         round2(sso),
			PVD:         round2(pvd),
			NetPay:      round2(net),
		}
		if err := h.Store.SavePayrollItem(item); err != nil {
			return err
		}
	}
	return nil
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
