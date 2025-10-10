package handlers

import (
	"net/http"
	"time"

	"backend/internal/models"
	"backend/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type EmployeeHandler struct {
	DB *gorm.DB
}

func NewEmployeeHandler(db *gorm.DB) *EmployeeHandler {
	base := repository.New(db)
	return &EmployeeHandler{Repo: repository.NewEmployeeRepository(base)}
}

func (h *EmployeeHandler) List(c *gin.Context) {
	emps, err := h.Repo.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
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
	var body struct {
		Code      string  `json:"code"`
		FirstName string  `json:"firstName"`
		LastName  string  `json:"lastName"`
		BaseSalary float64 `json:"baseSalary"`
		HireDate  string  `json:"hireDate"`
	}

	if err := c.ShouldBindJSON(&body); err != nil || body.Code == "" || body.FirstName == "" || body.LastName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	var req updateEmployeeReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "detail": err.Error()})
		return
	}

	e := models.Employee{
		Code:      body.Code,
		FirstName: body.FirstName,
		LastName:  body.LastName,
		Active:    true,
		Employment: &models.Employment{
			HireDate:   hire,
			BaseSalary: body.BaseSalary,
		},
	}

	if err := h.Repo.Create(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "create failed"})
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
