import { useState } from "react";
import { User, Lock } from "lucide-react"; // ใช้ icon จาก lucide-react

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "1234") {
      alert("Login สำเร็จ 🎉");
    } else {
      alert("Username หรือ Password ไม่ถูกต้อง ❌");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400">
      <div className="w-96 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Welcome Back
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="password"
              className="w-full pl-10 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-xl font-medium hover:scale-105 transition-transform"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600 text-sm">
          ยังไม่มีบัญชี?{" "}
          <a href="#" className="text-purple-600 hover:underline">
            สมัครสมาชิก
          </a>
        </p>
      </div>
    </div>
  );
}