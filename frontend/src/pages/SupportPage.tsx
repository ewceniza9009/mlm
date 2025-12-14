import { useState } from 'react';
import { useGetTicketsQuery, useCreateTicketMutation, useReplyTicketMutation } from '../store/api';
import { Send, MessageSquare, Clock, CheckCircle, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupportPage = () => {
    const navigate = useNavigate();
    const { data: tickets, isLoading } = useGetTicketsQuery();
    const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();
    const [replyTicket] = useReplyTicketMutation();

    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [replyMessage, setReplyMessage] = useState('');

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubject || !newMessage) return;
        try {
            await createTicket({ subject: newSubject, message: newMessage }).unwrap();
            setIsNewTicketOpen(false);
            setNewSubject('');
            setNewMessage('');
        } catch (err) {
            console.error('Failed to create ticket', err);
        }
    };

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

    // Mobile View Logic:
    // If ticket selected OR creating new -> Hide List
    // Else -> Show List
    const showList = !selectedTicket && !isNewTicketOpen;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-4">
                <button
                    onClick={() => navigate('/dashboard/help')}
                    className="flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-medium text-sm group w-fit"
                >
                    <div className="bg-white dark:bg-[#1a1b23] p-1.5 rounded-lg border border-gray-200 dark:border-white/10 group-hover:border-teal-500/50 shadow-sm">
                        <ArrowLeft size={16} />
                    </div>
                    Back to Help Center
                </button>
            </div>

            <div className="flex flex-1 md:gap-6 relative overflow-hidden">
                {/* Sidebar List */}
                <div className={`w-full md:w-1/3 bg-white dark:bg-[#1a1b23] rounded-xl border border-gray-200 dark:border-white/5 flex flex-col overflow-hidden ${showList ? 'flex' : 'hidden md:flex'
                    }`}>
                    <div className="p-4 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                        <h2 className="font-bold text-lg dark:text-white">My Support Tickets</h2>
                        <button
                            onClick={() => setIsNewTicketOpen(true)}
                            className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading tickets...</div>
                        ) : tickets?.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No tickets found. Need help? Create one!</div>
                        ) : (
                            tickets?.map((ticket: any) => (
                                <div
                                    key={ticket._id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`p-4 border-b border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${selectedTicket?._id === ticket._id ? 'bg-teal-50 dark:bg-teal-500/10 border-l-4 border-l-teal-500' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{ticket.subject}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                            ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {ticket.status}
                                        </span>
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
                    {isNewTicketOpen ? (
                        <div className="p-6 max-w-2xl mx-auto w-full">
                            <button
                                onClick={() => setIsNewTicketOpen(false)}
                                className="md:hidden mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                            >
                                <ArrowLeft size={20} /> Back to Tickets
                            </button>
                            <h2 className="text-2xl font-bold mb-6 dark:text-white">Create New Support Ticket</h2>
                            <form onSubmit={handleCreateTicket} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        placeholder="What's the issue?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Message</label>
                                    <textarea
                                        required
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none h-48"
                                        placeholder="Describe your issue in detail..."
                                    ></textarea>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewTicketOpen(false)}
                                        className="px-6 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition flex items-center gap-2"
                                    >
                                        {isCreating ? 'Creating...' : <><Send size={16} /> Submit Ticket</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedTicket(null)}
                                        className="md:hidden p-1 -ml-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div>
                                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                            <MessageSquare className="text-teal-500" size={20} />
                                            {selectedTicket.subject}
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-1">Ticket ID: {selectedTicket._id}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedTicket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                    {selectedTicket.status}
                                </span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-[#0f1014]/50">
                                {selectedTicket.messages.map((msg: any, idx: number) => (
                                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.sender === 'user'
                                            ? 'bg-teal-500 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-[#1a1b23] dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-tl-none'
                                            }`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                            <p className={`text-[10px] mt-2 text-right ${msg.sender === 'user' ? 'text-teal-100' : 'text-gray-400'}`}>
                                                {new Date(msg.date).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 bg-white dark:bg-[#1a1b23] border-t border-gray-200 dark:border-white/5">
                                {selectedTicket.status === 'RESOLVED' ? (
                                    <div className="text-center p-4 text-gray-500 bg-gray-50 dark:bg-white/5 rounded-lg border border-dashed border-gray-300 dark:border-slate-700">
                                        <CheckCircle className="mx-auto mb-2 text-green-500" />
                                        This ticket has been resolved. Open a new one if you need further assistance.
                                    </div>
                                ) : (
                                    <form onSubmit={handleReply} className="flex gap-4">
                                        <input
                                            type="text"
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder="Type your reply..."
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-[#0f1014] focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!replyMessage.trim()}
                                            className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-all"
                                        >
                                            <Send size={20} />
                                        </button>
                                    </form>
                                )}
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
        </div>
    );
};

export default SupportPage;
