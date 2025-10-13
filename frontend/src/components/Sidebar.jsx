import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Sidebar() {
  const { role } = useAuth();
  const { pathname } = useLocation();

  const r = (role || "").toLowerCase();

  const menu = [
    { path: "/dashboard", label: "Dashboard", allowed: ["hr", "accounting", "employee", "admin"] },
    { path: "/employees", label: "Employees", allowed: ["hr", "admin"] },
    { path: "/payroll", label: "Payroll", allowed: ["hr", "accounting", "admin"] },
    { path: "/payslips", label: "Payslips", allowed: ["employee", "hr", "admin"] },
    { path: "/leave", label: "Leave", allowed: ["employee", "hr", "admin"] },
    { path: "/reports", label: "Reports", allowed: ["accounting", "hr", "admin"] },
    { path: "/settings", label: "Settings", allowed: ["admin"] },
  ];

  return (
    <aside className="w-64 bg-slate-900 h-screen shadow-md p-4">
      <h2 className="text-lg font-semibold text-white mb-6">Menu</h2>
      <ul className="space-y-2">
        {menu
          .filter((m) => m.allowed.includes(r))
          .map((m) => (
            <li key={m.path}>
              <Link
                to={m.path}
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  pathname === m.path
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {m.label}
              </Link>
            </li>
          ))}
      </ul>
    </aside>
  );
}
