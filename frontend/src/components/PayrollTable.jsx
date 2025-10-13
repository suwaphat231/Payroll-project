export default function PayrollTable({ rows = [], onViewPayslip }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th>Employee</th>
          <th>Base</th>
          <th>Tax</th>
          <th>SSO</th>
          <th>PVD</th>
          <th>Net</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t hover:bg-gray-50">
            <td>{r.employee_name}</td>
            <td>{r.base_salary}</td>
            <td>{r.tax_withheld}</td>
            <td>{r.sso}</td>
            <td>{r.pvd}</td>
            <td><b>{r.net_pay}</b></td>
            <td>
              <button
                onClick={() => onViewPayslip(r.id)}
                className="text-viridian-600 hover:underline"
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}