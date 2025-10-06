export default function PayslipCard({ payslip }) {
  return (
    <div className="border rounded-lg p-6 shadow-sm bg-white w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Payslip</h2>
      <div className="space-y-2">
        <p><b>Employee:</b> {payslip.employee_name}</p>
        <p><b>Base Salary:</b> {payslip.base_salary} THB</p>
        <p><b>Tax:</b> {payslip.tax_withheld} THB</p>
        <p><b>SSO:</b> {payslip.sso} THB</p>
        <p><b>PVD:</b> {payslip.pvd} THB</p>
        <hr />
        <p className="text-lg font-bold text-viridian-600">Net Pay: {payslip.net_pay} THB</p>
      </div>
      <button className="bg-viridian-600 text-white px-4 py-2 mt-4 rounded w-full">
        Download PDF
      </button>
    </div>
  );
}