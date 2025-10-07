import { useEffect, useMemo, useState } from "react";

// Utility formatters
const THB = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("th-TH") : "-");

// Initial sample dataset (replace with API)
const sampleEmployees = [
  {
    code: "EMP-0001",
    firstName: "Somchai",
    lastName: "Prasert",
    email: "somchai@company.com",
    phone: "0812345678",
    dept: "Finance",
    position: "Payroll Officer",
    employmentType: "Full-time",
    status: "Active",
    hireDate: "2024-01-10",
    baseSalary: 30000,
    address: "123 ถนนสุขุมวิท คลองเตย กทม.",
    avatarUrl: "",
    bank: { name: "Krungsri", account: "XXX-X-12345-0" },
    emergency: { name: "Nok", phone: "0899999999", relation: "Sister" },
    docs: [ { name: "บัตรประชาชน.pdf", url: "#" }, { name: "สัญญาจ้าง.pdf", url: "#" } ],
    leaveSummary: { Annual: 12, used: { Annual: 2, Sick: 1, Personal: 0 } },
    payrollHistory: [
      { period: "2025-08", gross: 31500, sso: 750, tax: 1200, net: 29550 },
      { period: "2025-07", gross: 33000, sso: 750, tax: 1400, net: 30850 },
    ],
  },
  {
    code: "EMP-0002",
    firstName: "Suda",
    lastName: "Chaiyo",
    email: "suda@company.com",
    phone: "0891112222",
    dept: "Engineering",
    position: "Developer",
    employmentType: "Full-time",
    status: "Active",
    hireDate: "2023-11-05",
    baseSalary: 45000,
    address: "เชียงใหม่",
    avatarUrl: "",
    bank: { name: "Krungsri", account: "XXX-X-22222-0" },
    emergency: { name: "Mum", phone: "0810000000", relation: "Mother" },
    docs: [ { name: "สำเนาทะเบียนบ้าน.pdf", url: "#" } ],
    leaveSummary: { Annual: 12, used: { Annual: 1, Sick: 2, Personal: 0 } },
    payrollHistory: [
      { period: "2025-08", gross: 47000, sso: 750, tax: 2400, net: 43850 },
      { period: "2025-07", gross: 47000, sso: 750, tax: 2400, net: 43850 },
    ],
  },
  {
    code: "EMP-0003",
    firstName: "Anan",
    lastName: "K.",
    email: "anan@company.com",
    phone: "0867778888",
    dept: "Operations",
    position: "Ops",
    employmentType: "Contract",
    status: "Resigned",
    hireDate: "2022-03-12",
    resignDate: "2025-06-30",
    baseSalary: 20000,
    address: "นนทบุรี",
    avatarUrl: "",
    bank: { name: "Krungsri", account: "XXX-X-33333-0" },
    emergency: { name: "Brother", phone: "0822223333", relation: "Brother" },
    docs: [],
    leaveSummary: { Annual: 0, used: { } },
    payrollHistory: [
      { period: "2025-06", gross: 21000, sso: 750, tax: 500, net: 19750 },
    ],
  },
];

