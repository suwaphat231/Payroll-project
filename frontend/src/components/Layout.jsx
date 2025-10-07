// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <Sidebar />
      <div>
        <Navbar />
        <main style={{ padding: 16 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
