import React, { useState } from 'react';
import { useGetWalletQuery, useRequestWithdrawalMutation } from '../store/api';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const WalletPage = () => {
  const { data: wallet, isLoading } = useGetWalletQuery(undefined);
  const [requestWithdrawal, { isLoading: isWithdrawing }] = useRequestWithdrawalMutation();
  const [amount, setAmount] = useState('');
  
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

  if (isLoading) return <div className="text-white p-6">Loading Wallet...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-3">
        <WalletIcon size={32} className="text-teal-400" /> My Wallet
      </h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-6 rounded-xl text-white shadow-lg">
          <p className="text-teal-100 font-medium">Available Balance</p>
          <h2 className="text-4xl font-bold mt-2">${wallet?.balance.toFixed(2)}</h2>
          <p className="text-sm mt-4 text-teal-200">Total Available for Withdrawal</p>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
           <h3 className="text-xl font-bold text-white mb-4">Request Payout</h3>
           <form onSubmit={handleWithdraw} className="flex gap-4">
             <input 
               type="number" 
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="Amount ($)"
               className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500"
               min="10"
             />
             <button 
               disabled={isWithdrawing}
               className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors"
             >
               {isWithdrawing ? '...' : 'Withdraw'}
             </button>
           </form>
           <p className="text-xs text-slate-500 mt-2">Minimum withdrawal $10.00. Processing time 24-48 hours.</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {wallet?.transactions.map((tx: any) => (
                <tr key={tx._id} className="hover:bg-slate-750">
                  <td className="px-6 py-4 flex items-center gap-2">
                    {tx.type === 'COMMISSION' && <ArrowDownLeft className="text-green-500" size={16} />}
                    {tx.type === 'WITHDRAWAL' && <ArrowUpRight className="text-red-500" size={16} />}
                    {tx.type === 'DEPOSIT' && <ArrowDownLeft className="text-green-500" size={16} />}
                    <span className="capitalize">{tx.type.replace('_', ' ').toLowerCase()}</span>
                  </td>
                  <td className={`px-6 py-4 font-mono font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">{tx.description}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                      tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!wallet?.transactions || wallet.transactions.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;