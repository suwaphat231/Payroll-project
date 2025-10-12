import { useState } from "react";

export default function LeaveForm({ onSubmit }) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const leaveDate = new Date(date);
    const today = new Date();
    const diffDays = (leaveDate - today) / (1000 * 3600 * 24);
    if (diffDays < 1) return alert("ต้องแจ้งล่วงหน้าอย่างน้อย 1 วัน!");
    onSubmit({ leave_date: date, note });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        วันที่ลา:
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border p-2 w-full" />
      </label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="เหตุผล" className="border p-2 w-full" />
      <button type="submit" className="bg-viridian-600 text-white px-4 py-2 rounded">ยื่นลา</button>
    </form>
  );
}