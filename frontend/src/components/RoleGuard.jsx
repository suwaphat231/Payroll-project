// src/components/RoleGuard.jsx
import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RoleGuard({ allow = [], children }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  return allow.includes(role) ? children : <div className="p-6 text-red-600">403: Forbidden</div>;
}
