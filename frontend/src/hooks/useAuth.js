import { useEffect, useState } from "react";
import { AUTH_STORAGE_KEY } from "../constants";

function readAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function useAuth() {
  const [auth, setAuth] = useState(() => readAuth());

  const login = (authPayload) => {
    const safe = authPayload || null;
    if (safe) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safe));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setAuth(safe);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  };

  useEffect(() => {
    const onStorage = () => {
      setAuth(readAuth());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return {
    user: auth?.user || null,
    name: auth?.user?.name || null,
    role: auth?.user?.role ? auth.user.role.toLowerCase() : null,
    token: auth?.token || null,
    login,
    logout,
  };
}
