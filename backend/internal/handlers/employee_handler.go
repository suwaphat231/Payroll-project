package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"backend/internal/models"
)

type EmployeeHandler struct {
	DB *gorm.DB
}

func NewEmployeeHandler(db *gorm.DB) *EmployeeHandler {
	return &EmployeeHandler{DB: db}
}

// ====== Request payload ======

type createEmployeeReq struct {
	Code      string  `json:"code" binding:"required"`
	FirstName string  `json:"firstName" binding:"required"`
	LastName  string  `json:"lastName" binding:"required"`
	Email     string  `json:"email"`
	Position  string  `json:"position"`
	Salary    float64 `json:"salary"`
}

type updateEmployeeReq struct {
	Code      *string  `json:"code"`
	FirstName *string  `json:"firstName"`
	LastName  *string  `json:"lastName"`
	Email     *string  `json:"email"`
	Position  *string  `json:"position"`
	Salary    *float64 `json:"salary"`
}

// ====== Handlers expected by main.go ======

// GET /employees?q=..&limit=..&offset=..
func (h *EmployeeHandler) List(c *gin.Context) {
	var (
		employees []models.Employee
		q         = strings.TrimSpace(c.Query("q"))
		limitStr  = c.Query("limit")
		offsetStr = c.Query("offset")
	)

	limit := 50
	offset := 0
	if v, err := strconv.Atoi(limitStr); err == nil && v > 0 {
		limit = v
	}
	if v, err := strconv.Atoi(offsetStr); err == nil && v >= 0 {
		offset = v
	}

	tx := h.DB.Model(&models.Employee{})
	if q != "" {
		p := "%" + q + "%"
		// NOTE: ใช้ ILIKE สำหรับ Postgres (case-insensitive)
		tx = tx.Where(
			"code ILIKE ? OR first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ? OR position ILIKE ?",
			p, p, p, p, p,
		)
	}

	if err := tx.Limit(limit).Offset(offset).Order("id DESC").Find(&employees).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query employees"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   employees,
		"limit":  limit,
		"offset": offset,
		"count":  len(employees),
	})
}

// POST /employees
func (h *EmployeeHandler) Create(c *gin.Context) {
	var req createEmployeeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "detail": err.Error()})
		return
	}

	emp := models.Employee{
		Code:      req.Code,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Email:     req.Email,
		Position:  req.Position,
		Salary:    req.Salary,
	}

	if err := h.DB.Create(&emp).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to create employee", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, emp)
}

// ====== Optional extras (ใช้ได้เลยถ้าจะผูก route เพิ่ม) ======

// GET /employees/:id
func (h *EmployeeHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	var emp models.Employee
	if err := h.DB.First(&emp, "id = ?", idStr).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get employee"})
		return
	}
	c.JSON(http.StatusOK, emp)
}

// PUT /employees/:id
func (h *EmployeeHandler) Update(c *gin.Context) {
	idStr := c.Param("id")

	var emp models.Employee
	if err := h.DB.First(&emp, "id = ?", idStr).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get employee"})
		return
	}

	var req updateEmployeeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "detail": err.Error()})
		return
	}

	if req.Code != nil {
		emp.Code = *req.Code
	}
	if req.FirstName != nil {
		emp.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		emp.LastName = *req.LastName
	}
	if req.Email != nil {
		emp.Email = *req.Email
	}
	if req.Position != nil {
		emp.Position = *req.Position
	}
	if req.Salary != nil {
		emp.Salary = *req.Salary
	}

	if err := h.DB.Save(&emp).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to update employee", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, emp)
}

// DELETE /employees/:id
func (h *EmployeeHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	if err := h.DB.Delete(&models.Employee{}, "id = ?", idStr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete employee"})
		return
	}
	c.Status(http.StatusNoContent)
}
