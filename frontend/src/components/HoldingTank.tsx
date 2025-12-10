import React, { useState } from 'react';
import { useGetHoldingTankQuery, usePlaceMemberMutation } from '../store/api';
import { User, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const HoldingTank = () => {
    const { data: pendingUsers, isLoading, refetch } = useGetHoldingTankQuery();
    const [placeMember, { isLoading: isPlacing }] = usePlaceMemberMutation();
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [targetParentId, setTargetParentId] = useState('');
    const [position, setPosition] = useState<'left' | 'right'>('left');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handlePlace = async () => {
        if (!selectedUser || !targetParentId) return;

        try {
            await placeMember({
                userId: selectedUser._id,
                targetParentId,
                position
            }).unwrap();

            setMessage({ type: 'success', text: `Successfully placed ${selectedUser.username}!` });
            setSelectedUser(null);
            setTargetParentId('');
            refetch(); // Refresh list

            // Auto hide message
            setTimeout(() => setMessage(null), 5000);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.data?.message || 'Placement failed' });
        }
    };

    if (isLoading) return <div className="text-slate-400 p-4">Loading Holding Tank...</div>;

    if (!pendingUsers || pendingUsers.length === 0) return (
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-500" size={24} />
            </div>
            <h3 className="text-lg font-medium text-white">Holding Tank Empty</h3>
            <p className="text-slate-400 mt-1">All your sponsored members have been placed.</p>
        </div>
    );

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-700/20">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="text-teal-400" size={20} />
                    Holding Tank <span className="text-sm bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
                </h2>
                {message && (
                    <div className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {message.text}
                    </div>
                )}
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User List */}
                <div className="space-y-3">
                    <p className="text-sm text-slate-400 mb-2">Select a member to place:</p>
                    {pendingUsers.map((user: any) => (
                        <div
                            key={user._id}
                            onClick={() => setSelectedUser(user)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedUser?._id === user._id
                                    ? 'bg-teal-500/10 border-teal-500'
                                    : 'bg-slate-700/30 border-slate-700 hover:bg-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center font-bold text-xs text-slate-300">
                                    {user.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{user.username}</p>
                                    <p className="text-xs text-slate-400">{user.email}</p>
                                </div>
                            </div>
                            {selectedUser?._id === user._id && <CheckCircle className="text-teal-500" size={18} />}
                        </div>
                    ))}
                </div>

                {/* Placement Form */}
                <div className={`bg-slate-900/50 rounded-lg p-5 border border-slate-700 flex flex-col justify-center ${!selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        Place <span className="text-teal-400 font-bold">{selectedUser?.username || '...'}</span>
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Under Parent (User ID)</label>
                            <input
                                type="text"
                                placeholder="Enter Parent ID"
                                value={targetParentId}
                                onChange={(e) => setTargetParentId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-teal-500 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Copy ID from tree details panel</p>
                        </div>

                        <div>
                            <label className="block text-xs text-slate-400 mb-1">Position</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setPosition('left')}
                                    className={`p-2 rounded border text-sm transition-colors ${position === 'left' ? 'bg-teal-500 text-white border-teal-500' : 'bg-slate-800 text-slate-400 border-slate-600'}`}
                                >
                                    Left Leg
                                </button>
                                <button
                                    onClick={() => setPosition('right')}
                                    className={`p-2 rounded border text-sm transition-colors ${position === 'right' ? 'bg-teal-500 text-white border-teal-500' : 'bg-slate-800 text-slate-400 border-slate-600'}`}
                                >
                                    Right Leg
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handlePlace}
                            disabled={isPlacing || !targetParentId}
                            className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${!targetParentId
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/20'
                                }`}
                        >
                            {isPlacing ? 'Placing...' : 'Confirm Placement'} <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HoldingTank;
