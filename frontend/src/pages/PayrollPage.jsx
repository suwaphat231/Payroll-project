import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../services/api";

// ------------ Helpers
function thb(n) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}

function monthKey({ year, month }) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// ------------ Component
export default function PayrollPage() {
  const today = new Date();
  const [period, setPeriod] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [currentRun, setCurrentRun] = useState(null);
  const [payrollItems, setPayrollItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState({});

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Load or create payroll run when period changes
  useEffect(() => {
    checkOrCreatePayrollRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function loadEmployees() {
    try {
      const response = await apiGet("/employees");
      // API returns {count, data, limit, offset, total}
      const empList = response?.data || [];
      setEmployees(empList);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError("ไม่สามารถโหลดข้อมูลพนักงานได้");
    }
  }

  async function checkOrCreatePayrollRun() {
    try {
      setLoading(true);
      setError("");

      // Create a new payroll run for this period
      const run = await apiPost("/payroll/runs", {
        year: period.year,
        month: period.month,
      }, { auth: true });

      setCurrentRun(run);

      // Try to calculate immediately
      if (run && run.id) {
        await calculatePayroll(run.id);
      }
    } catch (err) {
      console.error("Error with payroll run:", err);
      // If it already exists, that's okay
      setError("");
    } finally {
      setLoading(false);
    }
  }

  async function calculatePayroll(runId) {
    try {
      setLoading(true);
      await apiPost(`/payroll/runs/${runId}/calculate`, {}, { auth: true });
      await loadPayrollItems(runId);
    } catch (err) {
      console.error("Failed to calculate payroll:", err);
      setError("ไม่สามารถคำนวณ payroll ได้");
    } finally {
      setLoading(false);
    }
  }

  async function loadPayrollItems(runId) {
    try {
      const items = await apiGet(`/payroll/runs/${runId}/items`, { auth: true });
      setPayrollItems(items || []);
    } catch (err) {
      console.error("Failed to load payroll items:", err);
      setError("ไม่สามารถโหลดรายการ payroll ได้");
    }
  }

  async function handleRecalculate() {
    if (!currentRun || !currentRun.id) {
      setError("กรุณาเลือกงวดก่อน");
      return;
    }
    await calculatePayroll(currentRun.id);
  }

  function handleEditToggle(itemId) {
    setEditMode(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  function handleDeductionChange(itemId, field, value) {
    setPayrollItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: parseFloat(value) || 0 };
        // Recalculate net pay
        updated.netPay = updated.baseSalary - updated.taxWithheld - updated.sso - updated.pvd;
        return updated;
      }
      return item;
    }));
  }

  async function handleSaveItem(item) {
    try {
      setLoading(true);
      // Update individual payroll item
      await apiPost(`/payroll/items/${item.id}`, {
        taxWithheld: item.taxWithheld,
        sso: item.sso,
        pvd: item.pvd,
        netPay: item.netPay
      }, { auth: true });

      setEditMode(prev => ({ ...prev, [item.id]: false }));
      setError("");
    } catch (err) {
      console.error("Failed to save item:", err);
      setError("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCsv() {
    if (!currentRun || !currentRun.id) {
      setError("กรุณาเลือกงวดก่อน");
      return;
    }

    try {
      // Call backend to export CSV
      window.open(`${process.env.REACT_APP_API_URL}/payroll/runs/${currentRun.id}/export-bank-csv`, '_blank');
    } catch (err) {
      console.error("Failed to export CSV:", err);
      setError("ไม่สามารถ export CSV ได้");
    }
  }

  // Filter items
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payrollItems;
    return payrollItems.filter(item => {
      const emp = employees.find(e => e.id === item.employeeId);
      if (!emp) return false;
      return (
        emp.empCode?.toLowerCase().includes(q) ||
        emp.firstName?.toLowerCase().includes(q) ||
        emp.lastName?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q)
      );
    });
  }, [payrollItems, query, employees]);

  // Calculate totals
  const totals = useMemo(() => {
    return filtered.reduce((acc, item) => {
      acc.base += Number(item.baseSalary) || 0;
      acc.tax += Number(item.taxWithheld) || 0;
      acc.sso += Number(item.sso) || 0;
      acc.pvd += Number(item.pvd) || 0;
      acc.net += Number(item.netPay) || 0;
      return acc;
    }, { base: 0, tax: 0, sso: 0, pvd: 0, net: 0 });
  }, [filtered]);

  // Get employee info
  function getEmployee(empId) {
    return employees.find(e => e.id === empId) || {};
  }

  // UI ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">รันเงินเดือน (Payroll)</h1>
            <p className="text-sm text-slate-400">งวด: {monthKey(period)}</p>
            {currentRun && <p className="text-xs text-slate-500">Run ID: {currentRun.id}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period.year}
              onChange={e => setPeriod(p => ({ ...p, year: Number(e.target.value) }))}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            <select
              value={period.month}
              onChange={e => setPeriod(p => ({ ...p, month: Number(e.target.value) }))}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ค้นหา: โค้ด/ชื่อ/แผนก"
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400"
            />
            <button
              onClick={handleRecalculate}
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-lg disabled:opacity-50"
            >
              {loading ? "กำลังคำนวณ..." : "คำนวณใหม่"}
            </button>
            <button
              onClick={handleExportCsv}
              className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 shadow-lg"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.location.href = '/payslips'}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-lg"
            >
              ดู Payslips
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl bg-red-900/50 border border-red-700 p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Info panel */}
        <div className="rounded-2xl bg-slate-800/50 p-4 shadow-xl ring-1 ring-slate-700">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">จำนวนพนักงาน</p>
              <p className="text-lg font-semibold text-white">{employees.length} คน</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">รายการในงวดนี้</p>
              <p className="text-lg font-semibold text-white">{payrollItems.length} รายการ</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">สถานะ</p>
              <p className="text-lg font-semibold text-emerald-400">
                {currentRun?.locked ? "ล็อคแล้ว" : "ยังไม่ล็อค"}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl bg-slate-800/50 shadow-xl ring-1 ring-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/50 text-slate-300">
              <tr>
                <Th>รหัส</Th>
                <Th>ชื่อ-นามสกุล</Th>
                <Th>แผนก</Th>
                <Th>ตำแหน่ง</Th>
                <Th className="text-right">เงินเดือน</Th>
                <Th className="text-right">หัก SSO</Th>
                <Th className="text-right">หัก PVD</Th>
                <Th className="text-right">หัก Tax</Th>
                <Th className="text-right">รับสุทธิ</Th>
                <Th className="text-center">จัดการ</Th>
              </tr>
            </thead>
            <tbody>
              {loading && payrollItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const emp = getEmployee(item.employeeId);
                  const isEditing = editMode[item.id];
                  return (
                    <tr key={item.id} className="odd:bg-slate-800/30 even:bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 transition-colors">
                      <Td>{emp.empCode || "-"}</Td>
                      <Td>{emp.firstName} {emp.lastName}</Td>
                      <Td>{emp.department || "-"}</Td>
                      <Td>{emp.position || "-"}</Td>
                      <Td className="text-right">{thb(item.baseSalary)}</Td>
                      <Td className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.sso}
                            onChange={(e) => handleDeductionChange(item.id, 'sso', e.target.value)}
                            className="w-24 px-2 py-1 text-right bg-slate-700 border border-slate-600 rounded text-white"
                          />
                        ) : (
                          <span className="text-orange-400">{thb(item.sso)}</span>
                        )}
                      </Td>
                      <Td className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.pvd}
                            onChange={(e) => handleDeductionChange(item.id, 'pvd', e.target.value)}
                            className="w-24 px-2 py-1 text-right bg-slate-700 border border-slate-600 rounded text-white"
                          />
                        ) : (
                          <span className="text-orange-400">{thb(item.pvd)}</span>
                        )}
                      </Td>
                      <Td className="text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.taxWithheld}
                            onChange={(e) => handleDeductionChange(item.id, 'taxWithheld', e.target.value)}
                            className="w-24 px-2 py-1 text-right bg-slate-700 border border-slate-600 rounded text-white"
                          />
                        ) : (
                          <span className="text-orange-400">{thb(item.taxWithheld)}</span>
                        )}
                      </Td>
                      <Td className="text-right font-semibold text-emerald-400">{thb(item.netPay)}</Td>
                      <Td className="text-center">
                        {isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleSaveItem(item)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={() => handleEditToggle(item.id)}
                              className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditToggle(item.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
                          >
                            แก้ไข
                          </button>
                        )}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Totals */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900/80 font-medium text-white">
                  <Td colSpan={4}>รวม</Td>
                  <Td className="text-right">{thb(totals.base)}</Td>
                  <Td className="text-right">{thb(totals.sso)}</Td>
                  <Td className="text-right">{thb(totals.pvd)}</Td>
                  <Td className="text-right">{thb(totals.tax)}</Td>
                  <Td className="text-right text-emerald-400">{thb(totals.net)}</Td>
                  <Td></Td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------- Small UI parts
function Th({ children, className = "" }) {
  return <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return <td colSpan={colSpan} className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
