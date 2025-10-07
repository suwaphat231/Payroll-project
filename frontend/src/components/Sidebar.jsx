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
    <aside className="w-64 bg-gray-50 h-screen shadow-md p-4">
      <h2 className="text-lg font-semibold text-viridian-700 mb-6">Menu</h2>
      <ul className="space-y-2">
        {menu
          .filter((m) => m.allowed.includes(r))
          .map((m) => (
            <li key={m.path}>
              <Link
                to={m.path}
                className={`block px-3 py-2 rounded-lg ${
                  pathname === m.path
                    ? "bg-viridian-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
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
