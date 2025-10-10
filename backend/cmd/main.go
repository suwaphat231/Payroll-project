package main

import (
	"log"
	"net/http"
	"os"

	"backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func main() {
	// โหลด environment variables
	dsn := getenv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/payroll?sslmode=disable")
	port := getenv("PORT", "3000")
	jwtSecret := getenv("JWT_SECRET", "dev_secret")

	log.Printf("Starting Payroll Backend on port %s", port)
	log.Printf("Using database: %s", dsn)

	// เชื่อมต่อ DB
	gdb, err := db.Connect(dsn)
	if err != nil {
		log.Fatal(err)
	}

	// migrate schema (ลำดับให้ Employee มาก่อน Employment)
	if err := migrate(gdb); err != nil {
		log.Fatal(err)
	}

	// ตั้งค่า JWT middleware
	middleware.SetJWTSecret(jwtSecret)

	// สร้าง Gin router
	r := gin.Default()
	enableCORS(r)

	// health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// register routes
	registerRoutes(r, gdb)

	// run server
	log.Printf("Server ready at http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

// โหลด environment variable พร้อม fallback
func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

// migrate schema
func migrate(db *gorm.DB) error {
	// ลำดับสำคัญ: ตารางที่ถูกอ้างถึงมาก่อน
	return db.AutoMigrate(
		&models.Employee{},
		&models.Employment{},
		&models.PayrollRun{},
		&models.PayrollItem{},
	)
}

// เปิด CORS
func enableCORS(r *gin.Engine) {
	r.Use(func(c *gin.Context) {
		// ปรับตาม frontend ของคุณถ้าต้องการจำกัด origin
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		// ตอบ OPTIONS ทันทีเพื่อให้ preflight ผ่าน
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})
}

// register routes
func registerRoutes(r *gin.Engine, db *gorm.DB) {
	empH := handlers.NewEmployeeHandler(db)

	// NOTE: ด้านล่างสมมุติว่ามีไฟล์และฟังก์ชันเหล่านี้แล้ว
	// ถ้ายังไม่มี ให้คอมเมนต์ไว้ชั่วคราวเพื่อให้ build ผ่าน
	payH := handlers.NewPayrollHandler(db)
	psH := handlers.NewPayslipHandler(db)
	lvH := handlers.NewLeaveHandler(db)

	api := r.Group("/api")
	{
		// auth (ตัวอย่าง: ใช้ที่ PayrollHandler)
		api.POST("/auth/login", payH.Login)

		secured := api.Group("/")
		secured.Use(middleware.AuthRequired())

		// Employees
		secured.GET("/employees", empH.List)
		secured.POST("/employees", empH.Create)

		// Payroll
		secured.POST("/payroll/runs", payH.CreateRun)
		secured.POST("/payroll/runs/:id/calculate", payH.CalculateRun)
		secured.GET("/payroll/runs/:id/items", payH.ListRunItems)
		secured.POST("/payroll/runs/:id/export-bank-csv", payH.ExportBankCSV)

		// Payslip
		secured.GET("/payslips/:runId", psH.ListByRun)

		// Leave
		secured.GET("/leave", lvH.List)
		secured.POST("/leave", lvH.Create)
	}
}
