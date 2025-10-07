// src/components/RoleGuard.jsx
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RoleGuard({ allowed = [], children }) {
  const { role } = useAuth();
  const location = useLocation();

  if (!role) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // บังคับเทียบ role เป็นตัวพิมพ์เล็ก
  const ok = allowed.length === 0 || allowed.map(r => r.toLowerCase()).includes(role);
  if (!ok) return <div className="p-6 text-red-600">403: Forbidden</div>;
  return children;
}
