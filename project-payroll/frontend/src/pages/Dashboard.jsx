import EmployeeList from "../components/EmployeeList";

export default function Dashboard() {
  return (
    <div style={{padding: 24}}>
      <h1>Payroll Dashboard</h1>
      <p>ตัวอย่างการโหลดรายชื่อพนักงานจาก backend</p>
      <EmployeeList />
    </div>
  );
}
