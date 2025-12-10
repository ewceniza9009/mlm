import { useState } from 'react';
import StatsCard from '../components/StatsCard';
import { DollarSign, Users, PlayCircle, Activity, AlertCircle, CheckCircle, Info, ArrowUpDown } from 'lucide-react';
import { useRunCommissionsMutation, useGetSystemLogsQuery } from '../store/api';

const AdminDashboard = () => {
  const [runCommissions, { isLoading: processing }] = useRunCommissionsMutation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('timestamp');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 10;

  // Debounce search could be added here, but for now direct state is fine or use a debounced value
  const { data: logsData, isLoading: loadingLogs, error: logsError } = useGetSystemLogsQuery({
    page,
    limit,
    search,
    sortBy,
    order
  }, { pollingInterval: 5000 });

  const logs = logsData?.data || [];
  const totalPages = logsData?.totalPages || 1;

  const [lastRun, setLastRun] = useState<string | null>(null);

  const handleRunCommissions = async () => {
    try {
      const res = await runCommissions({}).unwrap();
      setLastRun(`Completed at ${new Date().toLocaleTimeString()} - ${res.usersProcessed} users processed.`);
    } catch (err: any) {
      console.error(err);
      setLastRun(`Failed: ${err.data?.message || 'Unknown error'}`);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({ format: 'csv', search, sortBy, order });
    window.location.href = `http://localhost:5000/api/v1/admin/logs?${params.toString()}`;
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
    return order === 'asc' ? <ArrowUpDown size={14} className="text-teal-600 rotate-180 transition-transform" /> : <ArrowUpDown size={14} className="text-teal-600 transition-transform" />;
  };

  const getHeaderClass = (field: string) => `px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors select-none ${sortBy === field ? 'text-teal-600 dark:text-teal-400 font-bold bg-gray-50 dark:bg-slate-700/30' : ''}`;

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'ERROR': return <AlertCircle size={18} className="text-red-500" />;
      case 'SUCCESS': return <CheckCircle size={18} className="text-green-500" />;
      case 'WARNING': return <AlertCircle size={18} className="text-yellow-500" />;
      default: return <Info size={18} className="text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Admin Control Center</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total System Payout"
          value="$124,500"
          icon={DollarSign}
          trend="All Time"
          trendUp={true}
        />
        <StatsCard
          title="Total Users"
          value="1,240"
          icon={Users}
          trend="+45 today"
          trendUp={true}
        />
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Commission Engine</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">Binary Pairing</h3>
          </div>

          <button
            onClick={handleRunCommissions}
            disabled={processing}
            className={`mt-4 w-full flex items-center justify-center space-x-2 p-3 rounded font-bold transition-colors ${processing ? 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500 text-white'
              }`}
          >
            {processing ? (
              <span>Processing...</span>
            ) : (
              <>
                <PlayCircle size={20} />
                <span>Run Payout Cycle</span>
              </>
            )}
          </button>
          {lastRun && <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 text-center">{lastRun}</p>}
        </div>
      </div>

      {/* System Activities Log Visualization */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={24} className="text-teal-600 dark:text-teal-400" />
            Recent System Activities
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search logs..."
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-teal-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={handleExportCSV} className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto p-0 min-h-[300px]">
          {logsError ? (
            <div className="p-6 text-center">
              <p className="text-red-500 dark:text-red-400 mb-2">Failed to load logs.</p>
              <p className="text-xs text-gray-500 dark:text-slate-500">
                Make sure the backend is running and you have restarted it after adding the log routes.
                <br />
                {(logsError as any).status ? `Status: ${(logsError as any).status}` : ''}
              </p>
            </div>
          ) : loadingLogs ? (
            <div className="p-6 text-gray-400 dark:text-slate-400 text-center">Loading logs...</div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-6 text-gray-500 dark:text-slate-500 text-center">No recent activity found. Click "Run Payout Cycle" to generate logs.</div>
          ) : (
            <table className="w-full text-left text-gray-700 dark:text-slate-300">
              <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold backdrop-blur-sm">
                <tr>
                  <th className={getHeaderClass('type')} onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">Type {renderSortIcon('type')}</div>
                  </th>
                  <th className={getHeaderClass('action')} onClick={() => handleSort('action')}>
                    <div className="flex items-center gap-1">Action {renderSortIcon('action')}</div>
                  </th>
                  <th className={getHeaderClass('details')} onClick={() => handleSort('details')}>
                    <div className="flex items-center gap-1">Details {renderSortIcon('details')}</div>
                  </th>
                  <th className={`text-right ${getHeaderClass('timestamp')}`} onClick={() => handleSort('timestamp')}>
                    <div className="flex items-center justify-end gap-1">Time {renderSortIcon('timestamp')}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700/50">
                {logs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      {getLogIcon(log.type)}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-medium text-gray-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-gray-500 dark:text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;