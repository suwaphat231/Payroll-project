import { Link, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Sidebar() {
  const { role } = useAuth();
  const { pathname } = useLocation();

  const menu = [
    { path: "/", label: "Dashboard", allow: ["HR", "Accounting", "Employee"] },
    { path: "/employees", label: "Employees", allow: ["HR"] },
    { path: "/payroll", label: "Payroll", allow: ["HR", "Accounting"] },
    { path: "/payslips", label: "Payslips", allow: ["Employee", "HR"] },
    { path: "/leaves", label: "Leave", allow: ["Employee", "HR"] },
    { path: "/reports", label: "Reports", allow: ["Accounting", "HR"] },
  ];

  return (
    <aside className="w-64 bg-gray-50 h-screen shadow-md p-4">
      <h2 className="text-lg font-semibold text-viridian-700 mb-6">Menu</h2>
      <ul className="space-y-2">
        {menu
          .filter((m) => m.allow.includes(role))
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