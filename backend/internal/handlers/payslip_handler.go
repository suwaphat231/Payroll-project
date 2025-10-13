package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"backend/internal/storage"

	"github.com/gin-gonic/gin"
)

type PayslipHandler struct {
	Store storage.Port
}

func NewPayslipHandler(store storage.Port) *PayslipHandler {
	return &PayslipHandler{Store: store}
}

// GET /api/v1/payslips/:runId
// Returns formatted payslips for display
func (h *PayslipHandler) ListByRun(c *gin.Context) {
	runID, _ := strconv.Atoi(c.Param("runId"))

	// Get payroll run info
	run, err := h.Store.GetPayrollRun(uint(runID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payroll run not found"})
		return
	}

	// Get payroll items
	items, err := h.Store.ListPayrollItems(uint(runID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}

	// Get all employees
	allEmployees, err := h.Store.ListEmployees()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load employees"})
		return
	}

	// Create employee map for quick lookup
	empMap := make(map[uint]interface{})
	for _, emp := range allEmployees {
		empMap[emp.ID] = map[string]interface{}{
			"id":         emp.ID,
			"empCode":    emp.EmpCode,
			"firstName":  emp.FirstName,
			"lastName":   emp.LastName,
			"department": emp.Department,
			"position":   emp.Position,
			"bank":       emp.BankAccount,
		}
	}

	// Build payslips
	payslips := make([]map[string]interface{}, 0, len(items))
	for _, item := range items {
		emp, ok := empMap[item.EmployeeID].(map[string]interface{})
		if !ok {
			continue
		}

		// Calculate period dates
		periodStart := time.Date(run.PeriodYear, time.Month(run.PeriodMonth), 1, 0, 0, 0, 0, time.UTC)
		periodEnd := periodStart.AddDate(0, 1, -1)
		payDate := periodEnd.AddDate(0, 0, 5) // Pay 5 days after period end

		payslip := map[string]interface{}{
			"id":         item.ID,
			"runId":      run.ID,
			"employeeId": item.EmployeeID,
			"company": map[string]interface{}{
				"name":    "Payroll Company Ltd.",
				"address": "123 Business Street\nBangkok 10110",
				"taxId":   "0105559999999",
			},
			"employee": map[string]interface{}{
				"code":       emp["empCode"],
				"name":       fmt.Sprintf("%s %s", emp["firstName"], emp["lastName"]),
				"position":   emp["position"],
				"department": emp["department"],
				"bank": map[string]interface{}{
					"name":    "Bank",
					"account": emp["bank"],
				},
			},
			"period": map[string]interface{}{
				"start":   periodStart.Format("2006-01-02"),
				"end":     periodEnd.Format("2006-01-02"),
				"payDate": payDate.Format("2006-01-02"),
			},
			"earnings": []map[string]interface{}{
				{"name": "Base Salary", "amount": item.BaseSalary},
			},
			"deductions": []map[string]interface{}{
				{"name": "Tax Withheld", "amount": item.TaxWithheld},
				{"name": "Social Security (SSO)", "amount": item.SSO},
				{"name": "Provident Fund (PVD)", "amount": item.PVD},
			},
			"netPay": item.NetPay,
			"notes":  fmt.Sprintf("Payslip for period %d/%d", run.PeriodMonth, run.PeriodYear),
		}
		payslips = append(payslips, payslip)
	}

	c.JSON(http.StatusOK, payslips)
}

// GET /api/v1/payslips/:runId/:employeeId
// Returns a single formatted payslip for a specific employee
func (h *PayslipHandler) GetByEmployee(c *gin.Context) {
	runID, _ := strconv.Atoi(c.Param("runId"))
	empID, _ := strconv.Atoi(c.Param("employeeId"))

	// Get payroll run info
	run, err := h.Store.GetPayrollRun(uint(runID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payroll run not found"})
		return
	}

	// Get all payroll items for the run
	items, err := h.Store.ListPayrollItems(uint(runID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "storage error"})
		return
	}

	// Find the specific employee's item
	var targetItem *struct {
		ID          uint
		BaseSalary  float64
		TaxWithheld float64
		SSO         float64
		PVD         float64
		NetPay      float64
	}
	for _, item := range items {
		if item.EmployeeID == uint(empID) {
			targetItem = &struct {
				ID          uint
				BaseSalary  float64
				TaxWithheld float64
				SSO         float64
				PVD         float64
				NetPay      float64
			}{
				ID:          item.ID,
				BaseSalary:  item.BaseSalary,
				TaxWithheld: item.TaxWithheld,
				SSO:         item.SSO,
				PVD:         item.PVD,
				NetPay:      item.NetPay,
			}
			break
		}
	}

	if targetItem == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payslip not found for this employee"})
		return
	}

	// Get employee details
	employees, err := h.Store.ListEmployees()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load employees"})
		return
	}

	var emp *struct {
		EmpCode    string
		FirstName  string
		LastName   string
		Department string
		Position   string
		Bank       string
	}
	for _, e := range employees {
		if e.ID == uint(empID) {
			emp = &struct {
				EmpCode    string
				FirstName  string
				LastName   string
				Department string
				Position   string
				Bank       string
			}{
				EmpCode:    e.EmpCode,
				FirstName:  e.FirstName,
				LastName:   e.LastName,
				Department: e.Department,
				Position:   e.Position,
				Bank:       e.BankAccount,
			}
			break
		}
	}

	if emp == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "employee not found"})
		return
	}

	// Calculate period dates
	periodStart := time.Date(run.PeriodYear, time.Month(run.PeriodMonth), 1, 0, 0, 0, 0, time.UTC)
	periodEnd := periodStart.AddDate(0, 1, -1)
	payDate := periodEnd.AddDate(0, 0, 5)

	payslip := map[string]interface{}{
		"id":         targetItem.ID,
		"runId":      run.ID,
		"employeeId": empID,
		"company": map[string]interface{}{
			"name":    "Payroll Company Ltd.",
			"address": "123 Business Street\nBangkok 10110",
			"taxId":   "0105559999999",
		},
		"employee": map[string]interface{}{
			"code":       emp.EmpCode,
			"name":       fmt.Sprintf("%s %s", emp.FirstName, emp.LastName),
			"position":   emp.Position,
			"department": emp.Department,
			"bank": map[string]interface{}{
				"name":    "Bank",
				"account": emp.Bank,
			},
		},
		"period": map[string]interface{}{
			"start":   periodStart.Format("2006-01-02"),
			"end":     periodEnd.Format("2006-01-02"),
			"payDate": payDate.Format("2006-01-02"),
		},
		"earnings": []map[string]interface{}{
			{"name": "Base Salary", "amount": targetItem.BaseSalary},
		},
		"deductions": []map[string]interface{}{
			{"name": "Tax Withheld", "amount": targetItem.TaxWithheld},
			{"name": "Social Security (SSO)", "amount": targetItem.SSO},
			{"name": "Provident Fund (PVD)", "amount": targetItem.PVD},
		},
		"netPay": targetItem.NetPay,
		"notes":  fmt.Sprintf("Payslip for period %d/%d", run.PeriodMonth, run.PeriodYear),
		"ytd": map[string]interface{}{
			"earnings":   0,
			"deductions": 0,
		},
	}

	c.JSON(http.StatusOK, payslip)
}
