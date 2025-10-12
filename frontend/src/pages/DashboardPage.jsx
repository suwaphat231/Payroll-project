import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, FileText, Calendar } from "lucide-react";

const data = [
  { month: "ม.ค.", total: 120000 },
  { month: "ก.พ.", total: 135000 },
  { month: "มี.ค.", total: 125000 },
  { month: "เม.ย.", total: 140000 },
  { month: "พ.ค.", total: 150000 },
  { month: "มิ.ย.", total: 138000 },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-2 text-white">ภาพรวมระบบ Payroll</h1>
      <p className="text-slate-400 mb-6">สรุปข้อมูลพนักงานและการจ่ายเงินเดือนในระบบ</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard icon={<Users size={24} />} label="พนักงานทั้งหมด" value="25 คน" color="bg-indigo-600/20 text-indigo-400 border-indigo-500/30" />
        <SummaryCard icon={<DollarSign size={24} />} label="เงินเดือนรวมเดือนนี้" value="฿ 1,250,000" color="bg-green-600/20 text-green-400 border-green-500/30" />
        <SummaryCard icon={<Calendar size={24} />} label="ลารวมเดือนนี้" value="6 รายการ" color="bg-yellow-600/20 text-yellow-400 border-yellow-500/30" />
        <SummaryCard icon={<FileText size={24} />} label="รายงานล่าสุด" value="Payroll_2025_09.csv" color="bg-rose-600/20 text-rose-400 border-rose-500/30" />
      </div>

      {/* Chart Section */}
      <div className="bg-slate-800/50 rounded-2xl shadow-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">กราฟสรุปยอดจ่ายเงินเดือนย้อนหลัง 6 เดือน</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 🔹 Subcomponent: Summary Card
function SummaryCard({ icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-4 bg-slate-800/50 shadow-lg rounded-2xl p-5 border-l-4 border ${color}`}>
      <div className="p-3 rounded-full bg-slate-700/50 shadow-inner">{icon}</div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <h3 className="text-lg font-semibold text-white">{value}</h3>
      </div>
    </div>
  );
}
