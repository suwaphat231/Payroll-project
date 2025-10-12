package main

import (
	"log"
	"net/http"
	"os"

	appdb "backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/storage"
	pgstore "backend/internal/storage/pg"

	"github.com/gin-gonic/gin"
)

func main() {
	port := getenv("PORT", "3000")
	jwtSecret := getenv("JWT_SECRET", "dev_secret")

	// เลือก storage ตาม ENV
	var store storage.Port
	if os.Getenv("USE_DATABASE") == "1" {
		conn, err := appdb.NewGorm()
		if err != nil {
			log.Fatalf("db connect failed: %v", err)
		}
		log.Println("💾 Using PostgreSQL storage")
		store = pgstore.New(conn)
	} else {
		log.Println("💾 Using in-memory storage")
		store = storage.New() // in-memory implementation ที่คุณมีอยู่แล้ว
	}

	// JWT secret
	middleware.SetJWTSecret(jwtSecret)

	// Gin engine + CORS
	r := gin.Default()
	enableCORS(r)

	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// Handlers (ทุกตัวรับ storage.Port)
	empH := handlers.NewEmployeeHandler(store)
	payH := handlers.NewPayrollHandler(store)
	psH := handlers.NewPayslipHandler(store)
	lvH := handlers.NewLeaveHandler(store)

	// Routes
	api := r.Group("/api/v1")
	{
		// public
		api.POST("/auth/login", payH.Login)

		// secured
		secured := api.Group("/")
		if os.Getenv("NO_AUTH") != "1" {
			secured.Use(middleware.AuthRequired())
		}

		// Employees
		secured.GET("/employees", empH.List)
		secured.POST("/employees", empH.Create)

		// Payroll
		secured.POST("/payroll/runs", payH.CreateRun)
		secured.POST("/payroll/runs/:id/calculate", payH.CalculateRun)
		secured.GET("/payroll/runs/:id/items", payH.ListRunItems)
		secured.GET("/payroll/runs/period/:period/items", payH.ListRunItemsByPeriod)
		secured.POST("/payroll/runs/:id/export-bank-csv", payH.ExportBankCSV)

		// Payslips
		secured.GET("/payslips/:runId", psH.ListByRun)

		// Leaves
		secured.GET("/leave", lvH.List)
		secured.POST("/leave", lvH.Create)
	}

	log.Printf("✅ Server ready at http://localhost:%s", port)
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
