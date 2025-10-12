import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../services/api"; // ใช้ฟังก์ชัน API ที่มีอยู่

// ------------ Helpers
function thb(n) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(n);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computeRow(row, rates) {
  // row จาก backend จะมี: baseSalary, taxWithheld, sso, pvd, netPay, employee
  return {
    id: row.id,
    employeeId: row.employeeId,
    empCode: row.employee?.empCode || "",
    name: row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : "",
    department: row.employee?.department || "",
    position: row.employee?.position || "",
    gross: row.baseSalary || 0,
    tax: row.taxWithheld || 0,
    sso: row.sso || 0,
    pvd: row.pvd || 0,
    net: row.netPay || 0,
    status: row.status || "Draft",
  };
}

function monthKey({ year, month }) {
  return `${year}-${month}`;
}

// ------------ Component
export default function PayrollPage({
  defaultRates = { ssoRate: 0.05, ssoCap: 750, taxRate: 0.05 },
}) {
  const today = new Date();
  const [period, setPeriod] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const [rates, setRates] = useState(defaultRates);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // ดึงข้อมูลพนักงานและ payroll runs จาก API
  useEffect(() => {
    async function fetchPayrollData() {
      setLoading(true);
      try {
        const periodKey = monthKey(period);
        const data = await apiGet(`/payroll/runs/period/${periodKey}/items`);
        setRows(data); // ตั้งค่า rows จาก API (จะเป็น array ของ PayrollItem objects)
      } catch (err) {
        console.error("Failed to fetch payroll data:", err);
        setRows([]); // ตั้งค่าเป็น array ว่างถ้าเกิด error
      } finally {
        setLoading(false);
      }
    }
    fetchPayrollData();
  }, [period]);

  const calcRows = useMemo(() => rows.map(r => computeRow(r, rates)), [rows, rates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return calcRows;
    return calcRows.filter((r) => {
      const searchStr = `${r.empCode} ${r.name} ${r.department} ${r.position}`.toLowerCase();
      return searchStr.includes(q);
    });
  }, [calcRows, query]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        gross: acc.gross + (r.gross || 0),
        tax: acc.tax + (r.tax || 0),
        sso: acc.sso + (r.sso || 0),
        pvd: acc.pvd + (r.pvd || 0),
        net: acc.net + (r.net || 0),
      }),
      { gross: 0, tax: 0, sso: 0, pvd: 0, net: 0 }
    );
  }, [filtered]);

  function updateRow(idx, patch) {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  async function handleApproveAll() {
    try {
      const payload = { period: monthKey(period), rates, rows: calcRows };
      await apiPost(`/payroll/runs/${monthKey(period)}/approve`, payload);
      setRows(prev => prev.map(r => ({ ...r, status: "Approved" })));
    } catch (err) {
      console.error("Failed to approve payroll:", err);
    }
  }

  async function handleMarkPaid() {
    try {
      const payload = { period: monthKey(period), rates, rows: calcRows };
      await apiPost(`/payroll/runs/${monthKey(period)}/mark-paid`, payload);
      setRows(prev => prev.map(r => ({ ...r, status: "Paid" })));
    } catch (err) {
      console.error("Failed to mark payroll as paid:", err);
    }
  }

  function downloadCsv() {
    const headers = ["รหัส", "ชื่อ", "แผนก", "ตำแหน่ง", "Gross", "Tax", "SSO", "PVD", "Net"];
    const rows = [headers.join(",")];

    filtered.forEach((r) => {
      const row = [
        r.empCode || "",
        `"${r.name || ""}"`,
        `"${r.department || ""}"`,
        `"${r.position || ""}"`,
        r.gross || 0,
        r.tax || 0,
        r.sso || 0,
        r.pvd || 0,
        r.net || 0,
      ];
      rows.push(row.join(","));
    });

    const blob = new Blob(["\ufeff" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${monthKey(period)}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function generatePayslips() {
    try {
      const periodStr = monthKey(period);
      // สามารถเรียก API เพื่อ generate payslips PDF หรือทำอย่างอื่นได้
      alert(`กำลัง generate payslips สำหรับงวด ${periodStr}...`);
      // TODO: เรียก API เช่น apiPost(`/payroll/runs/${periodStr}/generate-payslips`)
    } catch (err) {
      console.error("Failed to generate payslips:", err);
      alert("ไม่สามารถ generate payslips ได้");
    }
  }

  // UI ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      {loading ? (
        <p className="text-white">กำลังโหลดข้อมูล...</p>
      ) : (
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                การจ่ายเงินเดือน (Payroll)
              </h1>
              <p className="text-sm text-slate-400">
                งวด: {period.month}/{period.year}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={`${period.year}-${period.month}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split("-").map(Number);
                  setPeriod({ year, month });
                }}
                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const m = today.getMonth() - i;
                  const d = new Date(today.getFullYear(), m, 1);
                  const y = d.getFullYear();
                  const mon = d.getMonth() + 1;
                  return (
                    <option key={`${y}-${mon}`} value={`${y}-${mon}`}>
                      {mon}/{y}
                    </option>
                  );
                })}
              </select>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหา: ชื่อ/รหัส"
                className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
              />
              <button
                onClick={downloadCsv}
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                Export CSV
              </button>
              <button
                onClick={generatePayslips}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Generate Payslips
              </button>
            </div>
          </div>

          {/* Rates panel */}
          <div className="rounded-2xl bg-slate-800/50 p-4 shadow-xl ring-1 ring-slate-700">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
              อัตราการหัก (ปรับได้)
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <LabeledNumber
                label="SSO Rate"
                value={rates.ssoRate}
                onChange={(v) => setRates({ ...rates, ssoRate: clamp(v, 0, 1) })}
              />
              <LabeledNumber
                label="SSO Cap (฿)"
                value={rates.ssoCap}
                onChange={(v) => setRates({ ...rates, ssoCap: Math.max(0, v) })}
              />
              <LabeledNumber
                label="Tax Rate"
                value={rates.taxRate}
                onChange={(v) => setRates({ ...rates, taxRate: clamp(v, 0, 1) })}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl bg-slate-800/50 shadow-xl ring-1 ring-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-700/50 text-slate-300">
                <tr>
                  <Th>รหัส</Th>
                  <Th>ชื่อ</Th>
                  <Th>แผนก</Th>
                  <Th>ตำแหน่ง</Th>
                  <Th className="text-right">Gross</Th>
                  <Th className="text-right">Tax</Th>
                  <Th className="text-right">SSO</Th>
                  <Th className="text-right">PVD</Th>
                  <Th className="text-right">Net</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <Td colSpan={9} className="text-center text-slate-400">
                      ไม่มีข้อมูลพนักงานสำหรับงวดนี้
                    </Td>
                  </tr>
                ) : (
                  <>
                    {filtered.map((r, idx) => (
                      <tr
                        key={r.id || idx}
                        className="border-t border-slate-700 text-slate-200 hover:bg-slate-700/30"
                      >
                        <Td>{r.empCode}</Td>
                        <Td>{r.name}</Td>
                        <Td>{r.department}</Td>
                        <Td>{r.position}</Td>
                        <Td className="text-right">{thb(r.gross)}</Td>
                        <Td className="text-right">{thb(r.tax)}</Td>
                        <Td className="text-right">{thb(r.sso)}</Td>
                        <Td className="text-right">{thb(r.pvd)}</Td>
                        <Td className="text-right font-semibold">{thb(r.net)}</Td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="border-t-2 border-slate-600 bg-slate-700/50 font-semibold text-slate-100">
                      <Td colSpan={4}>รวม</Td>
                      <Td className="text-right">{thb(totals.gross)}</Td>
                      <Td className="text-right">{thb(totals.tax)}</Td>
                      <Td className="text-right">{thb(totals.sso)}</Td>
                      <Td className="text-right">{thb(totals.pvd)}</Td>
                      <Td className="text-right">{thb(totals.net)}</Td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button onClick={handleApproveAll} className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 shadow-lg hover:bg-slate-700">Approve ทั้งงวด</button>
            <button onClick={handleMarkPaid} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 shadow-lg">ทำเครื่องหมายจ่ายแล้ว</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Small UI parts
function Th({ children, className = "" }) {
  return (
    <th
      className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "", colSpan }) {
  return (
    <td className={`px-3 py-2 align-middle ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function LabeledNumber({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">
        {label}
      </label>
      <NumberInput value={value} onChange={onChange} />
    </div>
  );
}

function NumberInput({ value, onChange }) {
  return (
    <input
      type="number"
      step="0.01"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
    />
  );
}