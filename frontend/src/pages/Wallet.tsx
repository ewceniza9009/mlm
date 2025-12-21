import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetWalletQuery, useRequestWithdrawalMutation, useTransferFundsMutation } from '../store/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, Info, Send, Users, Check, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useUI } from '../components/UIContext';

const WalletPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const limit = 10;

  const { data: wallet, isLoading } = useGetWalletQuery({ page, limit, search, sortBy, order });
  const [requestWithdrawal, { isLoading: isWithdrawing }] = useRequestWithdrawalMutation();
  const [transferFunds, { isLoading: isTransferring }] = useTransferFundsMutation();

  const [activeSection, setActiveSection] = useState<'overview' | 'history'>('overview');
  const [actionTab, setActionTab] = useState<'withdraw' | 'transfer'>('withdraw');
  const [amount, setAmount] = useState('');

  // Transfer State
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [recentContacts] = useState(['admin', 'demo_user', 'leader_one']); // Mock recent contacts

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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !recipient) return;
    try {
      await transferFunds({ recipientIdentifier: recipient, amount: Number(amount), note }).unwrap();
      setAmount('');
      setRecipient('');
      setNote('');
      showAlert('Funds transferred successfully!', 'success');
    } catch (err: any) {
      showAlert(err.data?.message || 'Transfer Failed', 'error');
    }
  };

  const { token } = useSelector((state: RootState) => state.auth);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({ format: 'csv', search, sortBy, order });
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/';

      const response = await fetch(`${baseUrl}wallet?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      showAlert('Failed to export CSV', 'error');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={14} className="text-gray-400" />;
    return order === 'asc' ? <ArrowUpDown size={14} className="text-teal-600 rotate-180 transition-transform" /> : <ArrowUpDown size={14} className="text-teal-600 transition-transform" />;
  };

  const getHeaderClass = (field: string) => `px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors select-none ${sortBy === field ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}`;

  if (isLoading) return <div className="text-gray-500 dark:text-gray-400 p-6 flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
  </div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="My Wallet"
        subtitle="Manage your earnings, withdrawals, and funds."
        icon={<WalletIcon size={24} />}
      />

      {/* Main Tab Navigation */}
      <div className="flex bg-gray-100 dark:bg-slate-800/50 p-1 rounded-xl w-full md:w-fit mb-6">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeSection === 'overview'
            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSection('history')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeSection === 'history'
            ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
        >
          History
        </button>
      </div>

      {/* OVERVIEW SECTION */}
      {activeSection === 'overview' && (
        <div className="flex flex-col md:flex-row gap-6 animate-fade-in">
          {/* BALANCE CARD */}
          <div className="w-full md:w-1/3 min-w-[300px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-slate-300 dark:shadow-black/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Total Balance</h2>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl md:text-5xl font-black tracking-tight">${wallet?.balance?.toFixed(2) || '0.00'}</span>
              <span className="text-teal-400 text-sm font-bold">USD</span>
            </div>

            <div className="mt-auto">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                  <ArrowDownLeft size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Income</p>
                  <p className="font-bold">+${wallet?.totalEarnings?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION PANEL */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 md:p-8">
            {/* Custom Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-slate-700/50 rounded-xl mb-6 w-full md:w-fit">
              <button
                onClick={() => setActionTab('withdraw')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${actionTab === 'withdraw' ? 'bg-white dark:bg-slate-600 text-teal-600 dark:text-teal-400 shadow-md transform scale-100' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 shadow-none'}`}
              >
                Request Payout
              </button>
              <button
                onClick={() => setActionTab('transfer')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${actionTab === 'transfer' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-md transform scale-100' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 shadow-none'}`}
              >
                Transfer Funds
              </button>
            </div>

            {actionTab === 'withdraw' ? (
              <div className="animation-fade-in space-y-4 max-w-lg">
                <div className="p-4 bg-teal-50 dark:bg-teal-900/10 rounded-xl border border-teal-100 dark:border-teal-800/30 flex gap-3 text-teal-800 dark:text-teal-300">
                  <Info size={20} className="shrink-0" />
                  <p className="text-sm leading-relaxed">
                    Withdrawals are processed every <strong>Friday</strong>. Minimum withdrawal amount is <strong>$10.00</strong>.
                  </p>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Withdrawal Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-lg">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                        min="10"
                      />
                    </div>
                  </div>
                  <button
                    disabled={isWithdrawing}
                    className="w-full bg-teal-600 hover:bg-teal-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isWithdrawing ? 'Processing Request...' : 'Confirm Withdrawal'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="animation-fade-in space-y-6 max-w-lg">
                {/* Recent Contacts (Mock) */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quick Send</label>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {recentContacts.map(contact => (
                      <button
                        key={contact}
                        onClick={() => setRecipient(contact)}
                        className="flex flex-col items-center gap-2 min-w-[64px] group"
                      >
                        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-2 ring-transparent group-hover:ring-indigo-500 transition-all">
                          {contact.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center group-hover:text-indigo-600">{contact}</span>
                      </button>
                    ))}
                    <div className="w-px h-12 bg-gray-200 dark:bg-slate-700 mx-1"></div>
                    <button className="flex flex-col items-center gap-2 min-w-[64px] group">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-400 group-hover:border-indigo-500 group-hover:text-indigo-500 transition-all">
                        <Users size={18} />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">New</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recipient</label>
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="Username or Email"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Private Note <span className="text-gray-300 lowercase font-normal">(optional)</span></label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What's this for?"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    disabled={isTransferring}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isTransferring ? 'Sending...' : <><Send size={18} /> Send Funds Now</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY SECTION */}
      {activeSection === 'history' && (
        <div className="animate-fade-in space-y-6">

          {/* Transactions History Header */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
            Recent Transactions
          </h3>

          {/* Transactions Table Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center gap-4 bg-gray-50/50 dark:bg-slate-900/50">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search history..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-gray-200 dark:hover:border-slate-600 rounded-lg transition-all"
              >
                <Download size={16} />
                <span className="hidden md:inline">Export CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
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
                        <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCredit
                              ? 'bg-green-100 dark:bg-green-500/10 text-green-600'
                              : 'bg-red-100 dark:bg-red-500/10 text-red-600'
                              }`}>
                              {isCredit && <ArrowDownLeft size={16} />}
                              {isDebit && <ArrowUpRight size={16} />}
                            </div>
                            <span className="capitalize font-bold text-sm text-gray-900 dark:text-white">{tx.type.replace('_', ' ').toLowerCase()}</span>
                          </td>
                          <td className={`px-6 py-4 font-mono font-bold text-sm ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-200'}`}>
                            {isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm max-w-xs truncate text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" title={tx.description}>{tx.description}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${tx.status === 'COMPLETED' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                              tx.status === 'PENDING' ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                              }`}>
                              {tx.status === 'COMPLETED' && <Check size={10} />}
                              {tx.status === 'PENDING' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />}
                              {tx.status === 'FAILED' && <AlertCircle size={10} />}
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="text-gray-300 dark:text-slate-600" size={32} />
                          <p>No transactions found matching your criteria.</p>
                        </div>
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
                      <div key={tx._id} className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isCredit
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-600'
                              : 'bg-red-100 dark:bg-red-500/20 text-red-600'
                              }`}>
                              {isCredit && <ArrowDownLeft size={18} />}
                              {isDebit && <ArrowUpRight size={18} />}
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
                          <div className={`font-mono font-bold text-base ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                          </div>
                        </div>

                        <div className="pl-12">
                          <p className="text-xs text-gray-600 dark:text-slate-300 mb-2">{tx.description}</p>
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
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/10">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;