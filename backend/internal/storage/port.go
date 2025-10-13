package storage

import "backend/internal/models"

// Port: อินเตอร์เฟซกลางที่ทั้ง in-memory และ Postgres ต้องทำให้ครบ
type Port interface {
	// Employees
	CreateEmployee(*models.Employee) error
	ListEmployees() ([]models.Employee, error)
	ListActiveEmployees() ([]models.Employee, error)

	// Payroll runs & items (ใช้ตาราง payslips เป็น items)
	CreatePayrollRun(*models.PayrollRun) error
	GetPayrollRun(uint) (*models.PayrollRun, error)
	GetPayrollRunByPeriod(year, month int) (*models.PayrollRun, error)
	ClearPayrollItems(uint) error
	SavePayrollItem(*models.PayrollItem) error
	ListPayrollItems(uint) ([]models.PayrollItem, error)
	GetPayrollItem(uint) (*models.PayrollItem, error)
	UpdatePayrollItem(*models.PayrollItem) error

	// Payslips (ถ้าคุณมี struct แยกใช้งาน)
	CreatePayslip(*models.Payslip) error
	ListPayslipsByRun(uint) ([]models.Payslip, error)
	FindPayslip(uint, uint) (*models.Payslip, error)
	DeletePayslipsByRun(uint) error

	// Leaves
	CreateLeave(*models.Leave) error
	ListLeaves() ([]models.Leave, error)
}
