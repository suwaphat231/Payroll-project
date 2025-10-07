import { useMemo, useRef } from "react";

function thb(n) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n || 0);
}

/**
 * Payslip data shape (example)
 * {
 *   company: { name, address, taxId },
 *   employee: { code, name, position, department, bank: { name, account } },
 *   period: { start: "2025-09-01", end: "2025-09-30", payDate: "2025-10-05" },
 *   earnings: [ { name: "Base Salary", amount: 30000 }, { name: "OT", amount: 2500 } ],
 *   deductions: [ { name: "Tax (PND1)", amount: 1200 }, { name: "Social Security", amount: 750 } ],
 *   notes: "ขอบคุณที่ทำงานหนักนะครับ",
 *   ytd?: { earnings: number, deductions: number }
 * }
 */

export default function PaySlipPage({ data, onDownload }) {
  const ref = useRef(null);

  const totals = useMemo(() => {
    const earn = (data?.earnings || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const ded = (data?.deductions || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    return { earn, ded, net: earn - ded };
  }, [data]);

  function handlePrint() {
    // Print only the payslip card
    const originalTitle = document.title;
    document.title = `Payslip_${data?.employee?.code || "EMP"}_${data?.period?.end || ""}`;
    window.print();
    document.title = originalTitle;
    if (onDownload) onDownload();
  }

  const periodStr = useMemo(() => {
    if (!data?.period) return "-";
    const fmt = (d) => new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "2-digit" });
    return `${fmt(data.period.start)} – ${fmt(data.period.end)}`;
  }, [data]);

  const payDateStr = useMemo(() => {
    if (!data?.period?.payDate) return "-";
    return new Date(data.period.payDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "2-digit" });
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* Controls */}
        <div className="print:hidden flex items-center justify-between">
          <h1 className="text-xl font-bold">สลิปเงินเดือน (Payslip)</h1>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700"
            >
              ดาวน์โหลด PDF / พิมพ์
            </button>
          </div>
        </div>

        {/* Payslip card */}
        <div ref={ref} className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5 print:shadow-none">
          {/* Header */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-lg font-semibold">{data?.company?.name || "ชื่อบริษัท"}</div>
              <div className="text-sm text-slate-600 whitespace-pre-wrap">{data?.company?.address || "ที่อยู่บริษัท"}</div>
              {data?.company?.taxId && (
                <div className="text-sm text-slate-600">เลขผู้เสียภาษี: {data.company.taxId}</div>
              )}
            </div>
            <div className="md:text-right">
              <div className="text-sm text-slate-500">งวดเงินเดือน</div>
              <div className="font-medium">{periodStr}</div>
              <div className="text-sm text-slate-500">วันที่จ่าย</div>
              <div className="font-medium">{payDateStr}</div>
            </div>
          </div>

          {/* Employee section */}
          <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-3">
            <div>
              <div className="text-xs text-slate-500">รหัสพนักงาน</div>
              <div className="font-medium">{data?.employee?.code || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">ชื่อพนักงาน</div>
              <div className="font-medium">{data?.employee?.name || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">ตำแหน่ง / แผนก</div>
              <div className="font-medium">{data?.employee?.position || "-"} {data?.employee?.department ? `• ${data.employee.department}` : ""}</div>
            </div>
            {data?.employee?.bank && (
              <div className="md:col-span-3">
                <div className="text-xs text-slate-500">บัญชีรับเงินเดือน</div>
                <div className="font-medium">{data.employee.bank.name} • {data.employee.bank.account}</div>
              </div>
            )}
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">รายรับ (Earnings)</div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">รายการ</th>
                      <th className="px-3 py-2 text-right font-medium">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.earnings?.length ? data.earnings : [{ name: "Base Salary", amount: 0 }]).map((it, i) => (
                      <tr key={i} className="odd:bg-white even:bg-slate-50/50">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2 text-right">{thb(Number(it.amount) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100">
                      <td className="px-3 py-2 font-semibold">รวมรายรับ</td>
                      <td className="px-3 py-2 text-right font-semibold">{thb(totals.earn)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">รายหัก (Deductions)</div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">รายการ</th>
                      <th className="px-3 py-2 text-right font-medium">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.deductions?.length ? data.deductions : [{ name: "Tax", amount: 0 }]).map((it, i) => (
                      <tr key={i} className="odd:bg-white even:bg-slate-50/50">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2 text-right">{thb(Number(it.amount) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100">
                      <td className="px-3 py-2 font-semibold">รวมรายหัก</td>
                      <td className="px-3 py-2 text-right font-semibold">{thb(totals.ded)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Net pay */}
          <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
              <div className="text-sm text-emerald-700">เงินได้สุทธิ (Net Pay)</div>
              <div className="text-3xl font-bold text-emerald-900">{thb(totals.net)}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-sm text-slate-500">รวมปีนี้ (YTD)</div>
              <div className="mt-1 text-sm">รายรับ: <span className="font-medium">{thb(data?.ytd?.earnings || 0)}</span></div>
              <div className="text-sm">รายหัก: <span className="font-medium">{thb(data?.ytd?.deductions || 0)}</span></div>
            </div>
          </div>

          {/* Notes */}
          {data?.notes && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-700">
              <div className="mb-1 font-medium">หมายเหตุ</div>
              <div className="whitespace-pre-wrap">{data.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 grid grid-cols-2 gap-6 text-xs text-slate-500">
            <div>
              ออกโดยระบบ Payroll • เอกสารสำหรับพนักงาน
            </div>
            <div className="text-right">
              พิมพ์เมื่อ {new Date().toLocaleString("th-TH")}
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .ring-1, .shadow, .shadow-lg { box-shadow: none !important; }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  );
}

/*
การใช้งาน:
- วางไฟล์เป็น src/pages/PaySlipPage.jsx
- เพิ่ม route ใน App.jsx และส่ง data เข้ามา เช่น

import { BrowserRouter, Routes, Route } from "react-router-dom";
import PaySlipPage from "./pages/PaySlipPage";

const sample = {
  company: {
    name: "Krungsri Nimble Co., Ltd.",
    address: "123 ถนนสุขุมวิท\nคลองเตย กรุงเทพฯ 10110",
    taxId: "0105559999999",
  },
  employee: {
    code: "EMP-0007",
    name: "Lil (Payroll Officer)",
    position: "Payroll Officer",
    department: "Finance",
    bank: { name: "Krungsri", account: "XXX-X-12345-0" },
  },
  period: { start: "2025-09-01", end: "2025-09-30", payDate: "2025-10-05" },
  earnings: [
    { name: "Base Salary", amount: 30000 },
    { name: "OT", amount: 2500 },
    { name: "Allowance", amount: 1500 },
  ],
  deductions: [
    { name: "Tax (PND1)", amount: 1200 },
    { name: "Social Security", amount: 750 },
  ],
  notes: "สลิปนี้สร้างจากข้อมูลตัวอย่าง",
  ytd: { earnings: 270000, deductions: 15000 },
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/payslip" element={<PaySlipPage data={sample} />} />
      </Routes>
    </BrowserRouter>
  );
}
*/