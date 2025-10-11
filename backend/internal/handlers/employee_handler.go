package handlers

import (
	"net/http"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type EmployeeHandler struct {
	Repo *repository.EmployeeRepository
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
	c.JSON(http.StatusOK, emps)
}

func (h *EmployeeHandler) Create(c *gin.Context) {
	var body struct {
		Code           string  `json:"code"`
		FirstName      string  `json:"firstName"`
		LastName       string  `json:"lastName"`
		Email          string  `json:"email"`
		Phone          string  `json:"phone"`
		Department     string  `json:"department"`
		Position       string  `json:"position"`
		EmploymentType string  `json:"employmentType"`
		Status         string  `json:"status"`
		BaseSalary     float64 `json:"baseSalary"`
		HireDate       string  `json:"hireDate"`
		Address        string  `json:"address"`
		Notes          string  `json:"notes"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	if strings.TrimSpace(body.Code) == "" || strings.TrimSpace(body.FirstName) == "" || strings.TrimSpace(body.LastName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required fields"})
		return
	}

	if body.BaseSalary < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "baseSalary must be >= 0"})
		return
	}

	hire, err := time.Parse(time.RFC3339, body.HireDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hireDate"})
		return
	}

	status := body.Status
	if status == "" {
		status = "Active"
	}

	emp := models.Employee{
		Code:           strings.TrimSpace(body.Code),
		FirstName:      strings.TrimSpace(body.FirstName),
		LastName:       strings.TrimSpace(body.LastName),
		Email:          strings.TrimSpace(body.Email),
		Phone:          strings.TrimSpace(body.Phone),
		Department:     strings.TrimSpace(body.Department),
		Position:       strings.TrimSpace(body.Position),
		EmploymentType: strings.TrimSpace(body.EmploymentType),
		Status:         status,
		Active:         !strings.EqualFold(status, "Resigned"),
		Address:        strings.TrimSpace(body.Address),
		Notes:          strings.TrimSpace(body.Notes),
		Employment: &models.Employment{
			HireDate:   hire,
			BaseSalary: body.BaseSalary,
		},
	}

	if err := h.Repo.Create(&emp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "create failed"})
		return
	}

	c.JSON(http.StatusCreated, emp)
}
