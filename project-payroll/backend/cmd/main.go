package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()

    // Health check
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    })

    // Employee route
    r.GET("/api/v1/employees", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "employees": []string{"Alice", "Bob", "Charlie"},
        })
    })

    r.Run(":8080")
}
