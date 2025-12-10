import React, { useState } from 'react';
import { useGetWalletQuery, useRequestWithdrawalMutation } from '../store/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const WalletPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 10;

  const { data: wallet, isLoading } = useGetWalletQuery({ page, limit, search, sortBy, order });
  const [requestWithdrawal, { isLoading: isWithdrawing }] = useRequestWithdrawalMutation();
  const [amount, setAmount] = useState('');

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
      alert('Withdrawal requested!');
    } catch (err: any) {
      alert(err.data?.message || 'Failed');
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({ format: 'csv', search, sortBy, order });
    window.location.href = `http://localhost:5000/api/v1/wallet?${params.toString()}`;
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
    return order === 'asc' ? <ArrowUpDown size={14} className="text-teal-600 rotate-180 transition-transform" /> : <ArrowUpDown size={14} className="text-teal-600 transition-transform" />;
  };

  const getHeaderClass = (field: string) => `px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors select-none ${sortBy === field ? 'text-teal-600 dark:text-teal-400 font-bold bg-gray-50 dark:bg-slate-700/30' : ''}`;

  if (isLoading) return <div className="text-gray-500 dark:text-gray-400 p-6">Loading Wallet...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
        <WalletIcon size={24} className="md:w-8 md:h-8 text-teal-600 dark:text-teal-400" /> My Wallet
      </h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-teal-500 to-teal-700 dark:from-teal-600 dark:to-teal-800 p-6 rounded-xl text-white shadow-lg">
          <p className="text-teal-100 font-medium">Available Balance</p>
          <h2 className="text-4xl font-bold mt-2">${wallet?.balance?.toFixed(2) || '0.00'}</h2>
          <p className="text-sm mt-4 text-teal-100/80">Total Available for Withdrawal</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Request Payout</h3>
          <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount ($)"
              className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
              min="10"
            />
            <button
              disabled={isWithdrawing}
              className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors w-full sm:w-auto"
            >
              {isWithdrawing ? '...' : 'Withdraw'}
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">Minimum withdrawal $10.00. Processing time 24-48 hours.</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none flex flex-col min-h-[500px]">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Transaction History</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 p-2 rounded-lg transition"
              title="Export CSV"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {/* Desktop Table */}
          <table className="w-full text-left text-gray-600 dark:text-slate-300 hidden md:table">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 uppercase text-xs font-semibold">
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
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {transactions.length > 0 ? (
                transactions.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2">
                      {tx.type === 'COMMISSION' && <ArrowDownLeft className="text-green-500" size={16} />}
                      {tx.type === 'WITHDRAWAL' && <ArrowUpRight className="text-red-500" size={16} />}
                      {tx.type === 'DEPOSIT' && <ArrowDownLeft className="text-green-500" size={16} />}
                      <span className="capitalize text-gray-900 dark:text-white font-medium">{tx.type.replace('_', ' ').toLowerCase()}</span>
                    </td>
                    <td className={`px-6 py-4 font-mono font-bold ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">{tx.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500' :
                        tx.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500'
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-slate-700">
            {transactions.length > 0 ? (
              transactions.map((tx: any) => (
                <div key={tx._id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${tx.type === 'COMMISSION' || tx.type === 'DEPOSIT'
                        ? 'bg-green-100 dark:bg-green-500/20'
                        : 'bg-red-100 dark:bg-red-500/20'
                        }`}>
                        {tx.type === 'COMMISSION' && <ArrowDownLeft className="text-green-600 dark:text-green-400" size={16} />}
                        {tx.type === 'WITHDRAWAL' && <ArrowUpRight className="text-red-600 dark:text-red-400" size={16} />}
                        {tx.type === 'DEPOSIT' && <ArrowDownLeft className="text-green-600 dark:text-green-400" size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white capitalize">
                          {tx.type.replace('_', ' ').toLowerCase()}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-slate-500">
                          {new Date(tx.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={`font-mono font-bold text-lg ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-slate-400 truncate max-w-[70%]">
                      {tx.description}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500' :
                      tx.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500'
                      }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-slate-500">
                No transactions found.
              </div>
            )}
          </div>
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
export default WalletPage;