export default function EmployeesPage({ fetchEmployees }) {
  const [employees, setEmployees] = useState(sampleEmployees);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState(null); // employee object
  const [tab, setTab] = useState("overview"); // overview | payroll | leave | docs

  // Load from API (optional)
  useEffect(() => {
    let active = true;
    (async () => {
      if (!fetchEmployees) return;
      try {
        const list = await fetchEmployees(); // should return array of employees
        if (active && Array.isArray(list)) setEmployees(list);
      } catch (e) { console.warn(e); }
    })();
    return () => { active = false; };
  }, [fetchEmployees]);

  const depts = useMemo(() => ["ALL", ...Array.from(new Set(employees.map(e => e.dept)))], [employees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter(e => (
      (dept === "ALL" || e.dept === dept) &&
      (status === "ALL" || e.status === status) &&
      (!q || e.code.toLowerCase().includes(q) || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q))
    ));
  }, [employees, query, dept, status]);

  function exportCsv() {
    const header = ["Code","Name","Dept","Position","Status","HireDate","ResignDate","BaseSalary","Email","Phone"];
    const lines = [header.join(",")];
    filtered.forEach(e => {
      const row = [
        e.code,
        `${e.firstName} ${e.lastName}`,
        e.dept,
        e.position,
        e.status,
        e.hireDate || "",
        e.resignDate || "",
        e.baseSalary || 0,
        e.email || "",
        e.phone || "",
      ];
      lines.push(row.map(v => typeof v === 'string' ? `"${v.replaceAll('"','""')}"` : v).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `employees_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">พนักงาน (Employees)</h1>
            <p className="text-sm text-slate-600">รายชื่อ + รายละเอียดเชิงลึก (สำหรับ Admin/HR)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="ค้นหา: ชื่อ/รหัส"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <select value={dept} onChange={e=>setDept(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              {depts.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              {['ALL','Active','On Leave','Probation','Resigned'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={exportCsv} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Export CSV</button>
            <a href="/employees/new" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ Add Employee</a>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl bg-white shadow ring-1 ring-black/5">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <Th>รหัส</Th>
                <Th>ชื่อ</Th>
                <Th>แผนก</Th>
                <Th>ตำแหน่ง</Th>
                <Th>ประเภทจ้าง</Th>
                <Th>สถานะ</Th>
                <Th>เริ่มงาน</Th>
                <Th className="text-right">เงินเดือน</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.code} className="odd:bg-white even:bg-slate-50/50">
                  <Td>{e.code}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${e.firstName} ${e.lastName}`} src={e.avatarUrl}/>
                      <div>
                        <div className="font-medium text-slate-900">{e.firstName} {e.lastName}</div>
                        <div className="text-xs text-slate-500">{e.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{e.dept}</Td>
                  <Td>{e.position}</Td>
                  <Td>{e.employmentType}</Td>
                  <Td>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badgeColor(e.status)}`}>{e.status}</span>
                  </Td>
                  <Td>{fmtDate(e.hireDate)}</Td>
                  <Td className="text-right">{THB.format(e.baseSalary || 0)}</Td>
                  <Td>
                    <button onClick={()=>{ setSelected(e); setTab('overview'); }} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs hover:bg-slate-50">รายละเอียด</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Drawer / Modal for details */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={()=>setSelected(null)} />
            <div className="relative z-10 h-[88vh] w-full max-w-4xl overflow-hidden rounded-t-2xl bg-white shadow-2xl md:h-auto md:rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar size="lg" name={`${selected.firstName} ${selected.lastName}`} src={selected.avatarUrl} />
                  <div>
                    <div className="text-lg font-semibold">{selected.firstName} {selected.lastName} <span className="text-slate-400 font-normal">• {selected.code}</span></div>
                    <div className="text-sm text-slate-500">{selected.position} • {selected.dept}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`/payslip?code=${selected.code}`} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800">ดูสลิป</a>
                  <button onClick={()=>setSelected(null)} className="rounded-xl border px-3 py-2 text-xs">ปิด</button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b px-4">
                {['overview','payroll','leave','docs'].map(t => (
                  <button key={t} onClick={()=>setTab(t)} className={`rounded-t-xl px-3 py-2 text-sm ${tab===t? 'bg-slate-100 font-medium':'text-slate-600 hover:bg-slate-50'}`}>{tabLabel(t)}</button>
                ))}
              </div>

              {/* Content */}
              <div className="grid gap-4 p-4 md:grid-cols-2">
                {tab === 'overview' && (
                  <>
                    <Card title="ข้อมูลติดต่อ">
                      <div className="text-sm">
                        <Row label="อีเมล" value={selected.email} />
                        <Row label="โทร" value={selected.phone} />
                        <Row label="ที่อยู่" value={selected.address} />
                        <Row label="สถานะ" value={selected.status} />
                        <Row label="วันที่เริ่มงาน" value={fmtDate(selected.hireDate)} />
                        {selected.resignDate && <Row label="วันที่ลาออก" value={fmtDate(selected.resignDate)} />}
                      </div>
                    </Card>
                    <Card title="บัญชีรับเงินเดือน">
                      <div className="text-sm">
                        <Row label="ธนาคาร" value={selected.bank?.name} />
                        <Row label="เลขบัญชี" value={selected.bank?.account} />
                        <Row label="เงินเดือนพื้นฐาน" value={THB.format(selected.baseSalary || 0)} />
                      </div>
                    </Card>
                    <Card title="บุคคลติดต่อฉุกเฉิน">
                      <div className="text-sm">
                        <Row label="ชื่อ" value={selected.emergency?.name} />
                        <Row label="ความสัมพันธ์" value={selected.emergency?.relation} />
                        <Row label="โทร" value={selected.emergency?.phone} />
                      </div>
                    </Card>
                    <Card title="สิทธิ์ลา (สรุป)">
                      <div className="text-sm space-y-1">
                        {Object.entries(selected.leaveSummary?.used || {}).map(([k,v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-slate-600">{k}</span>
                            <span className="font-medium">ใช้แล้ว {v} วัน</span>
                          </div>
                        ))}
                        {selected.leaveSummary?.Annual !== undefined && (
                          <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">สิทธิ์ลาประจำปี: {selected.leaveSummary.Annual} วัน</div>
                        )}
                      </div>
                    </Card>
                  </>
                )}

                {tab === 'payroll' && (
                  <div className="md:col-span-2">
                    <Card title="ประวัติเงินเดือน (งวดล่าสุดก่อนหน้า)">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <Th>งวด</Th><Th className="text-right">Gross</Th><Th className="text-right">SSO</Th><Th className="text-right">Tax</Th><Th className="text-right">Net</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selected.payrollHistory || []).map((p,i) => (
                            <tr key={i} className="odd:bg-white even:bg-slate-50/50">
                              <Td>{p.period}</Td>
                              <Td className="text-right">{THB.format(p.gross||0)}</Td>
                              <Td className="text-right">{THB.format(p.sso||0)}</Td>
                              <Td className="text-right">{THB.format(p.tax||0)}</Td>
                              <Td className="text-right font-medium">{THB.format(p.net||0)}</Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                )}

                {tab === 'leave' && (
                  <div className="md:col-span-2">
                    <Card title="สรุปการลา (ปีนี้)">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {Object.entries(selected.leaveSummary?.used || {}).map(([k,v]) => (
                          <div key={k} className="rounded-xl bg-slate-50 p-3 text-center">
                            <div className="text-xs text-slate-500">{k}</div>
                            <div className="text-xl font-bold">{v}</div>
                            <div className="text-xs text-slate-400">วัน</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-slate-500">* เพิ่มกราฟ/ตารางรายละเอียดการลาได้เมื่อเชื่อม API จริง</div>
                    </Card>
                  </div>
                )}

                {tab === 'docs' && (
                  <div className="md:col-span-2">
                    <Card title="เอกสารแนบของพนักงาน">
                      {selected.docs?.length ? (
                        <ul className="list-disc space-y-1 pl-5 text-sm">
                          {selected.docs.map((d,i) => (
                            <li key={i}><a className="text-indigo-600 hover:underline" href={d.url}>{d.name}</a></li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-500">— ไม่มีเอกสาร —</div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Small UI parts
function Th({ children, className = "" }) { return <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>{children}</th>; }
function Td({ children, className = "" }) { return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>; }
function Card({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">{title}</div>
      {children}
    </div>
  );
}
function Avatar({ name = "-", src = "", size = "md" }) {
  const initials = name.split(" ").map(s => s[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
  const cls = size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-sm';
  return (
    <div className={`inline-flex items-center justify-center overflow-hidden rounded-xl bg-slate-200 ${cls}`}>
      {src ? <img src={src} alt={name} className="h-full w-full object-cover"/> : <span className="font-semibold text-slate-700">{initials}</span>}
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b py-1 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900">{value || '-'}</span>
    </div>
  );
}
function badgeColor(status) {
  switch (status) {
    case 'Active': return 'bg-emerald-100 text-emerald-800';
    case 'Resigned': return 'bg-red-100 text-red-800';
    case 'On Leave': return 'bg-amber-100 text-amber-800';
    case 'Probation': return 'bg-sky-100 text-sky-800';
    default: return 'bg-slate-100 text-slate-700';
  }
}

/*
การใช้งาน:
- วางไฟล์เป็น src/pages/EmployeesPage.jsx
- เพิ่ม route ใน App.jsx:

import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmployeesPage from "./pages/EmployeesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/employees" element={<EmployeesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

เชื่อมต่อ API จริง (แนวทาง):
- ส่ง prop fetchEmployees: async () => fetch('/api/employees').then(r=>r.json())
- เพิ่มปุ่ม "Edit"/"Deactivate" ได้ โดยสร้าง drawer form และยิง PUT/PATCH ไปที่ `/api/employees/:code`
- ลิงก์ "ดูสลิป" สามารถนำไปหน้า PaySlipPage โดยส่ง query เช่น `?code=EMP-0001&period=2025-08`
*/