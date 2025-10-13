package main

import (
	"log"
	"net/http"
	"os"
	"time"

	appdb "backend/internal/db"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/models"
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
		seedSampleData(store) // เพิ่ม sample employees
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
		secured.POST("/payroll/runs/:id/export-bank-csv", payH.ExportBankCSV)
		secured.POST("/payroll/items/:id", payH.UpdatePayrollItem)

		// Payslips
		secured.GET("/payslips/:runId", psH.ListByRun)
		secured.GET("/payslips/:runId/:employeeId", psH.GetByEmployee)

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

func seedSampleData(store storage.Port) {
	log.Println("🌱 Seeding sample employees...")

	employees := []struct {
		empCode    string
		firstName  string
		lastName   string
		department string
		position   string
		baseSalary float64
		bankAcc    string
	}{
		{"E001", "สมชาย", "ใจดี", "IT", "Senior Developer", 50000, "001-234567-8"},
		{"E002", "สมหญิง", "รักสงบ", "HR", "HR Manager", 45000, "001-345678-9"},
		{"E003", "ประเสริฐ", "มั่นคง", "Accounting", "Accountant", 40000, "001-456789-0"},
		{"E004", "วิไล", "สว่างใจ", "IT", "Junior Developer", 30000, "001-567890-1"},
		{"E005", "ธนากร", "มีเงิน", "Finance", "Financial Analyst", 48000, "001-678901-2"},
	}

	for _, emp := range employees {
		e := &models.Employee{
			EmpCode:     emp.empCode,
			FirstName:   emp.firstName,
			LastName:    emp.lastName,
			Department:  emp.department,
			Position:    emp.position,
			BaseSalary:  emp.baseSalary,
			Status:      "active",
			BankAccount: emp.bankAcc,
			HiredAt:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		}
		if err := store.CreateEmployee(e); err != nil {
			log.Printf("⚠️  Failed to seed employee %s: %v", emp.empCode, err)
		}
	}

	log.Println("✅ Sample data seeded successfully!")
}
