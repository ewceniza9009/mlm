import React, { useState } from 'react';
import { useGetPendingWithdrawalsQuery, useProcessWithdrawalMutation } from '../store/api';
import { DollarSign, CheckCircle, XCircle, Search, CreditCard, Calendar, User } from 'lucide-react';
import { useUI } from '../components/UIContext';

const AdminPayoutsPage = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const limit = 20;

    const { data, isLoading } = useGetPendingWithdrawalsQuery({ page, limit, search });
    const [processWithdrawal, { isLoading: isProcessing }] = useProcessWithdrawalMutation();
    const { showAlert } = useUI();

    const withdrawals = data?.data || [];
    const totalPages = data?.totalPages || 1;
    const totalRequests = data?.total || 0;

    // Calculate sum of visible page (optional util)
    const visibleTotal = withdrawals.reduce((sum: number, w: any) => sum + Math.abs(w.amount), 0);

    const handleProcess = async (transactionId: string, userId: string, action: 'APPROVE' | 'REJECT') => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

        try {
            await processWithdrawal({ userId, transactionId, action }).unwrap();
            showAlert(`Withdrawal ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`, 'success');
        } catch (err: any) {
            showAlert(err.data?.message || 'Processing Failed', 'error');
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 animation-fade-in pb-10">

            {/* 1. HERO SECTION */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-700/50 shadow-2xl">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

                <div className="relative z-10 p-8 md:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-4 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
                            <CreditCard size={12} />
                            Finance Control Center
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            Payout <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">Management</span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Review and process pending withdrawal requests. Approved transactions will be simulated as paid via the configured gateway.
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl min-w-[160px] flex flex-col justify-between hover:bg-white/10 transition-colors">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Count</p>
                            <p className="text-3xl font-bold">{totalRequests}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl min-w-[160px] flex flex-col justify-between hover:bg-white/10 transition-colors">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Page Total</p>
                            <p className="text-3xl font-bold text-teal-400">${visibleTotal.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TABLE SECTION */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 overflow-hidden">

                {/* Toolbar */}
                <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-lg font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        Pending Requests
                    </h2>
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by username or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm transition-all"
                        />
                    </div>
                </div>

                {/* The Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">User Identity</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Request Date</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction Info</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {withdrawals.length > 0 ? (
                                withdrawals.map((req: any) => (
                                    <tr key={req._id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-slate-700">
                                                    {req.username?.substring(0, 2).toUpperCase() || <User size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                        {req.username}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{req.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block font-mono font-bold text-lg text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                                                ${Math.abs(req.amount).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(req.date).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs text-slate-400 pl-5">{new Date(req.date).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[200px] truncate text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                                                {req.transaction.description || 'Standard Withdrawal'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleProcess(req._id, req.user._id, 'REJECT')}
                                                    disabled={isProcessing}
                                                    className="p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all disabled:opacity-50"
                                                    title="Reject Request"
                                                >
                                                    <XCircle size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleProcess(req._id, req.user._id, 'APPROVE')}
                                                    disabled={isProcessing}
                                                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                                                >
                                                    <CheckCircle size={16} /> Pay Now
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full"></div>
                                                <div className="relative w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center">
                                                    <CheckCircle className="text-teal-500" size={40} />
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All Caught Up!</h3>
                                            <p className="text-slate-500 max-w-sm mx-auto">
                                                There are no pending withdrawal requests to process at this time. Good job!
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Foot */}
                {withdrawals.length > 0 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-4 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-50 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500 font-medium">Page {page} of {totalPages}</span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-50 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPayoutsPage;
