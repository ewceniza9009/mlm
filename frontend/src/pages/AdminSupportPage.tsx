import { useState } from 'react';
import { useGetAllTicketsQuery, useReplyTicketMutation, useUpdateTicketStatusMutation } from '../store/api';
import { Send, MessageSquare, Clock, CheckCircle, Search, User, ArrowLeft } from 'lucide-react';

const AdminSupportPage = () => {
    const { data: tickets, isLoading } = useGetAllTicketsQuery();
    const [replyTicket] = useReplyTicketMutation();
    const [updateStatus] = useUpdateTicketStatusMutation();

    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [filter, setFilter] = useState('ALL'); // ALL, OPEN, RESOLVED

    const selectedTicket = tickets?.find((t: any) => t._id === selectedTicketId);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage || !selectedTicket) return;
        try {
            await replyTicket({ ticketId: selectedTicket._id, message: replyMessage }).unwrap();
            setReplyMessage('');
        } catch (err) {
            console.error('Failed to reply', err);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!selectedTicket) return;
        try {
            await updateStatus({ ticketId: selectedTicket._id, status }).unwrap();
            // No local state update needed; RTK Query handles refetch
        } catch (err) {
            console.error(err);
        }
    }

    const filteredTickets = tickets?.filter((t: any) => {
        if (filter === 'ALL') return true;
        return t.status === filter;
    });

    // Mobile Logic: If ticket selected -> Hide List
    const showList = !selectedTicketId;

    return (
        <div className="flex h-[calc(100vh-8rem)] md:gap-6 relative">
            {/* Sidebar List */}
            <div className={`w-full md:w-1/3 bg-white dark:bg-[#1a1b23] rounded-xl border border-gray-200 dark:border-white/5 flex flex-col overflow-hidden ${showList ? 'flex' : 'hidden md:flex'
                }`}>
                <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg dark:text-white">Support Queue</h2>
                    </div>
                    <div className="flex gap-2 text-xs">
                        {['ALL', 'OPEN', 'RESOLVED'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filter === f ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-slate-400'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading tickets...</div>
                    ) : filteredTickets?.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No tickets found.</div>
                    ) : (
                        filteredTickets?.map((ticket: any) => (
                            <div
                                key={ticket._id}
                                onClick={() => setSelectedTicketId(ticket._id)}
                                className={`p-4 border-b border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selectedTicketId === ticket._id ? 'bg-amber-50 dark:bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">{ticket.subject}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                        ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                                        {ticket.userId?.username?.substring(0, 1).toUpperCase()}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">{ticket.userId?.username || 'Unknown User'}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{ticket.messages[ticket.messages.length - 1]?.message}</p>
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock size={10} />
                                    {new Date(ticket.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`w-full md:flex-1 bg-white dark:bg-[#1a1b23] rounded-xl border border-gray-200 dark:border-white/5 flex flex-col overflow-hidden relative ${!showList ? 'flex' : 'hidden md:flex'
                }`}>
                {selectedTicket ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedTicketId(null)}
                                    className="md:hidden p-1 -ml-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                        <MessageSquare className="text-amber-500" size={20} />
                                        {selectedTicket.subject}
                                    </h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <User size={14} />
                                        <span className="font-medium text-gray-700 dark:text-slate-300">{selectedTicket.userId?.username}</span>
                                        <span className="text-gray-300">|</span>
                                        <span>{selectedTicket.userId?.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedTicket.status !== 'RESOLVED' && (
                                    <button
                                        onClick={() => handleStatusChange('RESOLVED')}
                                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition"
                                    >
                                        <CheckCircle size={14} /> <span className="hidden sm:inline">Mark Resolved</span>
                                    </button>
                                )}
                                {selectedTicket.status === 'RESOLVED' && (
                                    <button
                                        onClick={() => handleStatusChange('OPEN')}
                                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded-lg transition"
                                    >
                                        Re-open Ticket
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-[#0f1014]/50">
                            {selectedTicket.messages.map((msg: any, idx: number) => (
                                <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.sender === 'admin'
                                        ? 'bg-amber-500 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-[#1a1b23] dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-tl-none'
                                        }`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-bold uppercase opacity-80 ${msg.sender === 'admin' ? 'text-amber-100' : 'text-gray-400'}`}>
                                                {msg.sender === 'admin' ? 'Support Agent' : 'User'}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                        <p className={`text-[10px] mt-2 text-right ${msg.sender === 'admin' ? 'text-amber-100' : 'text-gray-400'}`}>
                                            {new Date(msg.date).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Box */}
                        <div className="p-4 bg-white dark:bg-[#1a1b23] border-t border-gray-200 dark:border-white/5">
                            <form onSubmit={handleReply} className="flex gap-4">
                                <input
                                    type="text"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Type official response..."
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-[#0f1014] focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!replyMessage.trim()}
                                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageSquare size={48} className="mb-4 opacity-20" />
                        <p>Select a ticket to view conversation</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupportPage;
