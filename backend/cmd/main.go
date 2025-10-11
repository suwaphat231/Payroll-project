package main

import (
	"log"
	"net/http"
	"os"

	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	dsn := getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/payroll?sslmode=disable")
	port := getenv("PORT", "3000")
	jwtSecret := getenv("JWT_SECRET", "dev_secret")

	gdb, err := db.Connect(dsn)
	if err != nil {
		log.Fatal(err)
	}

	if err := db.Migrate(gdb); err != nil {
		log.Fatal(err)
	}

	if err := db.Seed(gdb); err != nil {
		log.Fatal(err)
	}

	middleware.SetJWTSecret(jwtSecret)

	r := gin.Default()
	enableCORS(r)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	empH := handlers.NewEmployeeHandler(gdb)
	payH := handlers.NewPayrollHandler(gdb)
	psH := handlers.NewPayslipHandler(gdb)
	lvH := handlers.NewLeaveHandler(gdb)

	api := r.Group("/api")
	{
		api.POST("/auth/login", payH.Login)

		secured := api.Group("/")
		secured.Use(middleware.AuthRequired())

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

	log.Printf("Listening on :%s", port)
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
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
}
