package handlers

import (
	"net/http"
	"strconv"

	"backend/internal/repository"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PayslipHandler struct {
	Repo *repository.PayslipRepository
}

func NewPayslipHandler(db *gorm.DB) *PayslipHandler {
	base := repository.New(db)
	return &PayslipHandler{Repo: repository.NewPayslipRepository(base)}
}

// GET /api/payslips/:runId
func (h *PayslipHandler) ListByRun(c *gin.Context) {
	runID, _ := strconv.Atoi(c.Param("runId"))
	items, err := h.Repo.ListByRun(uint(runID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db error"})
		return
	}
	c.JSON(http.StatusOK, items)
}