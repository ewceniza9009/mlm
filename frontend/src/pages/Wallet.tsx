import React, { useState } from 'react';
import { useGetWalletQuery, useRequestWithdrawalMutation } from '../store/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, Info, CreditCard } from 'lucide-react';

import { useUI } from '../components/UIContext';

const WalletPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 10;

  const { data: wallet, isLoading } = useGetWalletQuery({ page, limit, search, sortBy, order });
  const [requestWithdrawal, { isLoading: isWithdrawing }] = useRequestWithdrawalMutation();
  const [amount, setAmount] = useState('');
  const { showAlert } = useUI();

  const transactions = wallet?.transactions?.data || [];
  const totalPages = wallet?.transactions?.totalPages || 1;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    try {
      await requestWithdrawal({ amount: Number(amount), method: 'Bank Transfer', details: 'Default Bank' }).unwrap();
      setAmount('');
      showAlert('Withdrawal requested successfully!', 'success');
    } catch (err: any) {
      showAlert(err.data?.message || 'Withdrawal Failed', 'error');
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({ format: 'csv', search, sortBy, order });
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/';
    window.location.href = `${baseUrl}wallet?${params.toString()}`;
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
    return order === 'asc' ? <ArrowUpDown size={14} className="text-teal-600 rotate-180 transition-transform" /> : <ArrowUpDown size={14} className="text-teal-600 transition-transform" />;
  };

  const getHeaderClass = (field: string) => `px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors select-none ${sortBy === field ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}`;

  if (isLoading) return <div className="text-gray-500 dark:text-gray-400 p-6">Loading Wallet...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
        <WalletIcon size={28} className="text-teal-600 dark:text-teal-400" /> My Wallet
      </h1>

      {/* COMPACT UNIFIED HEADER CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 md:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {/* 1. Balance Section */}
        <div className="flex items-center gap-5 w-full lg:w-auto">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
            <CreditCard className="text-white" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Available Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">${wallet?.balance?.toFixed(2) || '0.00'}</span>
              <span className="text-xs text-green-500 font-medium bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full">Ready</span>
            </div>
          </div>
        </div>

        {/* Divider (Desktop Only) */}
        <div className="hidden lg:block h-12 w-px bg-gray-200 dark:bg-slate-700"></div>

        {/* 2. Withdrawal Section */}
        <div className="flex-1 w-full lg:w-auto max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleWithdraw} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full pl-7 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  min="10"
                />
              </div>
              <button
                disabled={isWithdrawing}
                className="bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-lg font-bold disabled:opacity-50 transition-colors shadow-md shadow-teal-500/10 whitespace-nowrap"
              >
                {isWithdrawing ? '...' : 'Withdraw Funds'}
              </button>
            </form>
          </div>

          {/* Compact Info Section */}
          <div className="mt-3 flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800/30">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              <strong>Payment Schedule:</strong> Processed every <span className="underline">Friday</span>.
              Requests before Thu 11:59PM included. Min $10.00.
            </span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-lg transition border border-gray-200 dark:border-slate-600"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {/* Desktop Table */}
          <table className="w-full text-left text-gray-600 dark:text-slate-300 hidden md:table">
            <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold">
              <tr>
                <th className={getHeaderClass('type')} onClick={() => handleSort('type')}>
                  <div className="flex items-center gap-1">Type {renderSortIcon('type')}</div>
                </th>
                <th className={getHeaderClass('amount')} onClick={() => handleSort('amount')}>
                  <div className="flex items-center gap-1">Amount {renderSortIcon('amount')}</div>
                </th>
                <th className={getHeaderClass('description')} onClick={() => handleSort('description')}>
                  <div className="flex items-center gap-1">Description {renderSortIcon('description')}</div>
                </th>
                <th className={getHeaderClass('date')} onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">Date {renderSortIcon('date')}</div>
                </th>
                <th className={getHeaderClass('status')} onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">Status {renderSortIcon('status')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {transactions.length > 0 ? (
                transactions.map((tx: any) => {
                  const isCredit = ['DEPOSIT', 'COMMISSION', 'TRANSFER_IN', 'BONUS'].includes(tx.type);
                  const isDebit = ['WITHDRAWAL', 'PURCHASE', 'TRANSFER_OUT'].includes(tx.type);

                  return (
                    <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-3 flex items-center gap-2">
                        <span className={`p-1.5 rounded-full ${isCredit
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-600'
                          : 'bg-red-100 dark:bg-red-500/20 text-red-600'
                          }`}>
                          {isCredit && <ArrowDownLeft size={14} />}
                          {isDebit && <ArrowUpRight size={14} />}
                        </span>
                        <span className="capitalize font-medium text-sm">{tx.type.replace('_', ' ').toLowerCase()}</span>
                      </td>
                      <td className={`px-6 py-3 font-mono font-bold text-sm ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm max-w-xs truncate" title={tx.description}>{tx.description}</td>
                      <td className="px-6 py-3 text-sm text-gray-500 dark:text-slate-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${tx.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                          tx.status === 'PENDING' ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                          }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
            {transactions.length > 0 ? (
              transactions.map((tx: any) => {
                const isCredit = ['DEPOSIT', 'COMMISSION', 'TRANSFER_IN', 'BONUS'].includes(tx.type);
                const isDebit = ['WITHDRAWAL', 'PURCHASE', 'TRANSFER_OUT'].includes(tx.type);

                return (
                  <div key={tx._id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isCredit
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-600'
                          : 'bg-red-100 dark:bg-red-500/20 text-red-600'
                          }`}>
                          {isCredit && <ArrowDownLeft size={16} />}
                          {isDebit && <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white capitalize">
                            {tx.type.replace('_', ' ').toLowerCase()}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-slate-500">
                            {new Date(tx.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-sm ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isCredit ? '+' : '-'}{Math.abs(tx.amount).toFixed(2)}
                      </div>
                    </div>

                    <div className="pl-11">
                      <p className="text-xs text-gray-600 dark:text-slate-300 mb-2 line-clamp-2">{tx.description}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${tx.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                        tx.status === 'PENDING' ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                        }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-slate-500 text-sm">
                No transactions found.
              </div>
            )}
          </div>
        </div>

        {/* Compact Pagination */}
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

export default WalletPage;