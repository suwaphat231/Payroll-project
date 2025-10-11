import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"; // npm i lucide-react
import useAuth from "../hooks/useAuth";
import { apiPost } from "../services/api";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASS = "Admin@123";
const REDIRECT_PATH = "/dashboard";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const readExistingAuth = () => {
    try {
      const raw = localStorage.getItem("payroll_auth");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.token) {
        navigate(REDIRECT_PATH, { replace: true });
      }
      return parsed;
    } catch {
      return null;
    }
  };

  // ถ้าเคยล็อกอินไว้แล้วให้ redirect
  useEffect(() => {
    login(readExistingAuth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Handle Submit =====
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      const u = username.trim();
      const p = password;

      if (!u || !p) {
        setError("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }

      setLoading(true);
      try {
        const data = await apiPost(
          "/auth/login",
          { email: u, password: p },
          { auth: false },
        );
        if (data?.token) {
          login({
            token: data.token,
            user: data.user || { name: "Administrator", role: "admin" },
          });
          const redirectTo = location.state?.from?.pathname || REDIRECT_PATH;
          navigate(redirectTo, { replace: true });
        } else {
          setError("เข้าสู่ระบบไม่สำเร็จ");
        }
      } catch (err) {
        console.error(err);
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      } finally {
        setLoading(false);
      }
    },
    [username, password, login, navigate, location.state],
  );

  const toggleShowPwd = useCallback(() => setShowPwd((v) => !v), []);

  // ===== Render =====
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden transition-transform hover:scale-[1.01] duration-200">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
              <ShieldCheck
                className="text-indigo-600"
                size={28}
                aria-hidden="true"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              เข้าสู่ระบบ Payroll
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              ทดลองใช้:{" "}
              <span className="font-medium">
                {ADMIN_EMAIL} / {ADMIN_PASS}
              </span>
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="px-8 pb-8 space-y-4"
            noValidate
          >
            {/* Username */}
            <div className="relative">
              <label htmlFor="username" className="sr-only">
                ชื่อผู้ใช้
              </label>
              <User
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
                aria-hidden="true"
              />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                inputMode="text"
                placeholder="อีเมล"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                รหัสผ่าน
              </label>
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
                aria-hidden="true"
              />
              <input
                id="password"
                name="password"
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                placeholder="รหัสผ่าน"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={toggleShowPwd}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPwd ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                disabled={loading}
              >
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 active:scale-[0.99] transition disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            {/* Options */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  disabled={loading}
                />
                จดจำฉัน
              </label>
              <a href="#" className="text-indigo-600 hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
