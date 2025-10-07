import { useMemo, useRef, useState } from "react";

const EMP_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const STATUSES = ["Active", "On Leave", "Probation", "Resigned"];
const DEFAULT_DEPTS = ["HR", "Finance", "Engineering", "Operations", "Sales", "Marketing"];

function isEmail(x) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x ?? "");
}
function isPhoneTH(x) {
  // ยอมรับ 9-10 หลัก เริ่มด้วย 0 เช่น 08xxxxxxxx / 02xxxxxxx
  return /^0\d{8,9}$/.test((x ?? "").replace(/\D/g, ""));
}
function toNumberOrNull(x) {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(String(x).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function AddEmployeePage({
  departments = DEFAULT_DEPTS,
  onSubmit,
}) {
  const [form, setForm] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: departments?.[0] ?? "",
    position: "",
    employmentType: EMP_TYPES[0],
    status: STATUSES[0],
    hireDate: "",
    baseSalary: "",
    address: "",
    notes: "",
    avatar: null,
  });

  const [deptList, setDeptList] = useState(departments ?? []);
  const [addingDept, setAddingDept] = useState(false);
  const newDeptRef = useRef(null);

  const errors = useMemo(() => {
    const e = {};
    if (!form.employeeCode.trim()) e.employeeCode = "กรุณากรอกรหัสพนักงาน";
    if (!form.firstName.trim()) e.firstName = "กรุณากรอกชื่อ";
    if (!form.lastName.trim()) e.lastName = "กรุณากรอกนามสกุล";
    if (form.email && !isEmail(form.email)) e.email = "อีเมลไม่ถูกต้อง";
    if (form.phone && !isPhoneTH(form.phone)) e.phone = "เบอร์ไม่ถูกต้อง (ต้องเริ่มด้วย 0 และยาว 9-10 หลัก)";
    if (!form.department) e.department = "เลือกแผนก";
    if (!form.position.trim()) e.position = "กรอกตำแหน่ง";
    if (!form.hireDate) e.hireDate = "เลือกวันที่เริ่มงาน";
    const sal = toNumberOrNull(form.baseSalary);
    if (sal === null || sal < 0) e.baseSalary = "กรอกเงินเดือนเป็นตัวเลข >= 0";
    return e;
  }, [form]);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addDepartment() {
    const name = newDeptRef.current?.value?.trim();
    if (!name) return;
    if (!deptList.includes(name)) {
      setDeptList((ds) => [...ds, name]);
      update("department", name);
    }
    setAddingDept(false);
    if (newDeptRef.current) newDeptRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (Object.keys(errors).length) return;

    const payload = {
      employeeCode: form.employeeCode.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      department: form.department,
      position: form.position.trim(),
      employmentType: form.employmentType,
      status: form.status,
      hireDate: form.hireDate,
      baseSalary: toNumberOrNull(form.baseSalary),
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (onSubmit) {
        await onSubmit(payload, form.avatar);
      } else {
        alert("บันทึกพนักงาน (ตัวอย่าง)\n\n" + JSON.stringify(payload, null, 2));
      }
    } catch (err) {
      console.error(err);
      alert("บันทึกไม่สำเร็จ: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">เพิ่มพนักงานใหม่</h1>
          <span className="text-xs text-slate-500">Form • Employee Master Data</span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left: main form */}
          <div className="md:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">รหัสพนักงาน *</label>
                  <input
                    type="text"
                    value={form.employeeCode}
                    onChange={(e) => update("employeeCode", e.target.value)}
                    placeholder="เช่น EMP-0001"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.employeeCode ? "border-red-300" : "border-slate-200"}`}
                  />
                  {errors.employeeCode && <p className="mt-1 text-xs text-red-600">{errors.employeeCode}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">อีเมล</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.email ? "border-red-300" : "border-slate-200"}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อ *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.firstName ? "border-red-300" : "border-slate-200"}`}
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">นามสกุล *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.lastName ? "border-red-300" : "border-slate-200"}`}
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">เบอร์โทร</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="08xxxxxxxx"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.phone ? "border-red-300" : "border-slate-200"}`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ตำแหน่ง *</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => update("position", e.target.value)}
                    placeholder="เช่น Payroll Officer"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.position ? "border-red-300" : "border-slate-200"}`}
                  />
                  {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">แผนก *</label>
                  <div className="flex gap-2">
                    <select
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.department ? "border-red-300" : "border-slate-200"}`}
                    >
                      <option value="" disabled>
                        เลือกแผนก
                      </option>
                      {deptList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setAddingDept(true)}
                      className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      เพิ่มแผนก
                    </button>
                  </div>
                  {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}
                  {addingDept && (
                    <div className="mt-2 flex gap-2">
                      <input ref={newDeptRef} type="text" placeholder="ชื่อแผนกใหม่" className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200" />
                      <button type="button" onClick={addDepartment} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                        บันทึก
                      </button>
                      <button type="button" onClick={() => setAddingDept(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        ยกเลิก
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ประเภทจ้าง *</label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => update("employmentType", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {EMP_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">สถานะ *</label>
                  <select
                    value={form.status}
                    onChange={(e) => update("status", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">วันที่เริ่มงาน *</label>
                  <input
                    type="date"
                    value={form.hireDate}
                    onChange={(e) => update("hireDate", e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.hireDate ? "border-red-300" : "border-slate-200"}`}
                  />
                  {errors.hireDate && <p className="mt-1 text-xs text-red-600">{errors.hireDate}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">เงินเดือนพื้นฐาน (บาท/เดือน) *</label>
                  <input
                    inputMode="decimal"
                    value={form.baseSalary}
                    onChange={(e) => update("baseSalary", e.target.value.replace(/[^\d.,]/g, ""))}
                    placeholder="เช่น 30000"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.baseSalary ? "border-red-300" : "border-slate-200"}`}
                  />
                  {errors.baseSalary && <p className="mt-1 text-xs text-red-600">{errors.baseSalary}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่</label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">บันทึกเพิ่มเติม</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="md:col-span-2 mt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        employeeCode: "",
                        firstName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        department: deptList[0] ?? "",
                        position: "",
                        employmentType: EMP_TYPES[0],
                        status: STATUSES[0],
                        hireDate: "",
                        baseSalary: "",
                        address: "",
                        notes: "",
                        avatar: null,
                      })
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    ล้างฟอร์ม
                  </button>
                  <button
                    type="submit"
                    disabled={Object.keys(errors).length > 0}
                    className="rounded-xl bg-indigo-600 px-5 py-2 font-medium text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    บันทึกพนักงาน
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: avatar & preview */}
          <div className="md:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">รูปโปรไฟล์</h2>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                    {form.avatar ? (
                      <img
                        src={URL.createObjectURL(form.avatar)}
                        alt="avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">N/A</div>
                    )}
                  </div>
                  <label className="inline-block cursor-pointer rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    อัพโหลด
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => update("avatar", e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {form.avatar && (
                    <button
                      type="button"
                      onClick={() => update("avatar", null)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      ลบรูป
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-black/5">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">สรุป</h2>
                <ul className="space-y-1 text-sm text-slate-700">
                  <li><span className="text-slate-500">ชื่อ: </span>{form.firstName || "-"} {form.lastName || ""}</li>
                  <li><span className="text-slate-500">รหัส: </span>{form.employeeCode || "-"}</li>
                  <li><span className="text-slate-500">ตำแหน่ง: </span>{form.position || "-"}</li>
                  <li><span className="text-slate-500">แผนก: </span>{form.department || "-"}</li>
                  <li><span className="text-slate-500">สถานะ: </span>{form.status}</li>
                  <li><span className="text-slate-500">เริ่มงาน: </span>{form.hireDate || "-"}</li>
                  <li><span className="text-slate-500">เงินเดือน: </span>{form.baseSalary || "-"}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-xs text-slate-600">
                <p className="mb-1 font-medium text-slate-700">เชื่อมต่อกับ Backend</p>
                <p>
                  ส่งข้อมูลด้วย <code>FormData</code> หากมีรูป โดยแนบ <code>data</code> (JSON) และ <code>avatar</code> (ไฟล์รูป)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
การใช้งาน:
- วางไฟล์นี้เป็น src/pages/AddEmployeePage.jsx
- เพิ่ม route ใน App.jsx เช่น:

import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddEmployeePage from "./pages/AddEmployeePage";

async function createEmployee(payload, avatar) {
  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  if (avatar) fd.append("avatar", avatar);
  const res = await fetch("/api/employees", { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status} - ${t.slice(0,120)}`);
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/employees/new" element={<AddEmployeePage onSubmit={createEmployee} />} />
      </Routes>
    </BrowserRouter>
  );
}
*/