import React, { useState } from 'react';
import StatsCard from '../components/StatsCard';
import { DollarSign, Users, PlayCircle, Activity, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useRunCommissionsMutation, useGetSystemLogsQuery } from '../store/api';

const AdminDashboard = () => {
  const [runCommissions, { isLoading: processing }] = useRunCommissionsMutation();
  
  const { data: logs, isLoading: loadingLogs, error: logsError } = useGetSystemLogsQuery(undefined, { pollingInterval: 5000 });
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
      <h1 className="text-3xl font-bold text-white mb-6">Admin Control Center</h1>
      
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
        <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 flex flex-col justify-between">
           <div>
             <p className="text-slate-400 text-sm font-medium">Commission Engine</p>
             <h3 className="text-xl font-bold text-white mt-1">Binary Pairing</h3>
           </div>
           
           <button 
             onClick={handleRunCommissions}
             disabled={processing}
             className={`mt-4 w-full flex items-center justify-center space-x-2 p-3 rounded font-bold transition-colors ${
               processing ? 'bg-slate-600 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500 text-white'
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
           {lastRun && <p className="text-xs text-slate-400 mt-2 text-center">{lastRun}</p>}
        </div>
      </div>

      {/* System Activities Log Visualization */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 flex flex-col h-[400px]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity size={24} className="text-teal-400" />
                Recent System Activities
            </h2>
            <div className="flex items-center gap-2">
                {loadingLogs && <span className="text-xs text-slate-400 animate-pulse">Syncing...</span>}
                <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">Live Updates</span>
            </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-0">
            {logsError ? (
                <div className="p-6 text-center">
                    <p className="text-red-400 mb-2">Failed to load logs.</p>
                    <p className="text-xs text-slate-500">
                        Make sure the backend is running and you have restarted it after adding the log routes.
                        <br/>
                        {(logsError as any).status ? `Status: ${(logsError as any).status}` : ''}
                    </p>
                </div>
            ) : loadingLogs ? (
                <div className="p-6 text-slate-400 text-center">Loading logs...</div>
            ) : !logs || logs.length === 0 ? (
                <div className="p-6 text-slate-500 text-center">No recent activity found. Click "Run Payout Cycle" to generate logs.</div>
            ) : (
                <table className="w-full text-left text-slate-300">
                    <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th className="px-6 py-3 w-10"></th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3 text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {logs.map((log: any) => (
                            <tr key={log._id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    {getLogIcon(log.type)}
                                </td>
                                <td className="px-6 py-4 font-mono text-sm font-medium text-white">
                                    {log.action}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-400">
                                    {log.details}
                                </td>
                                <td className="px-6 py-4 text-right text-xs text-slate-500 font-mono">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;