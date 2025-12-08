const AdminCommissions = () => {
  // In a real app, useGetAdminCommissionsQuery()
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Commission Runs</h1>
        <button className="bg-teal-600 text-white px-4 py-2 rounded font-medium hover:bg-teal-500 transition">
          Export CSV
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-slate-300">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Run Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Users Paid</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {/* Mock Data for Visualization */}
            <tr className="hover:bg-slate-750">
              <td className="px-6 py-4">{new Date().toLocaleDateString()}</td>
              <td className="px-6 py-4">Binary Cycle</td>
              <td className="px-6 py-4">124</td>
              <td className="px-6 py-4 text-green-400">$12,400.00</td>
              <td className="px-6 py-4"><span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold">Success</span></td>
            </tr>
            <tr className="hover:bg-slate-750">
              <td className="px-6 py-4">{new Date(Date.now() - 86400000).toLocaleDateString()}</td>
              <td className="px-6 py-4">Daily ROI</td>
              <td className="px-6 py-4">850</td>
              <td className="px-6 py-4 text-green-400">$4,250.00</td>
              <td className="px-6 py-4"><span className="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold">Success</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCommissions;