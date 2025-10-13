import { useEffect, useMemo, useState } from "react";

/**
 * SettingsPage
 * - Language: th / en (persist to localStorage, notify parent via onChangeLanguage)
 * - Theme: light / dark / system (persist, applies 'dark' class on <html>)
 * - Account: show user info + Logout button (calls onLogout)
 * - Notifications: email / in-app toggles (demo)
 * - Security: 2FA toggle (demo), session list (demo)
 * - Organization: timezone, date format, currency (demo)
 * - Utilities: clear cached settings
 * - Audit log: recent actions (demo, replace with API)
 */
export default function SettingsPage({
  user = { name: "Lil", email: "lil@company.com", role: "Admin" },
  onLogout,
  onChangeLanguage,
}) {
  // --------------------- state
  const [language, setLanguage] = useState(() => localStorage.getItem("app.lang") || "th");
  const [theme, setTheme] = useState(() => localStorage.getItem("app.theme") || "system");
  const [emailNotif, setEmailNotif] = useState(true);
  const [appNotif, setAppNotif] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [timezone, setTimezone] = useState(() => localStorage.getItem("org.tz") || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Bangkok");
  const [dateFmt, setDateFmt] = useState(() => localStorage.getItem("org.datefmt") || "DD/MM/YYYY");
  const [currency, setCurrency] = useState(() => localStorage.getItem("org.currency") || "THB");

  // demo audit log
  const [audit] = useState([
    { ts: Date.now() - 60*60*1000, action: "Changed theme to Dark", actor: user.email },
    { ts: Date.now() - 2*60*60*1000, action: "Updated payroll rate (SSO cap)", actor: user.email },
    { ts: Date.now() - 24*60*60*1000, action: "Added employee EMP-0102", actor: user.email },
  ]);

  // --------------------- effects
  useEffect(() => {
    localStorage.setItem("app.lang", language);
    onChangeLanguage?.(language);
  }, [language, onChangeLanguage]);

  useEffect(() => {
    localStorage.setItem("app.theme", theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("org.tz", timezone);
  }, [timezone]);
  useEffect(() => {
    localStorage.setItem("org.datefmt", dateFmt);
  }, [dateFmt]);
  useEffect(() => {
    localStorage.setItem("org.currency", currency);
  }, [currency]);

  function applyTheme(mode) {
    const root = document.documentElement;
    const isDark = mode === "dark" || (mode === "system" && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle("dark", isDark);
  }

  function clearCachedSettings() {
    ["app.lang","app.theme","org.tz","org.datefmt","org.currency"].forEach(k => localStorage.removeItem(k));
    alert("ล้างค่าที่บันทึกไว้แล้ว (lang/theme/timezone/datefmt/currency)");
  }

  // utilities
  const tzList = useMemo(() => [
    "Asia/Bangkok","Asia/Singapore","Asia/Tokyo","Asia/Ho_Chi_Minh","Europe/London","America/New_York"
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 dark:from-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">ตั้งค่า (Settings)</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">ปรับภาษา ธีม การแจ้งเตือน และค่าระบบ</p>
          </div>
          <div className="rounded-xl bg-white/70 px-3 py-2 text-xs text-slate-600 shadow ring-1 ring-black/5 dark:bg-slate-800/60 dark:text-slate-200">บทบาท: {user.role}</div>
        </header>

        {/* Account */}
        <Section title="บัญชีผู้ใช้ (Account)">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ชื่อผู้ใช้">{user.name}</Field>
            <Field label="อีเมล">{user.email}</Field>
            <Field label="ภาษา (Language)">
              <select value={language} onChange={(e)=>setLanguage(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                <option value="th">ไทย (TH)</option>
                <option value="en">English (EN)</option>
              </select>
            </Field>
            <Field label="ธีม (Theme)">
              <div className="flex gap-2">
                {[
                  { value:"light", label:"สว่าง" },
                  { value:"dark", label:"มืด" },
                  { value:"system", label:"ตามระบบ" },
                ].map(opt => (
                  <label key={opt.value} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm dark:text-slate-100 ${theme===opt.value? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                    <input type="radio" name="theme" value={opt.value} checked={theme===opt.value} onChange={()=>setTheme(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </Field>
          </div>
          <div className="mt-3 flex items-center justify-end">
            <button onClick={onLogout} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-700">ออกจากระบบ (Log out)</button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="การแจ้งเตือน (Notifications)">
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle checked={emailNotif} onChange={setEmailNotif} label="ส่งอีเมลแจ้งเตือนเหตุการณ์สำคัญ (เช่น อนุมัติลา/รอบเงินเดือน)" />
            <Toggle checked={appNotif} onChange={setAppNotif} label="แจ้งเตือนภายในแอป (In‑app notifications)" />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">* เดโม่: บันทึกค่านี้ในฝั่ง client; ระบบจริงควร sync กับโปรไฟล์ผู้ใช้ในฐานข้อมูล</p>
        </Section>

        {/* Security */}
        <Section title="ความปลอดภัย (Security)">
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle checked={twoFA} onChange={setTwoFA} label="เปิดใช้ Two‑Factor Authentication (2FA)" />
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
              <div className="text-slate-600 dark:text-slate-300">เซสชันล่าสุด</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <li>Chrome • Bangkok • {new Date().toLocaleString("th-TH")}</li>
                <li>iOS • Last week • {new Date(Date.now()-7*24*3600*1000).toLocaleDateString("th-TH")}</li>
              </ul>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">* เปิด 2FA ควรพาไป flow เปิดใช้ (TOTP/Email/SMS) ในระบบจริง</p>
        </Section>

        {/* Organization settings (useful for HR/Payroll) */}
        <Section title="การตั้งค่าหน่วยงาน (Organization)">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Time Zone">
              <select value={timezone} onChange={(e)=>setTimezone(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                {tzList.map(tz => <option key={tz}>{tz}</option>)}
              </select>
            </Field>
            <Field label="รูปแบบวันที่ (Date Format)">
              <select value={dateFmt} onChange={(e)=>setDateFmt(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                {['DD/MM/YYYY','YYYY-MM-DD','MM/DD/YYYY'].map(f => <option key={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="สกุลเงิน (Currency)">
              <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                {['THB','USD','EUR','JPY','SGD','VND'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">* ใช้ในการแสดงผลทั่วระบบ (รายงาน/สลิป/วันเวลา)</p>
        </Section>

        {/* Utilities */}
        <Section title="เครื่องมือ (Utilities)">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={clearCachedSettings} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">ล้างค่าที่บันทึกในเครื่อง</button>
          </div>
        </Section>

        {/* Audit log */}
        <Section title="บันทึกการเปลี่ยนแปลง (Audit Log)">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr><Th>เวลา</Th><Th>กิจกรรม</Th><Th>ผู้ทำรายการ</Th></tr>
              </thead>
              <tbody>
                {audit.map((a,i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50">
                    <Td>{new Date(a.ts).toLocaleString("th-TH")}</Td>
                    <Td>{a.action}</Td>
                    <Td>{a.actor}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">* เดโม่: ในระบบจริงดึงจาก /api/audit?scope=settings</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
      <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-200">{title}</div>
      {children}
    </section>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-slate-500 dark:text-slate-300">{label}</div>
      {children}
    </label>
  );
}
function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} className="h-4 w-4" />
      {label}
    </label>
  );
}
function Th({ children }) { return <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">{children}</th>; }
function Td({ children }) { return <td className="px-3 py-2 align-middle">{children}</td>; }

/*
การใช้งาน:
- วางไฟล์: src/pages/SettingsPage.jsx
- เพิ่ม route:

import { BrowserRouter, Routes, Route } from "react-router-dom";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const handleLogout = () => {
    // TODO: ลบ token / เรียก POST /auth/logout แล้ว redirect ไปหน้า login
    alert("Logged out (demo)");
  };
  const handleLang = (lang) => {
    // TODO: เปลี่ยนภาษาในระบบ i18n (เช่น i18next.changeLanguage(lang))
    console.log("change language to", lang);
  };
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/settings" element={<SettingsPage onLogout={handleLogout} onChangeLanguage={handleLang} />} />
      </Routes>
    </BrowserRouter>
  );
}

- หมายเหตุ Tailwind (โหมดมืด):
  ต้องตั้งค่า tailwind.config.js -> darkMode: 'class' และใน index.css ใช้ .dark สำหรับสไตล์โหมดมืด
*/