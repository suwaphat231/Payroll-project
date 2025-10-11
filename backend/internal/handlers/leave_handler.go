package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type LeaveHandler struct {
	DB *gorm.DB
}

func NewLeaveHandler(db *gorm.DB) *LeaveHandler {
	return &LeaveHandler{DB: db}
}

func (h *LeaveHandler) List(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": []any{}})
}

func (h *LeaveHandler) Create(c *gin.Context) {
	c.JSON(http.StatusCreated, gin.H{"ok": true, "note": "TODO"})
}
