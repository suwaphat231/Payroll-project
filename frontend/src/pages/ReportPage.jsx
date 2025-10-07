import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

// ----------------- Utilities
const THB = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });
const fmtInt = new Intl.NumberFormat("th-TH");

function monthKey(d) { // YYYY-MM
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function rangeMonths(start, end) {
  const s = new Date(start); s.setDate(1);
  const e = new Date(end); e.setDate(1);
  const out = [];
  while (s <= e) {
    out.push(`${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}`);
    s.setMonth(s.getMonth() + 1);
  }
  return out;
}

// ----------------- Sample dataset (replace with API)
const sample = {
  employees: [
    { code: "EMP-0001", name: "Somchai", dept: "Finance", status: "Active", hireDate: "2024-01-10", baseSalary: 30000 },
    { code: "EMP-0002", name: "Suda", dept: "Engineering", status: "Active", hireDate: "2023-11-05", baseSalary: 45000 },
    { code: "EMP-0003", name: "Anan", dept: "Operations", status: "Resigned", hireDate: "2022-03-12", resignDate: "2025-06-30", baseSalary: 20000 },
    { code: "EMP-0004", name: "Beer", dept: "Engineering", status: "Active", hireDate: "2024-12-01", baseSalary: 52000 },
    { code: "EMP-0005", name: "Mild", dept: "Sales", status: "Active", hireDate: "2025-02-14", baseSalary: 28000 },
  ],
  payroll: [ // per month per employee
    { period: "2025-06", code: "EMP-0001", gross: 31500, sso: 750, tax: 1200, net: 29550, ot: 1500, allowance: 0 },
    { period: "2025-06", code: "EMP-0002", gross: 47000, sso: 750, tax: 2400, net: 43850, ot: 0, allowance: 2000 },
    { period: "2025-06", code: "EMP-0003", gross: 21000, sso: 750, tax: 500, net: 19750, ot: 1000, allowance: 0 },
    { period: "2025-07", code: "EMP-0001", gross: 33000, sso: 750, tax: 1400, net: 30850, ot: 3000, allowance: 500 },
    { period: "2025-07", code: "EMP-0002", gross: 47000, sso: 750, tax: 2400, net: 43850, ot: 0, allowance: 2000 },
    { period: "2025-07", code: "EMP-0004", gross: 53000, sso: 750, tax: 2600, net: 49650, ot: 0, allowance: 1000 },
    { period: "2025-08", code: "EMP-0001", gross: 31500, sso: 750, tax: 1200, net: 29550, ot: 1500, allowance: 0 },
    { period: "2025-08", code: "EMP-0002", gross: 47000, sso: 750, tax: 2400, net: 43850, ot: 0, allowance: 2000 },
    { period: "2025-08", code: "EMP-0004", gross: 53500, sso: 750, tax: 2700, net: 50150, ot: 0, allowance: 1500 },
    { period: "2025-08", code: "EMP-0005", gross: 28500, sso: 750, tax: 900, net: 26850, ot: 500, allowance: 0 },
  ],
  leaves: [ // approved leaves
    { code: "EMP-0001", type: "Annual", start: "2025-08-12", end: "2025-08-14", days: 3 },
    { code: "EMP-0002", type: "Sick", start: "2025-07-02", end: "2025-07-03", days: 2 },
    { code: "EMP-0004", type: "Annual", start: "2025-08-20", end: "2025-08-21", days: 2 },
    { code: "EMP-0005", type: "Personal", start: "2025-08-10", end: "2025-08-10", days: 1 },
  ],
};

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#0ea5e9", "#84cc16"]; // indigo, green, amber, red, sky, lime

export default function ReportsPage({ dataset = sample }) {
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth(), 1);

  const [filters, setFilters] = useState({
    start: defaultStart.toISOString().slice(0,10),
    end: new Date(defaultEnd.getFullYear(), defaultEnd.getMonth()+1, 0).toISOString().slice(0,10),
    dept: "ALL",
    view: "overview", // overview | hr | payroll | leave
    search: "",
  });

  // Derived ranges
  const months = useMemo(() => rangeMonths(filters.start, filters.end), [filters.start, filters.end]);

  // Index data
  const empByCode = useMemo(() => Object.fromEntries(dataset.employees.map(e => [e.code, e])), [dataset]);

  // --- KPIs
  const kpis = useMemo(() => {
    const employees = dataset.employees.filter(e => filters.dept === "ALL" || e.dept === filters.dept);
    const headcount = employees.filter(e => e.status === "Active").length;

    const pr = dataset.payroll.filter(p => months.includes(p.period));
    const payrollTotal = pr.reduce((s,p) => s + (p.net||0), 0);

    const lv = dataset.leaves.filter(l => {
      const mk = monthKey(l.start);
      return months.includes(mk) && (filters.dept === "ALL" || empByCode[l.code]?.dept === filters.dept);
    });
    const leaveDays = lv.reduce((s,l) => s + (l.days||0), 0);

    return { headcount, payrollTotal, leaveDays };
  }, [dataset, months, filters.dept, empByCode]);

  // --- Charts data
  const headcountTrend = useMemo(() => {
    // naive: count active as of month end
    return months.map(m => {
      const [y,mm] = m.split("-").map(Number);
      const end = new Date(y, mm, 0);
      const active = dataset.employees.filter(e => {
        const hire = new Date(e.hireDate);
        const resign = e.resignDate ? new Date(e.resignDate) : null;
        return hire <= end && (!resign || resign > end);
      }).filter(e => filters.dept === "ALL" || e.dept === filters.dept).length;
      return { month: m, headcount: active };
    });
  }, [months, dataset, filters.dept]);

  const payrollTrend = useMemo(() => {
    return months.map(m => {
      const rows = dataset.payroll.filter(p => p.period === m)
        .filter(p => filters.dept === "ALL" || empByCode[p.code]?.dept === filters.dept);
      const gross = rows.reduce((s,r)=> s + (r.gross||0),0);
      const net = rows.reduce((s,r)=> s + (r.net||0),0);
      return { month: m, gross, net };
    });
  }, [months, dataset, filters.dept, empByCode]);

  const deptComposition = useMemo(() => {
    const map = new Map();
    dataset.employees.forEach(e => {
      if (e.status !== "Active") return;
      if (filters.dept !== "ALL" && e.dept !== filters.dept) return;
      map.set(e.dept, (map.get(e.dept)||0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [dataset, filters.dept]);

  const topOT = useMemo(() => {
    // accumulate OT hours by employee within range
    const acc = new Map();
    dataset.payroll.filter(p => months.includes(p.period)).forEach(p => {
      const e = empByCode[p.code];
      if (!e) return;
      if (filters.dept !== "ALL" && e.dept !== filters.dept) return;
      acc.set(p.code, (acc.get(p.code)||0) + (p.ot || 0)); // use ot amount (฿) or adapt for hours
    });
    const arr = Array.from(acc, ([code, ot]) => ({ code, name: empByCode[code]?.name || code, dept: empByCode[code]?.dept, ot }));
    arr.sort((a,b) => b.ot - a.ot);
    return arr.slice(0, 5);
  }, [dataset, months, filters.dept, empByCode]);

  const leaveByType = useMemo(() => {
    const map = new Map();
    dataset.leaves.forEach(l => {
      if (!months.includes(monthKey(l.start))) return;
      const e = empByCode[l.code];
      if (!e) return;
      if (filters.dept !== "ALL" && e.dept !== filters.dept) return;
      map.set(l.type, (map.get(l.type)||0) + (l.days||0));
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [dataset, months, filters.dept, empByCode]);

  // --- Export
  function exportCSV() {
    const lines = [];
    lines.push(["Month","Headcount","Gross","Net","LeaveDays"].join(","));
    months.forEach((m,i)=>{
      const pt = payrollTrend[i];
      const hc = headcountTrend[i];
      const lv = dataset.leaves.filter(l=> monthKey(l.start)===m).reduce((s,l)=>s+(l.days||0),0);
      lines.push([m, hc?.headcount||0, pt?.gross||0, pt?.net||0, lv].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `admin_reports_${months[0]}_${months.at(-1)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function printPDF() { window.print(); }

  // ----------------- UI
  const depts = useMemo(() => ["ALL", ...Array.from(new Set(dataset.employees.map(e=>e.dept)))], [dataset]);

  const filteredEmployees = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return dataset.employees.filter(e => (filters.dept === "ALL" || e.dept === filters.dept) &&
      (!q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q))
    );
  }, [dataset, filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header / Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">รายงานบุคลากร • Payroll • การลา</h1>
            <p className="text-sm text-slate-600">มุมมองสำหรับผู้ดูแลระบบ (Admin/HR/Accounting)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={filters.start} onChange={e=>setFilters(f=>({...f,start:e.target.value}))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"/>
            <input type="date" value={filters.end} onChange={e=>setFilters(f=>({...f,end:e.target.value}))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"/>
            <select value={filters.dept} onChange={e=>setFilters(f=>({...f,dept:e.target.value}))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              {depts.map(d=> <option key={d}>{d}</option>)}
            </select>
            <input value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} placeholder="ค้นหาพนักงาน: ชื่อ/รหัส" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"/>
            <button onClick={exportCSV} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Export CSV</button>
            <button onClick={printPDF} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">พิมพ์ / PDF</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KPI label="พนักงาน (Active)" value={fmtInt.format(kpis.headcount)} subtitle={`ช่วง ${months[0]} → ${months.at(-1)}`}/>
          <KPI label="ยอดจ่ายสุทธิ (Net)" value={THB.format(kpis.payrollTotal)} subtitle="รวมทุกคนในช่วงที่เลือก"/>
          <KPI label="วันลารวม" value={fmtInt.format(kpis.leaveDays)} subtitle="Approved leaves"/>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Headcount Trend">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={headcountTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month"/>
                <YAxis allowDecimals={false}/>
                <Tooltip/>
                <Line type="monotone" dataKey="headcount" stroke="#0ea5e9" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Payroll (Gross vs Net)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="month"/>
                <YAxis/>
                <Legend/>
                <Tooltip formatter={(v)=>THB.format(v)}/>
                <Bar dataKey="gross" name="Gross" fill="#6366f1"/>
                <Bar dataKey="net" name="Net" fill="#22c55e"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="สัดส่วนแผนก (Active)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={deptComposition} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {deptComposition.map((entry, index) => (
                    <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Top OT (ตามมูลค่า OT ในช่วงที่เลือก)">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>รหัส</Th><Th>ชื่อ</Th><Th>แผนก</Th><Th className="text-right">OT (฿)</Th>
                </tr>
              </thead>
              <tbody>
                {topOT.map(r => (
                  <tr key={r.code} className="odd:bg-white even:bg-slate-50/50">
                    <Td>{r.code}</Td>
                    <Td>{r.name}</Td>
                    <Td>{r.dept}</Td>
                    <Td className="text-right">{THB.format(r.ot)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card title="วันลาตามประเภท">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>ประเภท</Th><Th className="text-right">วันลา</Th>
                </tr>
              </thead>
              <tbody>
                {leaveByType.map((r,i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50/50">
                    <Td>{r.name}</Td>
                    <Td className="text-right">{fmtInt.format(r.value)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Employees quick list */}
        <Card title={`พนักงานในมุมมอง (${filters.dept})`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>รหัส</Th><Th>ชื่อ</Th><Th>แผนก</Th><Th>สถานะ</Th><Th>เริ่มงาน</Th><Th className="text-right">เงินเดือนพื้นฐาน</Th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(e => (
                  <tr key={e.code} className="odd:bg-white even:bg-slate-50/50">
                    <Td>{e.code}</Td>
                    <Td>{e.name}</Td>
                    <Td>{e.dept}</Td>
                    <Td>{e.status}</Td>
                    <Td>{new Date(e.hireDate).toLocaleDateString("th-TH")}</Td>
                    <Td className="text-right">{THB.format(e.baseSalary || 0)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer note */}
        <p className="text-xs text-slate-500">
          * ข้อมูลในหน้านี้เป็นตัวอย่าง สามารถเชื่อมต่อ API จริงได้ โดยนำเข้าข้อมูลพนักงาน (`/api/employees`), เงินเดือนเชิงงวด (`/api/payroll?start=YYYY-MM&end=YYYY-MM`), และการลาที่อนุมัติแล้ว (`/api/leaves?...`).
        </p>
      </div>
    </div>
  );
}

// ----------------- Small UI parts
function KPI({ label, value, subtitle }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}

function Card({ title, className = "", children }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow ring-1 ring-black/5 ${className}`}>
      <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">{title}</div>
      {children}
    </div>
  );
}
function Th({ children, className = "" }) {
  return <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}

/*
การใช้งาน:
- วางไฟล์เป็น src/pages/ReportsPage.jsx
- ติดตั้ง Recharts หากยังไม่ได้ติดตั้ง: npm i recharts
- เพิ่ม route ใน App.jsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// เชื่อมต่อ API จริง (แนวทาง):
// - ดึง employees/payroll/leaves ตามช่วงวันที่/แผนก แล้ว setDataset({ employees, payroll, leaves })
// - กรอง/รวมข้อมูลฝั่ง frontend หรือให้ backend รวมเชิงสรุป (aggregate) เพื่อประสิทธิภาพในชุดข้อมูลใหญ่
*/