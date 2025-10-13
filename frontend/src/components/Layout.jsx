// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="grid grid-cols-[240px_1fr] min-h-screen bg-gray-900">
      <Sidebar />
      <div className="flex flex-col">
        <Navbar />
        <main className="p-4 bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
