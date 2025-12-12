import React, { useState } from 'react';
import { useGetAdminCommissionsQuery } from '../store/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useUI } from '../components/UIContext';
import { Download, AlertCircle, ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';

const AdminCommissions = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const { showAlert } = useUI();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const limit = 10;

    const { data: commissionsData, isLoading, error } = useGetAdminCommissionsQuery({
        page, limit, search, sortBy, order
    }, { pollingInterval: 10000 });

    const commissions = commissionsData?.data || [];
    const totalPages = commissionsData?.totalPages || 1;

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setOrder('desc'); // Default to newest/highest first
        }
    };

    const handleExportCSV = async () => {
        const params = new URLSearchParams({
            format: 'csv',
            search,
            sortBy,
            order
        });
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/';
        const url = `${baseUrl}admin/commissions?${params.toString()}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Export failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `commissions_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            showAlert('Export downloaded successfully', 'success');
        } catch (err: any) {
            console.error('Export Error:', err);
            showAlert(err.message || 'Failed to export CSV', 'error');
        }
    };

    if (isLoading) return <div className="text-gray-500 dark:text-gray-300 p-6">Loading commission history...</div>;
    if (error) return (
        <div className="text-red-500 p-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Error loading commissions. Ensure backend is running.</span>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Commission Runs</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search user, type..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-teal-600 dark:text-teal-400 border border-gray-200 dark:border-slate-600 px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm"
                    >
                        <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none flex flex-col min-h-[500px]">
                <div className="overflow-x-auto flex-1">
                    {/* Desktop Table View */}
                    <table className="w-full text-left text-gray-700 dark:text-slate-300 hidden md:table">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3 cursor-pointer hover:text-teal-500" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-1">Date <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:text-teal-500" onClick={() => handleSort('username')}>
                                    <div className="flex items-center gap-1">User <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:text-teal-500" onClick={() => handleSort('type')}>
                                    <div className="flex items-center gap-1">Type <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-3 cursor-pointer hover:text-teal-500" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center gap-1">Amount <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-3">Details</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                            {commissions && commissions.length > 0 ? (
                                commissions.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            {new Date(item.date).toLocaleDateString()} <span className="text-gray-400 dark:text-slate-500 text-xs">{new Date(item.date).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{item.username}</td>
                                        <td className="px-6 py-3">
                                            <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-100 dark:border-blue-500/20">
                                                {item.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-green-600 dark:text-green-400 font-mono font-bold text-sm">
                                            ${item.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate" title={item.details}>
                                            {item.details}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-green-600 bg-green-50 dark:text-green-500 dark:bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-green-100 dark:border-green-500/20">
                                                Paid
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                                        No commission history found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700/50">
                        {commissions && commissions.length > 0 ? (
                            commissions.map((item: any, idx: number) => (
                                <div key={idx} className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xs text-gray-400 dark:text-slate-500">
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                {item.username}
                                            </div>
                                        </div>
                                        <div className="text-green-600 dark:text-green-400 font-mono font-bold text-sm">
                                            ${item.amount.toFixed(2)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-100 dark:border-blue-500/20">
                                            {item.type.replace('_', ' ')}
                                        </span>
                                        <span className="text-green-600 bg-green-50 dark:text-green-500 dark:bg-green-500/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-green-100 dark:border-green-500/20">
                                            Paid
                                        </span>
                                    </div>

                                    {item.details && (
                                        <div className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/30 p-2 rounded border border-gray-100 dark:border-slate-700/50">
                                            {item.details}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-500 text-sm">
                                No commission history found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
                    >
                        <ChevronLeft size={14} /> Prev
                    </button>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                        Page {page}/{totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
                    >
                        Next <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminCommissions;