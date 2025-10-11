import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../services/api";
import useAuth from "../hooks/useAuth";

const THB = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
});
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH") : "-");

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiGet("/employees")
      .then((res) => {
        if (!mounted) return;
        setEmployees(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setError("โหลดข้อมูลพนักงานไม่สำเร็จ");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const name = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      return (
        emp.code?.toLowerCase().includes(q) ||
        name.includes(q) ||
        (emp.department || "").toLowerCase().includes(q)
      );
    });
  }, [employees, query]);

  const showAddButton = user?.role === "admin" || user?.role === "hr";

  const tabLabel = (t) =>
    ({
      overview: "ข้อมูลพื้นฐาน",
      payroll: "เงินเดือน",
      leave: "การลา",
      docs: "เอกสาร",
    })[t] || t;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">พนักงาน (Employees)</h1>
        {showAddButton && (
          <button
            onClick={() => navigate("/employees/new")}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + เพิ่มพนักงาน
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหา..."
          className="rounded-xl border px-3 py-2 text-sm"
        />
        {loading && (
          <span className="text-sm text-slate-500">กำลังโหลด...</span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow ring-1 ring-black/5">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <Th>รหัส</Th>
              <Th>ชื่อ</Th>
              <Th>แผนก</Th>
              <Th>ตำแหน่ง</Th>
              <Th className="text-right">เงินเดือน</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const name =
                `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "-";
              const salary = emp.employment?.baseSalary ?? 0;
              return (
                <tr
                  key={emp.id || emp.code}
                  className="odd:bg-white even:bg-slate-50/50"
                >
                  <Td>{emp.code}</Td>
                  <Td>{name}</Td>
                  <Td>{emp.department || "-"}</Td>
                  <Td>{emp.position || "-"}</Td>
                  <Td className="text-right">
                    {salary ? THB.format(salary) : "-"}
                  </Td>
                  <Td>
                    <button
                      onClick={() => setSelected(emp)}
                      className="border rounded-lg px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      รายละเอียด
                    </button>
                  </Td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-slate-500 py-6">
                  ไม่พบข้อมูลพนักงาน
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-2xl p-4">
            <div className="flex justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-slate-500 text-sm">
                  {selected.position} • {selected.dept}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 border-b mb-4">
              {["overview", "payroll", "leave", "docs"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 rounded-t-lg text-sm ${tab === t ? "bg-slate-100 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {tabLabel(t)}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-2 text-sm">
                <Row label="รหัส" value={selected.code} />
                <Row label="อีเมล" value={selected.email || "-"} />
                <Row label="โทร" value={selected.phone || "-"} />
                <Row label="แผนก" value={selected.department || "-"} />
                <Row label="ตำแหน่ง" value={selected.position || "-"} />
                <Row
                  label="เงินเดือน"
                  value={
                    selected.employment?.baseSalary
                      ? THB.format(selected.employment.baseSalary)
                      : "-"
                  }
                />
                <Row
                  label="วันที่เริ่มงาน"
                  value={fmtDate(selected.employment?.hireDate)}
                />
                <Row
                  label="สถานะ"
                  value={
                    selected.status || (selected.active ? "Active" : "Inactive")
                  }
                />
              </div>
            )}
            {tab === "payroll" && (
              <p className="text-sm text-slate-500">
                ข้อมูลเงินเดือนย้อนหลัง (ยังไม่มีข้อมูลจริง)
              </p>
            )}
            {tab === "leave" && (
              <p className="text-sm text-slate-500">
                ข้อมูลการลา (ยังไม่มีข้อมูลจริง)
              </p>
            )}
            {tab === "docs" && (
              <p className="text-sm text-slate-500">
                ไฟล์เอกสาร (ยังไม่มีข้อมูลจริง)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 🧩 Mini UI Components
const Th = ({ children, className = "" }) => (
  <th
    className={`px-3 py-2 text-left text-xs font-semibold uppercase ${className}`}
  >
    {children}
  </th>
);
const Td = ({ children, className = "", ...props }) => (
  <td className={`px-3 py-2 ${className}`} {...props}>
    {children}
  </td>
);
const Row = ({ label, value }) => (
  <div className="flex justify-between border-b py-1 last:border-b-0">
    <span className="text-slate-500">{label}</span>
    <span className="text-slate-900">{value}</span>
  </div>
);
