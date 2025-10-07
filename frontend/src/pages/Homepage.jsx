import { useMemo } from "react";
import { Link } from "react-router-dom";

// Simple money formatter
const THB = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

/**
 * HomePage (Admin/HR Portal)
 * - แสดงสรุปภาพรวม (Headcount, Payroll รวมงวดล่าสุด, การลา ฯลฯ)
 * - ปุ่มนำทางไปยังโมดูลหลัก: Dashboard, Employees, Payroll, Payslips, Leave, Reports
 * - รองรับ quick actions และ recent activity (ตัวอย่าง)
 */
export default function HomePage({
  kpis = {
    headcount: 42,
    payrollNet: 1523450,
    leavePending: 3,
    period: "2025-08",
  },
  quickLinks = [
    { to: "/reports", label: "Export รายงาน", desc: "CSV / พิมพ์ PDF" },
    { to: "/employees/new", label: "เพิ่มพนักงานใหม่", desc: "สร้างข้อมูลพนักงาน" },
    { to: "/payroll", label: "รันเงินเดือน", desc: "เริ่มคำนวณงวดปัจจุบัน" },
  ],
  recent = {
    hires: [
      { code: "EMP-0101", name: "Nicha", dept: "Marketing", date: "2025-09-10" },
      { code: "EMP-0102", name: "Bank", dept: "Operations", date: "2025-09-18" },
    ],
    leaves: [
      { code: "EMP-0002", name: "Suda", type: "Annual", days: 2 },
      { code: "EMP-0004", name: "Beer", type: "Sick", days: 1 },
    ],
  },
}) {
  const tiles = useMemo(() => ([
    {
      icon: "📊",
      title: "สรุปภาพรวม",
      subtitle: "Dashboard",
      to: "/reports", // ใช้ ReportsPage เป็น dashboard หลักในตัวอย่าง
      desc: "แสดงจำนวนพนักงาน, เงินเดือนรวม, กราฟการจ่ายเงิน",
    },
    {
      icon: "👥",
      title: "การจัดการบุคลากร",
      subtitle: "Employees",
      to: "/employees",
      desc: "เพิ่ม/ลบ/แก้ไขข้อมูลพนักงาน",
    },
    {
      icon: "💰",
      title: "ระบบเงินเดือน",
      subtitle: "Payroll",
      to: "/payroll",
      desc: "ดูและคำนวณเงินเดือนแต่ละงวด",
    },
    {
      icon: "🧾",
      title: "ใบสลิปเงินเดือน",
      subtitle: "Payslips",
      to: "/payslip",
      desc: "ตรวจสอบสลิป / ดาวน์โหลด",
    },
    {
      icon: "📅",
      title: "การลา",
      subtitle: "Leave Management",
      to: "/leave",
      desc: "อนุมัติการลา, ดูสถิติวันลา",
    },
    {
      icon: "📈",
      title: "รายงานระบบ",
      subtitle: "Reports",
      to: "/reports",
      desc: "สรุปเงินเดือน, การลา, ภาษี",
    },
  ]), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">HR/Payroll Admin Portal</h1>
            <p className="text-sm text-slate-600">ช่วงงวดล่าสุด: <span className="font-medium">{kpis.period}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/employees/new" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">+ เพิ่มพนักงาน</Link>
            <Link to="/payroll" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">รันเงินเดือน</Link>
          </div>
        </header>

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI label="พนักงานทั้งหมด" value={kpis.headcount} suffix="คน"/>
          <KPI label="ยอดจ่ายสุทธิ (งวดล่าสุด)" value={THB.format(kpis.payrollNet)}/>
          <KPI label="คำขอลารออนุมัติ" value={kpis.leavePending} suffix="เรื่อง"/>
          <KPI label="สถานะระบบ" value={<span className="text-emerald-700">ออนไลน์</span>}/>
        </section>

        {/* Tiles navigation */}
        <section>
          <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">เมนูหลัก</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((t, i) => (
              <Link key={i} to={t.to} className="group block rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl">
                <div className="mb-2 text-3xl">{t.icon}</div>
                <div className="text-lg font-semibold text-slate-900">{t.title}</div>
                <div className="text-xs uppercase tracking-wide text-slate-500">{t.subtitle}</div>
                <p className="mt-2 text-sm text-slate-600">{t.desc}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600">
                  ไปที่หน้า {t.subtitle} <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick actions & recent */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Quick links */}
          <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-black/5">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">ทางลัดการทำงาน</div>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((q, i) => (
                <li key={i}>
                  <Link to={q.to} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                    <div>
                      <div className="font-medium text-slate-900">{q.label}</div>
                      <div className="text-xs text-slate-500">{q.desc}</div>
                    </div>
                    <span className="text-slate-400">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Hires */}
          <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-black/5">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">พนักงานที่รับเข้าล่าสุด</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr><Th>รหัส</Th><Th>ชื่อ</Th><Th>แผนก</Th><Th>เริ่มงาน</Th></tr>
              </thead>
              <tbody>
                {recent.hires.map((h,i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50/50">
                    <Td>{h.code}</Td>
                    <Td>{h.name}</Td>
                    <Td>{h.dept}</Td>
                    <Td>{new Date(h.date).toLocaleDateString('th-TH')}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Leaves */}
          <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-black/5">
            <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">การลาล่าสุด (อนุมัติแล้ว)</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr><Th>รหัส</Th><Th>ชื่อ</Th><Th>ประเภท</Th><Th className="text-right">วัน</Th></tr>
              </thead>
              <tbody>
                {recent.leaves.map((l,i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50/50">
                    <Td>{l.code}</Td>
                    <Td>{l.name}</Td>
                    <Td>{l.type}</Td>
                    <Td className="text-right">{l.days}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer note */}
        <p className="text-xs text-slate-500">* สามารถส่ง KPI/รายการล่าสุดเข้ามาผ่าน prop เพื่อเชื่อมต่อข้อมูลจริงจาก API</p>
      </div>
    </div>
  );
}

function KPI({ label, value, suffix }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">
        {typeof value === 'number' ? `${value}${suffix ? ` ${suffix}` : ''}` : value}
      </div>
    </div>
  );
}
function Th({ children, className = "" }) { return <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>; }
function Td({ children, className = "" }) { return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>; }

/*
การใช้งาน:
- วางไฟล์เป็น src/pages/HomePage.jsx
- เพิ่ม route ใน App.jsx:

import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

เชื่อมต่อข้อมูลจริง:
- ส่ง prop kpis จาก API เช่น { headcount, payrollNet, leavePending, period }
- ส่ง prop recent.hires / recent.leaves จาก endpoint ที่เกี่ยวข้อง
*/
