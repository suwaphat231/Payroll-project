package handlers

import (
	"net/http"
	"time"

	"backend/internal/models"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type LeaveHandler struct {
	Store *storage.Storage
}

func NewLeaveHandler(store *storage.Storage) *LeaveHandler {
	return &LeaveHandler{Store: store}
}

func (h *LeaveHandler) List(c *gin.Context) {
	leaves, err := h.Store.ListLeaves()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": leaves})
}

func (h *LeaveHandler) Create(c *gin.Context) {
	var body struct {
		EmployeeID uint   `json:"employeeId"`
		StartDate  string `json:"startDate"`
		EndDate    string `json:"endDate"`
		Reason     string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.EmployeeID == 0 || body.StartDate == "" || body.EndDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	start, err1 := time.Parse(time.RFC3339, body.StartDate)
	end, err2 := time.Parse(time.RFC3339, body.EndDate)
	if err1 != nil || err2 != nil || end.Before(start) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dates"})
		return
	}

	leave := models.Leave{
		EmployeeID: body.EmployeeID,
		StartDate:  start,
		EndDate:    end,
		Reason:     body.Reason,
	}

	if err := h.Store.CreateLeave(&leave); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": leave})
}
