import { useMemo, useState } from "react";

// ------------ Helpers
function thb(n) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(Number(n) || 0);
}
function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

/**
 * Simple Thai-like payroll model (demo):
 * gross = baseSalary + (otHours * otRate) + allowance
 * sso   = min(baseSalary * ssoRate, ssoCap)
 * taxable = gross - sso
 * tax   = taxable * taxRate (flat for demo)
 * otherDeductions: manual
 * net   = gross - (sso + tax + otherDeductions)
 */
function computeRow(row, rates) {
  const base = Number(row.baseSalary) || 0;
  const otHours = Number(row.otHours) || 0;
  const allowance = Number(row.allowance) || 0;
  const otherDeduction = Number(row.otherDeduction) || 0;

  const otPay = otHours * (Number(rates.otRatePerHour) || 0);
  const gross = base + otPay + allowance;
  const sso = Math.min(base * (Number(rates.ssoRate) || 0), Number(rates.ssoCap) || 0);
  const taxable = Math.max(0, gross - sso);
  const tax = taxable * (Number(rates.taxRate) || 0);
  const deductions = sso + tax + otherDeduction;
  const net = gross - deductions;
  return { ...row, otPay, gross, sso, taxable, tax, deductions, net };
}

function monthKey({ year, month }) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// ------------ Component
export default function PayrollPage({
  initialEmployees,
  defaultRates = { otRatePerHour: 100, ssoRate: 0.05, ssoCap: 750, taxRate: 0.05 },
  onApproveAll, // async (payload)
  onMarkPaid,  // async (payload)
  onExportCsv, // optional override
  onGeneratePayslips, // optional (rows, period)
}) {
  const today = new Date();
  const [period, setPeriod] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1, // 1..12
  });

  const [rates, setRates] = useState(defaultRates);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(
    initialEmployees || [
      { code: "EMP-0001", name: "Somchai Prasert", department: "Finance", position: "Payroll Officer", baseSalary: 30000, otHours: 12, allowance: 1500, otherDeduction: 0, status: "Pending" },
      { code: "EMP-0002", name: "Suda Chaiyo", department: "Engineering", position: "Developer", baseSalary: 45000, otHours: 0, allowance: 2000, otherDeduction: 500, status: "Pending" },
      { code: "EMP-0003", name: "Anan K.", department: "Operations", position: "Ops", baseSalary: 20000, otHours: 20, allowance: 0, otherDeduction: 0, status: "Pending" },
    ]
  );

  // Derived rows with calculations
  const calcRows = useMemo(() => rows.map(r => computeRow(r, rates)), [rows, rates]);

  // Filter & totals
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return calcRows;
    return calcRows.filter(r =>
      r.code.toLowerCase().includes(q) ||
      (r.name || "").toLowerCase().includes(q) ||
      (r.department || "").toLowerCase().includes(q)
    );
  }, [calcRows, query]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, r) => {
      acc.base += Number(r.baseSalary) || 0;
      acc.ot += r.otPay || 0;
      acc.allowance += Number(r.allowance) || 0;
      acc.gross += r.gross || 0;
      acc.sso += r.sso || 0;
      acc.tax += r.tax || 0;
      acc.other += Number(r.otherDeduction) || 0;
      acc.net += r.net || 0;
      return acc;
    }, { base: 0, ot: 0, allowance: 0, gross: 0, sso: 0, tax: 0, other: 0, net: 0 });
  }, [filtered]);

  function updateRow(idx, patch) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }

  async function handleApproveAll() {
    const payload = { period: monthKey(period), rates, rows: calcRows };
    if (onApproveAll) await onApproveAll(payload);
    setRows(prev => prev.map(r => ({ ...r, status: "Approved" })));
  }

  async function handleMarkPaid() {
    const payload = { period: monthKey(period), rates, rows: calcRows };
    if (onMarkPaid) await onMarkPaid(payload);
    setRows(prev => prev.map(r => ({ ...r, status: "Paid" })));
  }

  function downloadCsv() {
    const header = [
      "Employee Code","Name","Department","Position","Base Salary","OT Hours","OT Pay","Allowance","Gross","SSO","Tax","Other Deductions","Net","Status","Period"
    ];
    const lines = [header.join(",")];
    calcRows.forEach(r => {
      const values = [
        r.code, r.name, r.department || "", r.position || "",
        r.baseSalary, r.otHours, r.otPay, r.allowance, r.gross, r.sso, r.tax, r.otherDeduction, r.net,
        r.status, monthKey(period)
      ];
      lines.push(values.map(v => typeof v === 'string' ? `"${v.replaceAll('"','""')}"` : v).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${monthKey(period)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (onExportCsv) onExportCsv(calcRows, period);
  }

  function generatePayslips() {
    if (onGeneratePayslips) onGeneratePayslips(calcRows, period, rates);
    alert("(เดโม่) สร้าง payslips สำหรับ " + calcRows.length + " คน เรียบร้อย");
  }

  // UI ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">รันเงินเดือน (Payroll)</h1>
            <p className="text-sm text-slate-600">งวด: {monthKey(period)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period.year}
              onChange={e => setPeriod(p => ({ ...p, year: Number(e.target.value) }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {Array.from({ length: 6 }).map((_,i) => {
                const y = new Date().getFullYear() - 2 + i; // y-2..y+3
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            <select
              value={period.month}
              onChange={e => setPeriod(p => ({ ...p, month: Number(e.target.value) }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }).map((_,i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ค้นหา: โค้ด/ชื่อ/แผนก"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <button onClick={downloadCsv} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Export CSV</button>
            <button onClick={generatePayslips} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Generate Payslips</button>
          </div>
        </div>

        {/* Rates panel */}
        <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <LabeledNumber label="OT Rate (฿/ชม.)" value={rates.otRatePerHour} onChange={v => setRates(r => ({ ...r, otRatePerHour: clamp(v,0,10000) }))} />
            <LabeledNumber label="SSO Rate (%)" value={rates.ssoRate * 100} onChange={v => setRates(r => ({ ...r, ssoRate: clamp(v,0,100)/100 }))} />
            <LabeledNumber label="SSO Cap (฿)" value={rates.ssoCap} onChange={v => setRates(r => ({ ...r, ssoCap: clamp(v,0,100000) }))} />
            <LabeledNumber label="Tax Rate (%)" value={rates.taxRate * 100} onChange={v => setRates(r => ({ ...r, taxRate: clamp(v,0,100)/100 }))} />
          </div>
          <p className="mt-2 text-xs text-slate-500">* อัตราภาษีในตัวอย่างนี้เป็นแบบ flat เพื่อการสาธิต — ในระบบจริงควรใช้สูตรภาษีและฐานลดหย่อนตามกฎหมายที่อัปเดต</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl bg-white shadow ring-1 ring-black/5">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <Th>รหัส</Th>
                <Th>ชื่อ</Th>
                <Th>แผนก</Th>
                <Th>ตำแหน่ง</Th>
                <Th className="text-right">Base</Th>
                <Th className="text-right">OT ชม.</Th>
                <Th className="text-right">OT Pay</Th>
                <Th className="text-right">Allowance</Th>
                <Th className="text-right">Gross</Th>
                <Th className="text-right">SSO</Th>
                <Th className="text-right">Tax</Th>
                <Th className="text-right">Other Ded.</Th>
                <Th className="text-right">Net</Th>
                <Th>สถานะ</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={r.code} className="odd:bg-white even:bg-slate-50/50">
                  <Td>{r.code}</Td>
                  <Td>{r.name}</Td>
                  <Td>{r.department}</Td>
                  <Td>{r.position}</Td>

                  <Td className="text-right">
                    <NumberInput value={r.baseSalary} onChange={v => updateRow(rows.indexOf(r), { baseSalary: v })} />
                  </Td>

                  <Td className="text-right">
                    <NumberInput value={r.otHours} onChange={v => updateRow(rows.indexOf(r), { otHours: v })} />
                  </Td>

                  <Td className="text-right text-slate-900">{thb(computeRow(r, rates).otPay)}</Td>

                  <Td className="text-right">
                    <NumberInput value={r.allowance} onChange={v => updateRow(rows.indexOf(r), { allowance: v })} />
                  </Td>

                  <Td className="text-right text-slate-900">{thb(computeRow(r, rates).gross)}</Td>
                  <Td className="text-right">{thb(computeRow(r, rates).sso)}</Td>
                  <Td className="text-right">{thb(computeRow(r, rates).tax)}</Td>

                  <Td className="text-right">
                    <NumberInput value={r.otherDeduction} onChange={v => updateRow(rows.indexOf(r), { otherDeduction: v })} />
                  </Td>

                  <Td className="text-right font-semibold text-emerald-700">{thb(computeRow(r, rates).net)}</Td>

                  <Td>
                    <select
                      value={r.status}
                      onChange={e => updateRow(rows.indexOf(r), { status: e.target.value })}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Paid</option>
                    </select>
                  </Td>
                </tr>
              ))}
            </tbody>
            {/* Totals */}
            <tfoot>
              <tr className="bg-slate-100 font-medium">
                <Td colSpan={4}>รวม</Td>
                <Td className="text-right">{thb(totals.base)}</Td>
                <Td className="text-right">—</Td>
                <Td className="text-right">{thb(totals.ot)}</Td>
                <Td className="text-right">{thb(totals.allowance)}</Td>
                <Td className="text-right">{thb(totals.gross)}</Td>
                <Td className="text-right">{thb(totals.sso)}</Td>
                <Td className="text-right">{thb(totals.tax)}</Td>
                <Td className="text-right">{thb(totals.other)}</Td>
                <Td className="text-right">{thb(totals.net)}</Td>
                <Td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button onClick={handleApproveAll} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Approve ทั้งงวด</button>
          <button onClick={handleMarkPaid} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">ทำเครื่องหมายจ่ายแล้ว</button>
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

function LabeledNumber({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-600">{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </label>
  );
}

function NumberInput({ value, onChange }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right outline-none focus:ring-2 focus:ring-indigo-200"
    />
  );
}

/*
การใช้งาน:
- วางไฟล์เป็น src/pages/PayrollPage.jsx
- เพิ่ม route ตัวอย่าง

import { BrowserRouter, Routes, Route } from "react-router-dom";
import PayrollPage from "./pages/PayrollPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/payroll" element={<PayrollPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// ต่อ Backend (แนวทาง):
// - onApproveAll(payload): POST /api/payroll/{period}/approve
// - onMarkPaid(payload):   POST /api/payroll/{period}/mark-paid
// - onGeneratePayslips(rows, period, rates): สร้าง PDF/record ทีละคนด้วย PaySlipPage
*/
