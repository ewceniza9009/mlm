import { useState } from 'react';
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation } from '../store/api';
import { Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

const AdminOrdersPage = () => {
    const [statusFilter, setStatusFilter] = useState('PENDING'); // Default to PENDING
    const { data: orders, isLoading } = useGetAllOrdersQuery({ status: statusFilter });
    const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

    // Optimistic update for UI smoothness could be added here, but invalidateTags handles it well.

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'success' | 'danger' | 'warning';
        title: string;
        message: string;
        confirmText: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        type: 'warning',
        title: '',
        message: '',
        confirmText: '',
        onConfirm: () => { }
    });

    const openConfirmModal = (
        type: 'success' | 'danger' | 'warning',
        title: string,
        message: string,
        confirmText: string,
        action: () => Promise<void>
    ) => {
        setModalConfig({
            isOpen: true,
            type,
            title,
            message,
            confirmText,
            onConfirm: async () => {
                await action();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleApprove = (orderId: string) => {
        openConfirmModal(
            'success',
            'Approve and Activate?',
            'This will mark the order as PAID, activate the user immediately, and distribute all commissions. This action cannot be undone.',
            'Yes, Activate User',
            async () => {
                try {
                    await updateStatus({ id: orderId, status: 'PAID' }).unwrap();
                } catch (error) {
                    console.error('Failed to approve order', error);
                    alert('Failed to update status');
                }
            }
        );
    };

    const handleReject = (orderId: string) => {
        openConfirmModal(
            'danger',
            'Cancel Order?',
            'Are you sure you want to CANCEL this order permanently?',
            'Yes, Cancel Order',
            async () => {
                try {
                    await updateStatus({ id: orderId, status: 'CANCELLED' }).unwrap();
                } catch (error) {
                    console.error('Failed to cancel order', error);
                    alert('Failed to update status');
                }
            }
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
            case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Management</h1>
                    <p className="text-gray-500 dark:text-slate-400">Manage customer orders and payments.</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">All Orders</option>
                        <option value="PENDING">Pending (Cash)</option>
                        <option value="PAID">Paid</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white dark:bg-[#1a1b23] rounded-xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading orders...</div>
                ) : !orders || orders.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                        <AlertTriangle size={48} className="mb-4 opacity-20" />
                        <p>No orders found matching this filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Order ID / Date</th>
                                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider text-right">Amount</th>
                                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {orders.map((order: any) => (
                                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs font-bold text-gray-900 dark:text-white">#{order._id.slice(-6).toUpperCase()}</div>
                                            <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.userId ? (
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{order.userId.firstName} {order.userId.lastName}</div>
                                                    <div className="text-xs text-gray-500">{order.userId.email}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 italic">Guest</span>
                                            )}
                                            <div className="text-xs text-teal-500 mt-1">{order.paymentMethod}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-bold text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</div>
                                            <div className="text-xs text-gray-500">{order.totalPV} PV</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                                {order.status === 'PENDING' && <Clock size={12} />}
                                                {order.status === 'PAID' && <CheckCircle size={12} />}
                                                {order.status === 'CANCELLED' && <XCircle size={12} />}
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {order.status === 'PENDING' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApprove(order._id)}
                                                        disabled={isUpdating}
                                                        className="p-1.5 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                                                        title="Mark as Paid"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(order._id)}
                                                        disabled={isUpdating}
                                                        className="p-1.5 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                                                        title="Cancel Order"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* Confirmation Modal */}
                <ConfirmationModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={modalConfig.onConfirm}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    confirmText={modalConfig.confirmText}
                    isLoading={isUpdating}
                />
            </div>
        </div>
    );
};

export default AdminOrdersPage;
