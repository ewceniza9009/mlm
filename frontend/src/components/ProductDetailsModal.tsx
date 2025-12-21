import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, ShoppingCart, CheckCircle, Heart, Star, ShieldCheck, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { useGetWishlistQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } from '../store/api';

interface ProductDetailsModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

export const ProductDetailsModal = ({ product, isOpen, onClose }: ProductDetailsModalProps) => {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [isAdded, setIsAdded] = useState(false);

    // Wishlist
    const { data: wishlist } = useGetWishlistQuery({});
    const [addToWishlist] = useAddToWishlistMutation();
    const [removeFromWishlist] = useRemoveFromWishlistMutation();

    const isWishlisted = wishlist?.some((p: any) => p._id === product?._id);

    const toggleWishlist = () => {
        if (isWishlisted) removeFromWishlist(product._id);
        else addToWishlist(product._id);
    };

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setIsAdded(false);
        }
    }, [isOpen, product]);

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }

        setIsAdded(true);
        setTimeout(() => {
            setIsAdded(false);
            onClose();
        }, 1000);
    };

    if (!product) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-5xl bg-white dark:bg-[#0f1014] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-auto border border-white/20 dark:border-white/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 z-20 p-2.5 bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/40 backdrop-blur-md rounded-full transition-all text-gray-800 dark:text-white border border-white/20 group"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        {/* Image Section */}
                        <div className="w-full md:w-1/2 relative bg-gray-50 dark:bg-[#15161c] p-10 flex items-center justify-center overflow-hidden">
                            {/* Ambient Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-purple-500/5 dark:from-teal-500/10 dark:to-purple-500/10" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px]" />

                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="relative z-10 w-full h-full flex items-center justify-center"
                            >
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="max-w-full max-h-[350px] md:max-h-[450px] object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <ShoppingBag size={120} className="text-gray-200 dark:text-gray-700" />
                                )}
                            </motion.div>

                            {product.stock <= 0 && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-sm">
                                    <span className="bg-black text-white px-8 py-3 rounded-full text-xl font-black uppercase tracking-widest shadow-2xl transform -rotate-6 border-2 border-white">
                                        Sold Out
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Details Section */}
                        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col h-full bg-white dark:bg-[#0f1014]">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
                            >
                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <span className="px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider border border-teal-100 dark:border-teal-500/20">
                                        {product.category || 'General'}
                                    </span>
                                    <span className="px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-100 dark:border-purple-500/20 flex items-center gap-1.5">
                                        <Star size={12} className="fill-purple-700 dark:fill-purple-300" />
                                        {product.pv} PV
                                    </span>
                                </div>

                                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 leading-[1.1] tracking-tight">
                                    {product.name}
                                </h2>

                                <div className="flex items-center gap-6 mb-8">
                                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                                        ${product.price}
                                    </div>
                                    {product.oldPrice && (
                                        <div className="text-xl text-gray-400 line-through decoration-2">
                                            ${product.oldPrice}
                                        </div>
                                    )}
                                </div>

                                <div className="prose dark:prose-invert prose-lg text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
                                    {product.description || "Experience premium quality with this exclusive product. Designed to enhance your lifestyle and boost your business volume."}
                                </div>

                                {/* Features / Trust Badges */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">Guarantee</div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">Authentic</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg text-green-600 dark:text-green-400">
                                            <Lock size={20} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">Secure</div>
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">Encrypted Checkout</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10"
                            >
                                {product.stock > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</label>

                                            <button
                                                onClick={toggleWishlist}
                                                className={`flex items-center gap-2 text-sm font-bold transition-colors ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                            >
                                                <Heart size={18} className={isWishlisted ? "fill-red-500" : ""} />
                                                {isWishlisted ? 'Saved' : 'Save for later'}
                                            </button>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 h-14">
                                                <button
                                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                    className="w-12 h-full flex items-center justify-center hover:text-teal-500 transition-colors"
                                                >
                                                    <Minus size={18} />
                                                </button>
                                                <span className="font-bold w-8 text-center text-lg">{quantity}</span>
                                                <button
                                                    onClick={() => setQuantity(q => q + 1)}
                                                    className="w-12 h-full flex items-center justify-center hover:text-teal-500 transition-colors"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isAdded}
                                                className={`flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] ${isAdded
                                                    ? 'bg-green-500 text-white shadow-green-500/25'
                                                    : 'bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 text-white dark:text-black hover:shadow-xl hover:shadow-teal-500/10 dark:hover:shadow-white/10'
                                                    }`}
                                            >
                                                {isAdded ? (
                                                    <>
                                                        <CheckCircle size={24} />
                                                        <span>Added to Cart</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingCart size={24} />
                                                        <span>Add to Cart</span>
                                                        <span className="bg-white/20 dark:bg-black/10 px-2 py-0.5 rounded text-sm font-medium ml-1">
                                                            ${(product.price * quantity).toFixed(2)}
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button disabled className="w-full h-14 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 rounded-2xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10">
                                        <ShoppingCart size={20} className="opacity-50" />
                                        Currently Unavailable
                                    </button>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

