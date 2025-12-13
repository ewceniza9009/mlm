import { motion } from 'framer-motion';
import { useGetMyOrdersQuery } from '../store/api';
import { Package, Calendar, DollarSign, Clock, CheckCircle, XCircle, Truck, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const OrderHistoryPage = () => {
    const { data: orders, isLoading } = useGetMyOrdersQuery({});

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
            case 'PENDING': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400';
            case 'SHIPPED': return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
            case 'CANCELLED': return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID': return <CheckCircle size={14} />;
            case 'PENDING': return <Clock size={14} />;
            case 'SHIPPED': return <Truck size={14} />;
            case 'CANCELLED': return <XCircle size={14} />;
            default: return <Package size={14} />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Package className="text-teal-500" />
                    Order History
                </h1>
                <p className="text-gray-500 dark:text-slate-400">View and track your past purchases.</p>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-400">Loading orders...</div>
            ) : orders && orders.length > 0 ? (
                <div className="grid gap-4">
                    {orders.map((order: any) => (
                        <motion.div
                            key={order._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#1a1b23] rounded-xl p-4 md:p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                {/* Order Info */}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm text-gray-400 dark:text-slate-500">#{order._id.slice(-6).toUpperCase()}</span>
                                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Package size={14} />
                                            {order.items.length} Items
                                        </div>
                                    </div>
                                </div>

                                {/* Items Preview */}
                                <div className="flex-1 hidden md:flex items-center gap-2 overflow-hidden">
                                    {order.items.slice(0, 3).map((item: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5 shrink-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                            <span className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate max-w-[120px]">{item.name}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-slate-500">x{item.quantity}</span>
                                        </div>
                                    ))}
                                    {order.items.length > 3 && (
                                        <span className="text-xs text-gray-400 dark:text-slate-500">+{order.items.length - 3} more</span>
                                    )}
                                </div>

                                {/* Totals & Action */}
                                <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-0 border-gray-100 dark:border-white/5">
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wider">Total</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-0.5">
                                            <span className='text-xs text-gray-400 font-normal'>$</span>
                                            {order.totalAmount.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-emerald-500/80 dark:text-emerald-400/80 uppercase font-bold tracking-wider">PV</p>
                                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{order.totalPV}</p>
                                    </div>

                                    {/* Placeholder for Details expansion if we add it later */}
                                    {/* <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400">
                                        <ChevronRight size={20} />
                                    </button> */}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-[#1a1b23] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Package size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No orders yet</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">Looks like you haven't made any purchases yet.</p>
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;
