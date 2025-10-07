package handlers

import ( "net/http" "time"

"backend/internal/models"
"backend/internal/repository"
"github.com/gin-gonic/gin"
"gorm.io/gorm"

Copy

)

type EmployeeHandler struct { Repo *repository.EmployeeRepository }

func NewEmployeeHandler(db *gorm.DB) *EmployeeHandler { base := repository.New(db) return &EmployeeHandler{Repo: repository.NewEmployeeRepository(base)} }

func (h *EmployeeHandler) List(c *gin.Context) { emps, err := h.Repo.List() if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"}) return } c.JSON(http.StatusOK, emps) }

func (h *EmployeeHandler) Create(c *gin.Context) 
{ var body struct { Code string json:"code" FirstName string json:"firstName" LastName string json:"lastName" BaseSalary float64 json:"baseSalary" HireDate string json:"hireDate" } 
if err := c.ShouldBindJSON(&body); 
err != nil || body.Code == "" || body.FirstName == "" || body.LastName == "" { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"}) return } hire, 
err := time.Parse(time.RFC3339, body.HireDate) 
if err != nil { c.JSON(http.StatusBadRequest, 
	gin.H{"error": "invalid hireDate"}) return } 
	e := models.Employee{ Code: body.Code, 
		FirstName: body.FirstName, 
		LastName: body.LastName, 
		Active: true, 
		Employment: &models.Employment{ HireDate: hire, BaseSalary: body.BaseSalary, }, } 
		if err := h.Repo.Create(&e); 
		err != nil { c.JSON(http.StatusBadRequest, 
			gin.H{"error": "create failed"}) return } c.JSON(http.StatusCreated, e) }