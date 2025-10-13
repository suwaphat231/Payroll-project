package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type EmployeeHandler struct {
	Store storage.Port
}

func NewEmployeeHandler(store storage.Port) *EmployeeHandler {
	return &EmployeeHandler{Store: store}
}

// GET /employees?q=&limit=&offset=
func (h *EmployeeHandler) List(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	emps, err := h.Store.ListEmployees()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list employees"})
		return
	}

	if q != "" {
		qLow := strings.ToLower(q)
		filtered := make([]models.Employee, 0, len(emps))
		for _, e := range emps {
			if strings.Contains(strings.ToLower(e.EmpCode), qLow) ||
				strings.Contains(strings.ToLower(e.FirstName), qLow) ||
				strings.Contains(strings.ToLower(e.LastName), qLow) ||
				strings.Contains(strings.ToLower(e.Department), qLow) ||
				strings.Contains(strings.ToLower(e.Position), qLow) {
				filtered = append(filtered, e)
			}
		}
		emps = filtered
	}

	if offset < 0 {
		offset = 0
	}
	if limit <= 0 {
		limit = 50
	}
	if offset > len(emps) {
		offset = len(emps)
	}
	end := offset + limit
	if end > len(emps) {
		end = len(emps)
	}
	page := emps[offset:end]

	c.JSON(http.StatusOK, gin.H{
		"data":   page,
		"count":  len(page),
		"total":  len(emps),
		"limit":  limit,
		"offset": offset,
	})
}

// POST /employees
func (h *EmployeeHandler) Create(c *gin.Context) {
	var req struct {
		EmpCode         string   `json:"empCode" binding:"required"`
		FirstName       string   `json:"firstName" binding:"required"`
		LastName        string   `json:"lastName" binding:"required"`
		Department      string   `json:"department"`
		Position        string   `json:"position"`
		BaseSalary      float64  `json:"baseSalary" binding:"required"`
		BankAccount     string   `json:"bankAccount"`
		PVDRate         *float64 `json:"pvdRate"`
		WithholdingRate *float64 `json:"withholdingRate"`
		SSOEnabled      *bool    `json:"ssoEnabled"`
		Status          *string  `json:"status"`
		HiredAt         *string  `json:"hiredAt"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "detail": err.Error()})
		return
	}
	if req.BaseSalary < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "baseSalary must be >= 0"})
		return
	}

	pvd := 0.03
	if req.PVDRate != nil {
		pvd = *req.PVDRate
	}
	if pvd < 0 || pvd > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pvdRate must be between 0 and 1"})
		return
	}
	wh := 0.0
	if req.WithholdingRate != nil {
		wh = *req.WithholdingRate
	}
	if wh < 0 || wh > 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "withholdingRate must be between 0 and 1"})
		return
	}
	sso := true
	if req.SSOEnabled != nil {
		sso = *req.SSOEnabled
	}

	status := "active"
	if req.Status != nil && *req.Status != "" {
		if *req.Status != "active" && *req.Status != "terminated" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "status must be 'active' or 'terminated'"})
			return
		}
		status = *req.Status
	}

	var hiredAt time.Time
	if req.HiredAt != nil && *req.HiredAt != "" {
		if t, err := time.Parse("2006-01-02", *req.HiredAt); err == nil {
			hiredAt = t
		} else if t2, err2 := time.Parse(time.RFC3339, *req.HiredAt); err2 == nil {
			hiredAt = t2
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hiredAt format; use YYYY-MM-DD or RFC3339"})
			return
		}
	} else {
		hiredAt = time.Now()
	}

	emp := &models.Employee{
		EmpCode:         strings.TrimSpace(req.EmpCode),
		FirstName:       strings.TrimSpace(req.FirstName),
		LastName:        strings.TrimSpace(req.LastName),
		Department:      strings.TrimSpace(req.Department),
		Position:        strings.TrimSpace(req.Position),
		BaseSalary:      req.BaseSalary,
		BankAccount:     strings.TrimSpace(req.BankAccount),
		PVDRate:         pvd,
		WithholdingRate: wh,
		SSOEnabled:      sso,
		Status:          status,
		HiredAt:         hiredAt,
	}

	if err := h.Store.CreateEmployee(emp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create employee"})
		return
	}
	c.JSON(http.StatusCreated, emp)
}
