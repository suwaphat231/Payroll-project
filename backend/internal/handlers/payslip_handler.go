package handlers

import (
	"net/http"
	"strconv"

	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type PayslipHandler struct {
	Store storage.Port
}

func NewPayslipHandler(store storage.Port) *PayslipHandler {
	return &PayslipHandler{Store: store}
}

// GET /api/v1/payslips/:runId
func (h *PayslipHandler) ListByRun(c *gin.Context) {
	runID, _ := strconv.Atoi(c.Param("runId"))

	items, err := h.Store.ListPayrollItems(uint(runID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}
	c.JSON(http.StatusOK, items)
}
