import { useGetWishlistQuery, useRemoveFromWishlistMutation } from '../store/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../components/CartContext';

const WishlistPage = () => {
    const { data: wishlist, isLoading } = useGetWishlistQuery({});
    const [removeFromWishlist] = useRemoveFromWishlistMutation();
    const { addToCart } = useCart();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Heart className="text-red-500 fill-red-500" />
                    My Wishlist
                </h1>
                <p className="text-gray-500 dark:text-slate-400">Save items for later.</p>
            </div>

            {isLoading ? (
                <div className="text-center py-20 text-gray-400">Loading wishlist...</div>
            ) : wishlist && wishlist.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {wishlist.map((product: any) => (
                            <motion.div
                                key={product._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white dark:bg-[#1a1b23] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all flex flex-col h-full group relative"
                            >
                                {/* Remove Button */}
                                <button
                                    onClick={() => removeFromWishlist(product._id)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                    title="Remove from Wishlist"
                                >
                                    <Trash2 size={18} />
                                </button>

                                {/* Image */}
                                <div className="aspect-square rounded-xl bg-gray-50 dark:bg-white/5 mb-4 flex items-center justify-center relative overflow-hidden">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ShoppingBag size={48} className="text-gray-300 dark:text-slate-600" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                                            {product.category || 'General'}
                                        </div>
                                        <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                            {product.pv} PV
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 p-0.5">{product.name}</h3>
                                    <div className="flex items-center justify-between mt-auto pt-4">
                                        <span className="text-xl font-black text-gray-900 dark:text-white">${product.price}</span>

                                        <button
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock <= 0}
                                            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold hover:bg-teal-500 dark:hover:bg-teal-400 dark:hover:text-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-[#1a1b23] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Heart size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your wishlist is empty</h3>
                    <p className="text-gray-500 dark:text-slate-400 mb-6">Save items you want to buy later.</p>
                    <Link to="/dashboard/shop" className="inline-flex items-center gap-2 text-teal-500 font-bold hover:underline">
                        Browse Shop <ArrowRight size={16} />
                    </Link>
                </div>
            )}
        </div>
    );
};

export default WishlistPage;
