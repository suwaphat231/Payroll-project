package handlers

import (
	"net/http"
	"strconv"

	"backend/internal/repository"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type PayslipHandler struct {
	Repo *repository.PayslipRepository
}

func NewPayslipHandler(store *storage.Storage) *PayslipHandler {
	base := repository.New(store)
	return &PayslipHandler{Repo: repository.NewPayslipRepository(base)}
}

// GET /api/payslips/:runId
func (h *PayslipHandler) ListByRun(c *gin.Context) {
	runID, _ := strconv.Atoi(c.Param("runId"))
	items, err := h.Repo.ListByRun(uint(runID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}
	c.JSON(http.StatusOK, items)
}
