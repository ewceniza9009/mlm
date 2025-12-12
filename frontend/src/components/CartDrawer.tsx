import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CheckoutModal } from './CheckoutModal';

export const CartDrawer = () => {
    const { cart, isCartOpen, toggleCart, removeFromCart, updateQuantity, totalPrice, totalPV } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    return (
        <>
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={toggleCart}
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#1a1b23] h-full shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                                <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
                                    <ShoppingBag className="text-teal-500" />
                                    Your Cart
                                    <span className="bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs px-2 py-0.5 rounded-full">
                                        {cart.reduce((a, b) => a + b.quantity, 0)} Items
                                    </span>
                                </div>
                                <button
                                    onClick={toggleCart}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Items */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                                        <ShoppingBag size={64} className="opacity-20" />
                                        <p>Your cart is empty.</p>
                                        <button onClick={toggleCart} className="text-teal-500 font-bold hover:underline">Start Shopping</button>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                            <div className="w-20 h-20 rounded-lg bg-white dark:bg-white/10 shrink-0 flex items-center justify-center">
                                                {item.image ? (
                                                    <img src={item.image} className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    <ShoppingBag className="text-gray-300" />
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
                                                    <p className="text-xs text-teal-500 font-bold">{item.pv} PV</p>
                                                </div>

                                                <div className="flex justify-between items-end">
                                                    <p className="font-bold text-gray-900 dark:text-white">${item.price}</p>

                                                    <div className="flex items-center gap-3 bg-white dark:bg-black/20 rounded-lg p-1 border border-gray-200 dark:border-white/10">
                                                        <button
                                                            onClick={() => item.quantity > 1 ? updateQuantity(item.id, -1) : removeFromCart(item.id)}
                                                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
                                                        >
                                                            {item.quantity === 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} className="text-gray-500" />}
                                                        </button>
                                                        <span className="text-sm font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"
                                                        >
                                                            <Plus size={14} className="text-gray-500 dark:text-gray-300" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {cart.length > 0 && (
                                <div className="p-6 bg-white dark:bg-[#1a1b23] border-t border-gray-100 dark:border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                                    <div className="flex justify-between items-center mb-2 text-sm text-gray-500 dark:text-slate-400">
                                        <span>Total PV</span>
                                        <span className="font-bold text-teal-500">{totalPV} PV</span>
                                    </div>
                                    <div className="flex justify-between items-end mb-6">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">Subtotal</span>
                                        <span className="text-2xl font-black text-gray-900 dark:text-white">${totalPrice.toFixed(2)}</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            toggleCart();
                                            setIsCheckoutOpen(true);
                                        }}
                                        className="w-full py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-xl font-bold hover:shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
        </>
    );
};
