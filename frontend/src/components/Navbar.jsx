import useAuth from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex justify-between items-center bg-viridian-600 text-white px-6 py-3 shadow">
      <h1 className="text-lg font-semibold">Payroll Management System</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm">👋 {user?.name || "Guest"}</span>
        <button
          onClick={logout}
          className="bg-white text-viridian-600 px-3 py-1 rounded-lg hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
