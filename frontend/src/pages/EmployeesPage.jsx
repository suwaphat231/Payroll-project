import { useState, useMemo } from "react";

const THB = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH") : "-");

const data = [
  { code: "EMP-001", name: "สมชาย ใจดี", dept: "บัญชี", position: "เจ้าหน้าที่เงินเดือน", salary: 30000, status: "Active", email: "somchai@company.com", phone: "0812345678" },
  { code: "EMP-002", name: "มินตรา สุขสันต์", dept: "การตลาด", position: "Marketing", salary: 42000, status: "Active", email: "mintra@company.com", phone: "0891112222" },
  { code: "EMP-003", name: "อนันต์ ศรีทอง", dept: "ไอที", position: "Developer", salary: 50000, status: "Resigned", email: "anan@company.com", phone: "0867778888" },
];

export default function EmployeesPage() {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => data.filter((e) => e.name.includes(query) || e.code.includes(query)), [query]);

  const tabLabel = (t) => ({ overview: "ข้อมูลพื้นฐาน", payroll: "เงินเดือน", leave: "การลา", docs: "เอกสาร" }[t] || t);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <h1 className="text-2xl font-bold mb-4">พนักงาน (Employees)</h1>
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหา..." className="mb-4 rounded-xl border px-3 py-2 text-sm" />
      
      <div className="overflow-x-auto bg-white rounded-2xl shadow ring-1 ring-black/5">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr><Th>รหัส</Th><Th>ชื่อ</Th><Th>แผนก</Th><Th>ตำแหน่ง</Th><Th className="text-right">เงินเดือน</Th><Th></Th></tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.code} className="odd:bg-white even:bg-slate-50/50">
                <Td>{e.code}</Td><Td>{e.name}</Td><Td>{e.dept}</Td><Td>{e.position}</Td>
                <Td className="text-right">{THB.format(e.salary)}</Td>
                <Td><button onClick={() => setSelected(e)} className="border rounded-lg px-3 py-1 text-xs hover:bg-slate-50">รายละเอียด</button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-2xl p-4">
            <div className="flex justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-slate-500 text-sm">{selected.position} • {selected.dept}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-sm text-slate-600 hover:text-slate-900">✕</button>
            </div>

            <div className="flex gap-2 border-b mb-4">
              {["overview", "payroll", "leave", "docs"].map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-t-lg text-sm ${tab === t ? "bg-slate-100 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
                  {tabLabel(t)}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <div className="space-y-2 text-sm">
                <Row label="รหัส" value={selected.code} />
                <Row label="อีเมล" value={selected.email} />
                <Row label="โทร" value={selected.phone} />
                <Row label="เงินเดือน" value={THB.format(selected.salary)} />
                <Row label="สถานะ" value={selected.status} />
              </div>
            )}
            {tab === "payroll" && <p className="text-sm text-slate-500">ข้อมูลเงินเดือนย้อนหลัง (ยังไม่มีข้อมูลจริง)</p>}
            {tab === "leave" && <p className="text-sm text-slate-500">ข้อมูลการลา (ยังไม่มีข้อมูลจริง)</p>}
            {tab === "docs" && <p className="text-sm text-slate-500">ไฟล์เอกสาร (ยังไม่มีข้อมูลจริง)</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// 🧩 Mini UI Components
const Th = ({ children, className = "" }) => <th className={`px-3 py-2 text-left text-xs font-semibold uppercase ${className}`}>{children}</th>;
const Td = ({ children, className = "" }) => <td className={`px-3 py-2 ${className}`}>{children}</td>;
const Row = ({ label, value }) => (
  <div className="flex justify-between border-b py-1 last:border-b-0">
    <span className="text-slate-500">{label}</span>
    <span className="text-slate-900">{value}</span>
  </div>
);
