import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();          // << ได้ทั้ง user และ logout
  const navigate = useNavigate();              // << อยู่ "ใน" ตัว component เท่านั้น

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex justify-between items-center px-6 py-3 bg-slate-900 border-b border-slate-700 shadow-lg">
      <strong className="text-xl font-bold text-white">Payroll System</strong>
      <nav className="flex gap-4 items-center">
        <span className="text-slate-300 text-sm">{user?.name ?? "Guest"} <span className="text-slate-500">({user?.role ?? "-"})</span></span>
        <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors text-sm">Dashboard</Link>
        <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">Logout</button>
      </nav>
    </header>
  );
}
