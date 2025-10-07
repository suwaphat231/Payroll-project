import { useState } from "react";
import { User, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"; // npm i lucide-react

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Mock login (UI-only)
    await new Promise((r) => setTimeout(r, 700));

    if (username.trim() === "admin" && password === "1234") {
      // save mock user to localStorage for RoleGuard/Sidebar
      localStorage.setItem(
        "user",
        JSON.stringify({ name: "Administrator", role: "admin" })
      );
      // simple redirect
      window.location.assign("/dashboard");
    } else if (username && password) {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } else {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
              <ShieldCheck className="text-indigo-600" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ Payroll</h1>
            <p className="text-gray-500 mt-1 text-sm">
              ทดลองใช้: <span className="font-medium">admin / 1234</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                autoComplete="username"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                placeholder="ชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPwd ? "text" : "password"}
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPwd ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 active:scale-[0.99] transition disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                จดจำฉัน
              </label>
              <a href="#" className="text-indigo-600 hover:underline">ลืมรหัสผ่าน?</a>
            </div>
          </form>
        </div>

        {/* Footer note */}
        
      </div>
    </div>
  );
}
