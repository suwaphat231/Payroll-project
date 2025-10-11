package main

import (
	"log"
	"net/http"
	"os"

	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

func main() {
	port := getenv("PORT", "3000")
	jwtSecret := getenv("JWT_SECRET", "dev_secret")

	log.Printf("Starting Payroll Backend (in-memory mode) on port %s", port)

	// ใช้ in-memory store
	store := storage.New()

	middleware.SetJWTSecret(jwtSecret)

	r := gin.Default()
	enableCORS(r)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	registerRoutes(r, store)

	log.Printf("Server ready at http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func enableCORS(r *gin.Engine) {
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})
}

func registerRoutes(r *gin.Engine, store *storage.Storage) {
    empH := handlers.NewEmployeeHandler(store)
    payH := handlers.NewPayrollHandler(store)
    psH := handlers.NewPayslipHandler(store)
    lvH := handlers.NewLeaveHandler(store)

    api := r.Group("/api")
    {
        api.POST("/auth/login", payH.Login)

        secured := api.Group("/")
        if os.Getenv("NO_AUTH") != "1" {         // ← เพิ่ม 3 บรรทัดนี้
            secured.Use(middleware.AuthRequired())
        }

        secured.GET("/employees", empH.List)
        secured.POST("/employees", empH.Create)

        secured.POST("/payroll/runs", payH.CreateRun)
        secured.POST("/payroll/runs/:id/calculate", payH.CalculateRun)
        secured.GET("/payroll/runs/:id/items", payH.ListRunItems)
        secured.POST("/payroll/runs/:id/export-bank-csv", payH.ExportBankCSV)

        secured.GET("/payslips/:runId", psH.ListByRun)
        secured.GET("/leave", lvH.List)
        secured.POST("/leave", lvH.Create)
    }
}
