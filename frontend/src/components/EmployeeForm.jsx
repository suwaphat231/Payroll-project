import { useState } from "react";

export default function EmployeeForm({ initialValues = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    emp_code: "",
    first_name: "",
    last_name: "",
    department: "",
    position: "",
    base_salary: 0,
    bank_account: "",
    pvd_rate: 0.03,
    withholding_rate: 0.02,
    sso_enabled: true,
    status: "active",
    ...initialValues,
  });

  const update = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-3"
    >
      <input className="border p-2 w-full" placeholder="Emp Code" value={form.emp_code} onChange={update("emp_code")} />
      <input className="border p-2 w-full" placeholder="First Name" value={form.first_name} onChange={update("first_name")} />
      <input className="border p-2 w-full" placeholder="Last Name" value={form.last_name} onChange={update("last_name")} />
      <input className="border p-2 w-full" placeholder="Department" value={form.department} onChange={update("department")} />
      <input className="border p-2 w-full" placeholder="Position" value={form.position} onChange={update("position")} />
      <input className="border p-2 w-full" type="number" placeholder="Base Salary" value={form.base_salary} onChange={update("base_salary")} />
      <input className="border p-2 w-full" placeholder="Bank Account" value={form.bank_account} onChange={update("bank_account")} />
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.sso_enabled} onChange={update("sso_enabled")} /> SSO Enabled
      </label>
      <div className="flex gap-2">
        <button className="bg-viridian-600 text-white px-4 py-2 rounded" type="submit">Save</button>
        <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
      </div>
    </form>
  );
}