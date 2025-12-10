import React, { useState } from 'react';
import { useGetAdminCommissionsQuery } from '../store/api';
import { Download, AlertCircle, ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';

const AdminCommissions = () => {
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

    const handleExportCSV = () => {
        const params = new URLSearchParams({
            format: 'csv',
            search,
            sortBy,
            order
        });
        window.location.href = `http://localhost:5000/api/v1/admin/commissions?${params.toString()}`;
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Commission Runs</h1>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search user, type..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExportCSV}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-500 transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
                    >
                        <Download size={18} /> <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none flex flex-col min-h-[500px]">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-gray-700 dark:text-slate-300">
                        <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:text-teal-500" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-1">Date <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-teal-500" onClick={() => handleSort('username')}>
                                    <div className="flex items-center gap-1">User <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-teal-500" onClick={() => handleSort('type')}>
                                    <div className="flex items-center gap-1">Type <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-teal-500" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center gap-1">Amount <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {commissions && commissions.length > 0 ? (
                                commissions.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {new Date(item.date).toLocaleDateString()} <span className="text-gray-400 dark:text-slate-500 text-xs">{new Date(item.date).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.username}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-100 dark:border-blue-500/20">
                                                {item.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-green-600 dark:text-green-400 font-mono font-bold">
                                            ${item.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400 max-w-xs truncate" title={item.details}>
                                            {item.details}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-green-600 bg-green-50 dark:text-green-500 dark:bg-green-500/10 px-2 py-1 rounded text-xs font-bold border border-green-100 dark:border-green-500/20">
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
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page <span className="font-bold text-gray-900 dark:text-white">{page}</span> of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminCommissions;