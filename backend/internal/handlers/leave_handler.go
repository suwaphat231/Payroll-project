package handlers

import (
	"net/http"

	"backend/internal/models"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type LeaveHandler struct {
	Store storage.Port
}

func NewLeaveHandler(store storage.Port) *LeaveHandler {
	return &LeaveHandler{Store: store}
}

// GET /api/v1/leave
func (h *LeaveHandler) List(c *gin.Context) {
	out, err := h.Store.ListLeaves()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}
	c.JSON(http.StatusOK, out)
}

// POST /api/v1/leave
func (h *LeaveHandler) Create(c *gin.Context) {
	var lv models.Leave
	if err := c.ShouldBindJSON(&lv); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if err := h.Store.CreateLeave(&lv); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}
	c.JSON(http.StatusCreated, lv)
}
