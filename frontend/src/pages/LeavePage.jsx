import { useMemo, useState } from "react";

// --- Utility: business-day diff (excludes Sat/Sun and optional holidays) ---
function businessDaysBetween(startISO, endISO, holidays = []) {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start) || isNaN(end)) return 0;
  if (end < start) return 0;

  const holidaySet = new Set(holidays); // YYYY-MM-DD
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay(); // 0=Sun,6=Sat
    const ymd = d.toISOString().slice(0, 10);
    if (day !== 0 && day !== 6 && !holidaySet.has(ymd)) count += 1;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// --- Mock remaining quota by leave type ---
const DEFAULT_QUOTA = {
  Annual: 10,
  Sick: 30,
  Personal: 3,
  Unpaid: Infinity,
};

const DEFAULT_APPROVERS = [
  { id: "mgr-001", name: "คุณสมชาย ใจดี", email: "somchai@company.com" },
  { id: "mgr-002", name: "คุณสุดา รุ่งเรือง", email: "suda@company.com" },
];

/**
 * LeavePage: หน้าแจ้งลา/ยื่นคำขอลา
 * - คำนวณวันทำการ (ตัดเสาร์-อาทิตย์ + วันหยุดองค์กร)
 * - รองรับลาครึ่งวัน, เลือกผู้อนุมัติ, ตั้งค่าวิธีแจ้งเตือน (email/LINE)
 * - ตรวจโควตาและ validation เบื้องต้น
 * - ส่ง payload ไป backend (ผ่าน prop onSubmit)
 */
