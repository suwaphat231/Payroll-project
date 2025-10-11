package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"backend/internal/models"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type EmployeeHandler struct {
	Store *storage.Storage
}

func NewEmployeeHandler(store *storage.Storage) *EmployeeHandler {
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

	// filter by q (code/first/last/email/position)
	if q != "" {
		qLow := strings.ToLower(q)
		filtered := make([]models.Employee, 0, len(emps))
		for _, e := range emps {
			if strings.Contains(strings.ToLower(e.Code), qLow) ||
				strings.Contains(strings.ToLower(e.FirstName), qLow) ||
				strings.Contains(strings.ToLower(e.LastName), qLow) ||
				strings.Contains(strings.ToLower(e.Email), qLow) ||
				strings.Contains(strings.ToLower(e.Position), qLow) {
				filtered = append(filtered, e)
			}
		}
		emps = filtered
	}

	// pagination
	if offset < 0 {
		offset = 0
	}
	if limit <= 0 {
		limit = 50
	}
	end := offset + limit
	if offset > len(emps) {
		offset = len(emps)
	}
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
		Code      string  `json:"code" binding:"required"`
		FirstName string  `json:"firstName" binding:"required"`
		LastName  string  `json:"lastName" binding:"required"`
		Email     string  `json:"email"`
		Phone     string  `json:"phone"`
		Position  string  `json:"position"`
		Department string `json:"department"`
		Salary    float64 `json:"salary"`
		Active    *bool   `json:"active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "detail": err.Error()})
		return
	}

	if req.Salary < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "salary must be >= 0"})
		return
	}

	active := true
	if req.Active != nil {
		active = *req.Active
	}

	emp := &models.Employee{
		Code:       strings.TrimSpace(req.Code),
		FirstName:  strings.TrimSpace(req.FirstName),
		LastName:   strings.TrimSpace(req.LastName),
		Email:      strings.TrimSpace(req.Email),
		Phone:      strings.TrimSpace(req.Phone),
		Department: strings.TrimSpace(req.Department),
		Position:   strings.TrimSpace(req.Position),
		Salary:     req.Salary,
		Active:     active,
	}

	if err := h.Store.CreateEmployee(emp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create employee"})
		return
	}

	c.JSON(http.StatusCreated, emp)
}
