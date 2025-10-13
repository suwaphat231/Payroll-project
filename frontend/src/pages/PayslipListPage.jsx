import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../services/api";

function thb(n) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2
  }).format(n || 0);
}

export default function PayslipListPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [period, setPeriod] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const [currentRun, setCurrentRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Load payslips when period changes
  useEffect(() => {
    loadPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  async function loadPayslips() {
    try {
      setLoading(true);
      setError("");

      // First, create or get the payroll run for this period
      const run = await apiPost(`/payroll/runs`, {
        year: period.year,
        month: period.month
      }, { auth: true });

      if (!run || !run.id) {
        setError("ไม่พบข้อมูล payroll run สำหรับงวดนี้");
        setPayslips([]);
        return;
      }

      setCurrentRun(run);

      // Then fetch payslips for this run
      const slips = await apiGet(`/payslips/${run.id}`, { auth: true });
      setPayslips(slips || []);
    } catch (err) {
      console.error("Failed to load payslips:", err);
      setError("ไม่สามารถโหลดข้อมูล payslip ได้");
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter payslips
  const filteredPayslips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return payslips;
    return payslips.filter(slip => {
      const emp = slip.employee || {};
      return (
        emp.code?.toLowerCase().includes(q) ||
        emp.name?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q)
      );
    });
  }, [payslips, searchQuery]);

  function handleViewPayslip(slip) {
    navigate(`/payslip/${slip.runId}/${slip.employeeId}`, { state: { payslip: slip } });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">สลิปเงินเดือน (Payslips)</h1>
            <p className="text-sm text-slate-400">
              งวด: {period.month}/{period.year}
              {currentRun && <span className="ml-2">• Run ID: {currentRun.id}</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period.year}
              onChange={e => setPeriod(p => ({ ...p, year: Number(e.target.value) }))}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
            <select
              value={period.month}
              onChange={e => setPeriod(p => ({ ...p, month: Number(e.target.value) }))}
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหา: รหัส/ชื่อ/แผนก"
              className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400"
            />
            <button
              onClick={loadPayslips}
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-lg disabled:opacity-50"
            >
              {loading ? "กำลังโหลด..." : "รีเฟรช"}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-xl bg-red-900/50 border border-red-700 p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Info panel */}
        <div className="rounded-2xl bg-slate-800/50 p-4 shadow-xl ring-1 ring-slate-700">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">จำนวน Payslips</p>
              <p className="text-lg font-semibold text-white">{payslips.length} ใบ</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">ยอดจ่ายรวม</p>
              <p className="text-lg font-semibold text-emerald-400">
                {thb(payslips.reduce((sum, slip) => sum + (slip.netPay || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">สถานะ</p>
              <p className="text-lg font-semibold text-blue-400">
                {currentRun?.locked ? "ล็อคแล้ว" : "พร้อมดู"}
              </p>
            </div>
          </div>
        </div>

        {/* Payslips Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading && payslips.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              กำลังโหลดข้อมูล...
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-400">
              ไม่พบข้อมูล payslip
            </div>
          ) : (
            filteredPayslips.map((slip) => (
              <PayslipCard
                key={slip.id}
                slip={slip}
                onView={() => handleViewPayslip(slip)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PayslipCard({ slip, onView }) {
  const emp = slip.employee || {};
  const period = slip.period || {};

  return (
    <div className="rounded-2xl bg-slate-800/50 p-5 shadow-xl ring-1 ring-slate-700 hover:ring-indigo-500 transition-all">
      <div className="mb-3">
        <div className="text-lg font-semibold text-white">{emp.name || "-"}</div>
        <div className="text-sm text-slate-400">{emp.code || "-"}</div>
      </div>

      <div className="mb-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">ตำแหน่ง:</span>
          <span className="text-slate-200">{emp.position || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">แผนก:</span>
          <span className="text-slate-200">{emp.department || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">งวด:</span>
          <span className="text-slate-200">
            {period.start && period.end
              ? `${new Date(period.start).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })} - ${new Date(period.end).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}`
              : "-"}
          </span>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-emerald-900/30 p-3 ring-1 ring-emerald-600">
        <div className="text-xs text-emerald-400">เงินได้สุทธิ</div>
        <div className="text-xl font-bold text-emerald-300">{thb(slip.netPay || 0)}</div>
      </div>

      <button
        onClick={onView}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-lg transition"
      >
        ดู Payslip
      </button>
    </div>
  );
}
