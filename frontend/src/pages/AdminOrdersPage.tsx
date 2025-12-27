import { useState } from 'react';
import { useGetAllOrdersQuery, useUpdateOrderStatusMutation } from '../store/api';
import { CheckCircle, XCircle, Clock, ShoppingCart } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { useUI } from '../components/UIContext';

const AdminOrdersPage = () => {
    // Query State
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('PENDING'); // Default to PENDING
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

    // Fetch Data
    const { data, isLoading } = useGetAllOrdersQuery({
        page,
        limit: 10,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search,
        sortBy: sortConfig.key,
        order: sortConfig.direction
    });

    const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

    const { showConfirm, showAlert } = useUI();

    const handleApprove = (orderId: string) => {
        showConfirm({
            title: 'Approve and Activate?',
            message: 'This will mark the order as PAID, activate the user immediately, and distribute all commissions. This action cannot be undone.',
            type: 'info', // Using 'info' type for confirmation dialog as 'success' is not a supported type.
            confirmText: 'Yes, Activate User',
            onConfirm: async () => {
                try {
                    await updateStatus({ id: orderId, status: 'PAID' }).unwrap();
                    showAlert('Order marked as PAID', 'success');
                } catch (error) {
                    console.error('Failed to approve order', error);
                    showAlert('Failed to update status', 'error');
                }
            }
        });
    };

    const handleReject = (orderId: string) => {
        showConfirm({
            title: 'Cancel Order?',
            message: 'Are you sure you want to CANCEL this order permanently?',
            type: 'danger',
            confirmText: 'Yes, Cancel Order',
            onConfirm: async () => {
                try {
                    await updateStatus({ id: orderId, status: 'CANCELLED' }).unwrap();
                    showAlert('Order cancelled', 'success');
                } catch (error) {
                    console.error('Failed to cancel order', error);
                    showAlert('Failed to update status', 'error');
                }
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400';
            case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
        }
    };

    // Table Configuration
    const columns = [
        {
            key: '_id',
            label: 'Order ID / Date',
            sortable: true,
            render: (order: any) => (
                <div>
                    <div className="font-mono text-xs font-bold text-gray-900 dark:text-white">#{order._id.slice(-6).toUpperCase()}</div>
                    <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                </div>
            )
        },
        {
            key: 'userId', // Sort acts on userId field, but backend handles population search usually
            label: 'Customer',
            render: (order: any) => (
                <div>
                    {order.userId ? (
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white">{order.userId.firstName} {order.userId.lastName}</div>
                            <div className="text-xs text-gray-500">{order.userId.email}</div>
                        </div>
                    ) : (
                        <span className="text-gray-500 italic">Guest</span>
                    )}
                    <div className="text-xs text-teal-500 mt-1">{order.paymentMethod}</div>
                </div>
            )
        },
        {
            key: 'totalAmount',
            label: 'Amount',
            sortable: true,
            className: 'text-right',
            render: (order: any) => (
                <div>
                    <div className="font-bold text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{order.totalPV} PV</div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            className: 'text-center',
            render: (order: any) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                    {order.status === 'PENDING' && <Clock size={12} />}
                    {order.status === 'PAID' && <CheckCircle size={12} />}
                    {order.status === 'CANCELLED' && <XCircle size={12} />}
                    {order.status}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'text-right',
            render: (order: any) => (
                order.status === 'PENDING' && (
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
                )
            )
        }
    ];

    return (
        <div className="space-y-6 animation-fade-in">
            <PageHeader
                title="Order Management"
                subtitle="Review and process customer orders."
                icon={<ShoppingCart size={24} />}
            />
            <DataTable
                title=""
                columns={columns}
                data={data?.data || []}
                total={data?.total || 0}
                page={page}
                totalPages={data?.totalPages || 1}
                onPageChange={setPage}
                onSearch={setSearch}
                onSort={(key, direction) => setSortConfig({ key, direction })}
                isLoading={isLoading}
                searchPlaceholder="Search order ID, email or name..."
                actions={
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm h-full"
                    >
                        <option value="ALL">All Orders</option>
                        <option value="PENDING">Pending (Cash)</option>
                        <option value="PAID">Paid</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                }
            />
        </div>
    );
};

export default AdminOrdersPage;
