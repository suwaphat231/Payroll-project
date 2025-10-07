// src/hooks/useAuth.js
import { useEffect, useState } from "react";

export default function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null; // { name, role }
    } catch {
      return null;
    }
  });

  const login = (name, role = "employee") => {
    const u = { name: name || "Guest", role: (role || "employee").toLowerCase() };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    const onStorage = () => {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { user, role: user?.role || null, name: user?.name || null, login, logout };
}
