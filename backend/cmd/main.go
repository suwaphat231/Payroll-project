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
	// อ่านค่า environment variable หรือใช้ค่า default
	port := getenv("PORT", "3000")
	jwtSecret := getenv("JWT_SECRET", "dev_secret")

	log.Printf("🚀 Starting Payroll Backend on port %s", port)

	// ใช้ in-memory store (ตอนนี้ยังไม่ได้เชื่อม DB จริง)
	store := storage.New()

	// ตั้งค่า JWT secret ให้ middleware
	middleware.SetJWTSecret(jwtSecret)

	// สร้าง Gin router
	r := gin.Default()
	enableCORS(r)

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// ✅ Register routes ทั้งหมด
	registerRoutes(r, store)

	log.Printf("✅ Server ready at http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

// ฟังก์ชันช่วยอ่านค่า env
func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

// เปิด CORS (อนุญาตให้ frontend เข้ามาเรียก API ได้)
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

// ✅ ตรงนี้คือส่วนที่แก้: registerRoutes เป็น /api/v1 แทน /api
func registerRoutes(r *gin.Engine, store *storage.Storage) {
	empH := handlers.NewEmployeeHandler(store)
	payH := handlers.NewPayrollHandler(store)
	psH := handlers.NewPayslipHandler(store)
	lvH := handlers.NewLeaveHandler(store)

	// เปลี่ยนเป็น /api/v1
	api := r.Group("/api/v1")
	{
		// public route
		api.POST("/auth/login", payH.Login)

		// secured group (ยกเว้นถ้า NO_AUTH=1)
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
		secured.POST("/payroll/runs/:id/export-bank-csv", payH.ExportBankCSV)

		// Payslips
		secured.GET("/payslips/:runId", psH.ListByRun)

		// Leaves
		secured.GET("/leave", lvH.List)
		secured.POST("/leave", lvH.Create)
	}
}
