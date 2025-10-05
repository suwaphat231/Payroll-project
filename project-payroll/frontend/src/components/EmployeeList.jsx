import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

export default function EmployeeList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/api/v1/employees"); // proxy ไป :8080
        // รองรับทั้งแบบ {employees: []} หรือ []
        const list = Array.isArray(data) ? data : (data.employees || []);
        setItems(list);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>กำลังโหลด...</p>;
  if (err) return <p style={{color:'crimson'}}>เกิดข้อผิดพลาด: {err}</p>;

  return (
    <ul>
      {items.map((it, idx) => (
        <li key={it.id ?? idx}>
          {it.name ?? String(it)}
        </li>
      ))}
    </ul>
  );
}
