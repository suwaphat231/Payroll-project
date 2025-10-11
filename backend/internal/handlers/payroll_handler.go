package handlers

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/repository"
	"backend/internal/services"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type PayrollHandler struct {
	PRepo *repository.PayrollRepository
	Svc   *services.PayrollService
}

func NewPayrollHandler(store *storage.Storage) *PayrollHandler {
	base := repository.New(store)
	prepo := repository.NewPayrollRepository(base)
	return &PayrollHandler{
		PRepo: prepo,
		Svc:   services.NewPayrollService(prepo),
	}
}

// POST /api/auth/login
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

// POST /api/payroll/runs
// body รองรับ 2 แบบ:
// 1) {"year":2025,"month":9}
// 2) {"payDate":"2025-09"} หรือ "2025-09-30" หรือ RFC3339
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

	// แปลง payDate -> year/month ถ้ายังไม่ระบุ
	if (body.Year == 0 || body.Month == 0) && body.PayDate != nil && *body.PayDate != "" {
		if t, err := time.Parse("2006-01-02", *body.PayDate); err == nil {
			body.Year = t.Year()
			body.Month = int(t.Month())
		} else if t2, err2 := time.Parse("2006-01", *body.PayDate); err2 == nil {
			body.Year = t2.Year()
			body.Month = int(t2.Month())
		} else if t3, err3 := time.Parse(time.RFC3339, *body.PayDate); err3 == nil {
			body.Year = t3.Year()
			body.Month = int(t3.Month())
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

	if err := h.PRepo.CreateRun(&run); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "create run failed"})
		return
	}
	c.JSON(http.StatusCreated, run)
}

// POST /api/payroll/runs/:id/calculate
func (h *PayrollHandler) CalculateRun(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	count, err := h.Svc.CalculateRun(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"calculated": count})
}

// GET /api/payroll/runs/:id/items
func (h *PayrollHandler) ListRunItems(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	items, err := h.PRepo.ListItems(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}
	c.JSON(http.StatusOK, items)
}

// POST /api/payroll/runs/:id/export-bank-csv
func (h *PayrollHandler) ExportBankCSV(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	items, err := h.PRepo.ListItems(uint(id))
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
