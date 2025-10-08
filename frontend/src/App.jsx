// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";


// 🧩 Layout หลัก + ระบบตรวจสิทธิ์
import Layout from "./components/Layout";
import RoleGuard from "./components/RoleGuard";


// 📄 เพจทั้งหมด (แค่มีไฟล์เปล่าก็ได้)
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import PayrollPage from "./pages/PayrollPage";
import PayslipPage from "./pages/PayslipPage";
import LeavePage from "./pages/LeavePage";
import ReportPage from "./pages/ReportPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🏠 หน้าแรก Redirect ไป login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 🔑 หน้า Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* 🔒 ส่วนของระบบหลังล็อกอิน */}
        <Route
          element={
            <RoleGuard allowed={["admin", "hr", "accounting", "employee"]}>
              <Layout />
            </RoleGuard>
          }
        >
          {/* เส้นทางของแต่ละหน้าในระบบ */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/payslips" element={<PayslipPage />} />
          <Route path="/leave" element={<LeavePage />} />

          {/* ✅ หน้าที่จำกัดเฉพาะ role */}
          <Route
            path="/reports"
            element={
              <RoleGuard allowed={["admin", "hr", "accounting"]}>
                <ReportPage />
              </RoleGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleGuard allowed={["admin"]}>
                <SettingsPage />
              </RoleGuard>
            }
          />
        </Route>

        {/* ⚠️ 404 Page */}
        <Route path="*" element={<div style={{ padding: 24 }}>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
