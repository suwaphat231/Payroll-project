export default function ReportTable({ rows = [] }) {
  const total = rows.reduce(
    (acc, r) => ({
      base: acc.base + r.base_salary,
      tax: acc.tax + r.tax_withheld,
      sso: acc.sso + r.sso,
      pvd: acc.pvd + r.pvd,
      net: acc.net + r.net_pay,
    }),
    { base: 0, tax: 0, sso: 0, pvd: 0, net: 0 }
  );

  return (
    <table className="w-full border-collapse mt-4">
      <thead className="bg-gray-100">
        <tr>
          <th>Employee</th>
          <th>Base</th>
          <th>Tax</th>
          <th>SSO</th>
          <th>PVD</th>
          <th>Net</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t">
            <td>{r.employee_name}</td>
            <td>{r.base_salary}</td>
            <td>{r.tax_withheld}</td>
            <td>{r.sso}</td>
            <td>{r.pvd}</td>
            <td>{r.net_pay}</td>
          </tr>
        ))}
        <tr className="bg-gray-50 font-semibold border-t">
          <td>Total</td>
          <td>{total.base.toFixed(2)}</td>
          <td>{total.tax.toFixed(2)}</td>
          <td>{total.sso.toFixed(2)}</td>
          <td>{total.pvd.toFixed(2)}</td>
          <td>{total.net.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  );
}
