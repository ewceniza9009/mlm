import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { useUI } from './UIContext';
import { useCreateOrderMutation } from '../store/api';
import { X, CreditCard, ChevronRight, Box } from 'lucide-react';
import { useState } from 'react';

export const CheckoutModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { cart, totalPrice, totalPV, clearCart } = useCart();
    const { showAlert } = useUI();
    const [createOrder, { isLoading }] = useCreateOrderMutation();
    const [paymentMethod, setPaymentMethod] = useState('wallet'); // Later: 'card', 'crypto'

    const handleCheckout = async () => {
        try {
            const items = cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }));

            await createOrder({ items }).unwrap();

            showAlert('Order Placed Successfully! PV Credited.', 'success');
            clearCart();
            onClose();
        } catch (err: any) {
            showAlert(err.data?.message || 'Checkout Failed', 'error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-[#1e2029] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="text-teal-500" /> Checkout
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Order Summary */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Order Summary</h3>
                                <div className="space-y-3">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center border border-gray-100 dark:border-white/5">
                                                    {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-lg" /> : <Box size={16} className="text-gray-400" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">{item.quantity} x ${item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 dark:text-white">${(item.quantity * item.price).toFixed(2)}</p>
                                                <p className="text-xs font-bold text-teal-500">{item.quantity * item.pv} PV</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Payment Method</h3>
                                <div
                                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${paymentMethod === 'wallet'
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
                                        : 'border-gray-200 dark:border-white/10'
                                        }`}
                                    onClick={() => setPaymentMethod('wallet')}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-teal-500' : 'border-gray-300'}`}>
                                        {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">E-Wallet Balance</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Pay using your available earnings</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer / Totals */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-500 dark:text-slate-400">Total PV</span>
                                <span className="font-bold text-teal-500">{totalPV} PV</span>
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">Total Amount</span>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">${totalPrice.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isLoading}
                                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all disabled:opacity-70"
                            >
                                {isLoading ? 'Processing...' : (
                                    <>Confirm Payment <ChevronRight size={18} /></>
                                )}
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
