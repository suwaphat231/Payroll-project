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
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #eee" }}>
      <strong>Payroll UI</strong>
      <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span>{user?.name ?? "Guest"} ({user?.role ?? "-"})</span>
        <Link to="/dashboard">Dashboard</Link>
        <button onClick={handleLogout}>Logout</button>
      </nav>
    </header>
  );
}
