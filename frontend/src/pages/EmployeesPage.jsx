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
        // Backend returns {data: [], count, total} format
        const employees = res?.data || (Array.isArray(res) ? res : []);
        setEmployees(employees);
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
        emp.empCode?.toLowerCase().includes(q) ||
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-white">พนักงาน (Employees)</h1>
        {showAddButton && (
          <button
            onClick={() => navigate("/employees/new")}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-lg"
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
          className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
        />
        {loading && (
          <span className="text-sm text-slate-400">กำลังโหลด...</span>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      <div className="overflow-x-auto bg-slate-800/50 rounded-2xl shadow-xl ring-1 ring-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/50 text-slate-300">
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
              const salary = emp.baseSalary ?? 0;
              return (
                <tr
                  key={emp.id || emp.empCode}
                  className="odd:bg-slate-800/30 even:bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 transition-colors"
                >
                  <Td>{emp.empCode}</Td>
                  <Td>{name}</Td>
                  <Td>{emp.department || "-"}</Td>
                  <Td>{emp.position || "-"}</Td>
                  <Td className="text-right">
                    {salary ? THB.format(salary) : "-"}
                  </Td>
                  <Td>
                    <button
                      onClick={() => setSelected(emp)}
                      className="border border-slate-600 rounded-lg px-3 py-1 text-xs hover:bg-slate-700 text-slate-300"
                    >
                      รายละเอียด
                    </button>
                  </Td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-slate-400 py-6">
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-[90%] max-w-2xl p-4 border border-slate-700">
            <div className="flex justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold text-white">{selected.firstName} {selected.lastName}</h2>
                <p className="text-slate-400 text-sm">
                  {selected.position} • {selected.department}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 border-b border-slate-700 mb-4">
              {["overview", "payroll", "leave", "docs"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 rounded-t-lg text-sm ${tab === t ? "bg-slate-700 font-medium text-white" : "text-slate-400 hover:bg-slate-700/50"}`}
                >
                  {tabLabel(t)}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-2 text-sm">
                <Row label="รหัส" value={selected.empCode} />
                <Row label="บัญชีธนาคาร" value={selected.bankAccount || "-"} />
                <Row label="แผนก" value={selected.department || "-"} />
                <Row label="ตำแหน่ง" value={selected.position || "-"} />
                <Row
                  label="เงินเดือน"
                  value={
                    selected.baseSalary
                      ? THB.format(selected.baseSalary)
                      : "-"
                  }
                />
                <Row
                  label="วันที่เริ่มงาน"
                  value={fmtDate(selected.hiredAt)}
                />
                <Row
                  label="สถานะ"
                  value={selected.status || "-"}
                />
              </div>
            )}
            {tab === "payroll" && (
              <p className="text-sm text-slate-400">
                ข้อมูลเงินเดือนย้อนหลัง (ยังไม่มีข้อมูลจริง)
              </p>
            )}
            {tab === "leave" && (
              <p className="text-sm text-slate-400">
                ข้อมูลการลา (ยังไม่มีข้อมูลจริง)
              </p>
            )}
            {tab === "docs" && (
              <p className="text-sm text-slate-400">
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
  <div className="flex justify-between border-b border-slate-700 py-1 last:border-b-0">
    <span className="text-slate-400">{label}</span>
    <span className="text-slate-200">{value}</span>
  </div>
);
