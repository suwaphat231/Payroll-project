import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../services/api";

const EMP_TYPES = ["Full-time", "Part-time", "Contract", "Intern"];
const STATUSES = ["Active", "On Leave", "Probation", "Resigned"];
const DEFAULT_DEPTS = [
  "HR",
  "Finance",
  "Engineering",
  "Operations",
  "Sales",
  "Marketing",
];

function isEmail(x) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x ?? "");
}
function isPhoneTH(x) {
  return /^0\d{8,9}$/.test((x ?? "").replace(/\D/g, ""));
}
function toNumberOrNull(x) {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(String(x).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function AddEmployeePage({ departments = DEFAULT_DEPTS }) {
  const navigate = useNavigate();
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");

  const errors = useMemo(() => {
    const e = {};
    if (!form.employeeCode.trim()) e.employeeCode = "กรุณากรอกรหัสพนักงาน";
    if (!form.firstName.trim()) e.firstName = "กรุณากรอกชื่อ";
    if (!form.lastName.trim()) e.lastName = "กรุณากรอกนามสกุล";
    if (form.email && !isEmail(form.email)) e.email = "อีเมลไม่ถูกต้อง";
    if (form.phone && !isPhoneTH(form.phone))
      e.phone = "เบอร์ไม่ถูกต้อง (ต้องเริ่มด้วย 0 และยาว 9-10 หลัก)";
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
      code: form.employeeCode.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      department: form.department,
      position: form.position.trim(),
      employmentType: form.employmentType,
      status: form.status,
      hireDate: form.hireDate,
      baseSalary: toNumberOrNull(form.baseSalary) ?? 0,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      setSubmitting(true);
      setSubmitError("");
      await apiPost("/employees", payload);
      setSuccess("บันทึกพนักงานเรียบร้อย");
      setTimeout(() => navigate("/employees"), 800);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            เพิ่มพนักงานใหม่
          </h1>
          <span className="text-xs text-slate-500">
            Form • Employee Master Data
          </span>
        </div>

        {submitError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {submitError}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
              <form
                id="add-employee-form"
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    รหัสพนักงาน *
                  </label>
                  <input
                    type="text"
                    value={form.employeeCode}
                    onChange={(e) => update("employeeCode", e.target.value)}
                    placeholder="เช่น EMP-0001"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.employeeCode ? "border-red-300" : "border-slate-200"}`}
                    disabled={submitting}
                  />
                  {errors.employeeCode && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.employeeCode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.email ? "border-red-300" : "border-slate-200"}`}
                    disabled={submitting}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    ชื่อ *
                  </label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.firstName ? "border-red-300" : "border-slate-200"}`}
                    disabled={submitting}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    นามสกุล *
                  </label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.lastName ? "border-red-300" : "border-slate-200"}`}
                    disabled={submitting}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    เบอร์โทร
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="08xxxxxxxx"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.phone ? "border-red-300" : "border-slate-200"}`}
                    disabled={submitting}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    ตำแหน่ง *
                  </label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => update("position", e.target.value)}
                    placeholder="เช่น Payroll Officer"
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.position ? "border-red-300" : "border-slate-200"}`}
                    disabled={submitting}
                  />
                  {errors.position && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.position}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    แผนก *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.department}
                      onChange={(e) => update("department", e.target.value)}
                      className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.department ? "border-red-300" : "border-slate-200"}`}
                      disabled={submitting}
                    >
                      <option value="" disabled>
                        เลือกแผนก
                      </option>
                      {deptList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setAddingDept(true)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                      disabled={submitting}
                    >
                      + เพิ่มแผนก
                    </button>
                  </div>
                  {addingDept && (
                    <div className="mt-2 flex gap-2">
                      <input
                        ref={newDeptRef}
                        type="text"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                      <button
                        type="button"
                        onClick={addDepartment}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        บันทึก
                      </button>
                    </div>
                  )}
                  {errors.department && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.department}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    วันที่เริ่มงาน *
                  </label>
                  <input
                    type="date"
                    value={form.hireDate}
                    onChange={(e) => update("hireDate", e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.hireDate ? "border-red-300" : "border-slate-200"}`}
                    disabled={submitting}
                  />
                  {errors.hireDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.hireDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    เงินเดือน (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.baseSalary}
                    onChange={(e) => update("baseSalary", e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200 ${errors.baseSalary ? "border-red-300" : "border-slate-200"}`}
                    disabled={submitting}
                  />
                  {errors.baseSalary && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.baseSalary}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    ที่อยู่
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => update("address", e.target.value)}
                    className="h-28 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200"
                    disabled={submitting}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    className="h-28 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200"
                    disabled={submitting}
                  />
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    ข้อมูลเพิ่มเติม
                  </h2>
                  <p className="text-xs text-slate-500">
                    เลือกประเภทการจ้างและสถานะพนักงาน
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    ประเภทการจ้างงาน
                  </label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => update("employmentType", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200"
                    disabled={submitting}
                  >
                    {EMP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    สถานะพนักงาน
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => update("status", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:ring-2 focus:ring-indigo-200"
                    disabled={submitting}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    อัปโหลดรูปภาพ (ถ้ามี)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      update("avatar", e.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-slate-600"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            disabled={submitting}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="add-employee-form"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "กำลังบันทึก..." : "บันทึกพนักงาน"}
          </button>
        </div>
      </div>
    </div>
  );
}