export default function LeavePage({
  quotas = DEFAULT_QUOTA,
  approvers = DEFAULT_APPROVERS,
  holidays = [], // ['2025-12-31', '2026-01-01']
  onSubmit,
}) {
  const [form, setForm] = useState({
    employeeCode: "",
    leaveType: "Annual",
    startDate: "",
    endDate: "",
    halfDay: false,
    session: "AM", // for half-day only
    reason: "",
    contact: "",
    attachment: null,
    approverId: approvers?.[0]?.id ?? "",
    notifyEmail: true,
    notifyLine: false,
  });

  const days = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    if (form.halfDay) return 0.5;
    return businessDaysBetween(form.startDate, form.endDate, holidays);
  }, [form.startDate, form.endDate, form.halfDay, holidays]);

  const remaining = useMemo(() => {
    const q = quotas?.[form.leaveType];
    return typeof q === "number" ? q : Infinity;
  }, [form.leaveType, quotas]);

  const overQuota = useMemo(() => {
    if (!isFinite(remaining)) return false;
    return days > remaining;
  }, [days, remaining]);

  const errors = useMemo(() => {
    const e = {};
    if (!form.startDate) e.startDate = "กรุณาเลือกวันเริ่ม";
    if (!form.endDate) e.endDate = "กรุณาเลือกวันสิ้นสุด";
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      e.endDate = "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม";
    }
    if (!form.reason || form.reason.trim().length < 8) e.reason = "กรุณาอธิบายเหตุผลอย่างน้อย 8 ตัวอักษร";
    if (!form.approverId) e.approverId = "เลือกผู้อนุมัติ";
    if (overQuota) e.quota = "วันลามากกว่าโควตาที่เหลือ";
    return e;
  }, [form, overQuota]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (Object.keys(errors).length) return;

    const approver = approvers.find(a => a.id === form.approverId);

    // Build payload (ready for API)
    const payload = {
      employeeCode: form.employeeCode || undefined,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      halfDay: form.halfDay,
      session: form.halfDay ? form.session : undefined,
      days,
      reason: form.reason.trim(),
      contact: form.contact.trim() || undefined,
      approver: approver ? { id: approver.id, name: approver.name, email: approver.email } : undefined,
      notify: { email: form.notifyEmail, line: form.notifyLine },
    };

    try {
      if (onSubmit) {
        await onSubmit(payload, form.attachment);
      } else {
        // Demo behavior
        alert("ส่งคำขอลาสำเร็จ" + JSON.stringify(payload, null, 2));
      }
    } catch (err) {
      console.error(err);
      alert("ส่งคำขอลาไม่สำเร็จ: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-5">
        {/* Left: form card */}
        <div className="md:col-span-3">
          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
            <div className="mb-5 flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight">แจ้งลา / ยื่นคำขอลา</h1>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                เวอร์ชันสาธิต
              </span>
            </div>

            {errors.quota && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.quota}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">รหัสพนักงาน (ถ้ามี)</label>
                <input
                  type="text"
                  value={form.employeeCode}
                  onChange={(e) => update("employeeCode", e.target.value)}
                  placeholder="เช่น EMP-001"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none ring-0 transition focus:border-slate-300 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">ประเภทการลา</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => update("leaveType", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-indigo-200"
                >
                  <option>Annual</option>
                  <option>Sick</option>
                  <option>Personal</option>
                  <option>Unpaid</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">วันที่เริ่ม</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-indigo-200 ${errors.startDate ? "border-red-300" : "border-slate-200"}`}
                />
                {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-indigo-200 ${errors.endDate ? "border-red-300" : "border-slate-200"}`}
                />
                {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
              </div>

              <div className="md:col-span-2 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.halfDay}
                    onChange={(e) => update("halfDay", e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  ลาครึ่งวัน
                </label>
                {form.halfDay && (
                  <select
                    value={form.session}
                    onChange={(e) => update("session", e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm"
                  >
                    <option value="AM">ช่วงเช้า (AM)</option>
                    <option value="PM">ช่วงบ่าย (PM)</option>
                  </select>
                )}
                <span className="ml-auto text-sm text-slate-600">
                  รวม: <strong>{days}</strong> วันทำการ
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">เหตุผล</label>
                <textarea
                  rows={4}
                  value={form.reason}
                  onChange={(e) => update("reason", e.target.value)}
                  placeholder="โปรดอธิบายเหตุผลการลาอย่างย่อ"
                  className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-indigo-200 ${errors.reason ? "border-red-300" : "border-slate-200"}`}
                />
                {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason}</p>}
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">ช่องทางติดต่อระหว่างลา</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => update("contact", e.target.value)}
                  placeholder="เช่น เบอร์/ไลน์/อีเมล"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">แนบไฟล์ (ถ้ามี)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => update("attachment", e.target.files?.[0] ?? null)}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:font-medium file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">ส่งให้ผู้อนุมัติ</label>
                <select
                  value={form.approverId}
                  onChange={(e) => update("approverId", e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.approverId ? "border-red-300" : "border-slate-200"}`}
                >
                  {approvers.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.approverId && <p className="mt-1 text-xs text-red-600">{errors.approverId}</p>}
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">วิธีแจ้งผู้อนุมัติ</label>
                <div className="flex gap-4 rounded-xl border border-slate-200 p-2 text-sm">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={form.notifyEmail} onChange={(e) => update("notifyEmail", e.target.checked)} />
                    Email
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={form.notifyLine} onChange={(e) => update("notifyLine", e.target.checked)} />
                    LINE
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setForm({
                    employeeCode: "",
                    leaveType: "Annual",
                    startDate: "",
                    endDate: "",
                    halfDay: false,
                    session: "AM",
                    reason: "",
                    contact: "",
                    attachment: null,
                    approverId: approvers?.[0]?.id ?? "",
                    notifyEmail: true,
                    notifyLine: false,
                  })}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  ล้างฟอร์ม
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="rounded-xl bg-indigo-600 px-5 py-2 font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ส่งคำขอ
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: summary card */}
        <div className="md:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                สรุปรายการลา
              </h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">ประเภท</div>
                  <div className="text-slate-900">{form.leaveType}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">โควตาคงเหลือ</div>
                  <div className="text-slate-900">{isFinite(remaining) ? `${remaining} วัน` : "ไม่จำกัด"}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">เริ่ม</div>
                  <div className="text-slate-900">{form.startDate || "-"}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-slate-500">สิ้นสุด</div>
                  <div className="text-slate-900">{form.endDate || "-"}</div>
                </div>
                {form.halfDay && (
                  <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                    <div className="text-slate-500">โหมด</div>
                    <div className="text-slate-900">ครึ่งวัน ({form.session})</div>
                  </div>
                )}
                <div className="col-span-2 rounded-2xl bg-slate-50 p-3">
                  <div className="text-slate-500">ผู้อนุมัติ</div>
                  <div className="text-slate-900">{approvers.find(a => a.id === form.approverId)?.name || "-"}</div>
                </div>
                <div className={`col-span-2 rounded-xl p-3 ${overQuota ? "bg-red-50" : "bg-emerald-50"}`}>
                  <div className={`text-sm ${overQuota ? "text-red-700" : "text-emerald-700"}`}>
                    รวมลา <strong>{days}</strong> วันทำการ {overQuota ? "(เกินโควตา)" : "(อยู่ในโควตา)"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
              <p className="mb-2 font-medium text-slate-700">การอัพโหลดไฟล์ & การแจ้งเตือน</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>รองรับ .pdf และรูปภาพ (เช่น ใบรับรองแพทย์)</li>
                <li>ระบบจริงควรใช้ <code>FormData</code> ส่งไฟล์ไปยัง API และให้ backend แจ้งผู้อนุมัติผ่าน Email/LINE ตามตัวเลือก</li>
                <li>วันหยุดองค์กรส่งผ่าน prop <code>holidays</code> เป็นรูปแบบ YYYY-MM-DD</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-4 text-xs text-slate-500 shadow-sm ring-1 ring-black/5">
              <p>
                * หมายเหตุ: ระบบนี้คำนวณเฉพาะวันทำการ (จันทร์–ศุกร์) และหักวันหยุดที่ส่งเข้ามา หากต้องการดึงวันหยุดจากฐานข้อมูล/ปฏิทิน ให้โหลดรายการแล้วส่งเข้ามาใน prop <code>holidays</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
การใช้งาน:
- วางไฟล์นี้เป็น src/pages/LeavePage.jsx
- เพิ่ม route ใน App.jsx เช่น:

import { BrowserRouter, Routes, Route } from "react-router-dom";
import LeavePage from "./pages/LeavePage";

async function submitLeave(payload, file) {
  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (file) fd.append("attachment", file);
  const res = await fetch("/api/leaves", { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status} - ${t.slice(0,160)}`);
  }
}

export default function App() {
  const holidays = ["2025-12-31", "2026-01-01"];
  const approvers = [
    { id: "mgr-001", name: "คุณสมชาย ใจดี", email: "somchai@company.com" },
    { id: "mgr-002", name: "คุณสุดา รุ่งเรือง", email: "suda@company.com" },
  ];
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/leave" element={<LeavePage holidays={holidays} approvers={approvers} onSubmit={submitLeave} />} />
      </Routes>
    </BrowserRouter>
  );
}
*/
