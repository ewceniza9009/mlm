import { useState } from 'react';
import { ShoppingBag, Search } from 'lucide-react';
import { useGetShopProductsQuery, useCreateOrderMutation } from '../store/api';
import { motion } from 'framer-motion';

import { useUI } from '../components/UIContext';

const ShopPage = () => {
    const { data: products, isLoading } = useGetShopProductsQuery({});
    const [createOrder, { isLoading: isOrdering }] = useCreateOrderMutation();
    const [searchTerm, setSearchTerm] = useState('');
    const { showAlert, showConfirm } = useUI();

    const handleBuy = (product: any) => {
        showConfirm({
            title: 'Confirm Purchase',
            message: `Are you sure you want to buy ${product.name} for $${product.price}?`,
            confirmText: 'Buy Now',
            cancelText: 'Cancel',
            type: 'info',
            onConfirm: async () => {
                try {
                    await createOrder({
                        items: [{ productId: product._id, quantity: 1 }]
                    }).unwrap();
                    showAlert('Purchase Successful! PV Added.', 'success');
                } catch (err: any) {
                    showAlert(err.data?.message || 'Purchase Failed', 'error');
                }
            }
        });
    };

    const filteredProducts = products?.filter((p: any) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Shop</h1>
                    <p className="text-gray-500 dark:text-slate-400">Purchase products to boost your volume</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">Loading products...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts?.map((product: any) => (
                        <motion.div
                            key={product._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-[#1a1b23] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="aspect-square rounded-xl bg-gray-100 dark:bg-white/5 mb-4 flex items-center justify-center relative overflow-hidden group">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <ShoppingBag size={48} className="text-gray-300 dark:text-slate-600" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleBuy(product)}
                                        disabled={isOrdering}
                                        className="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-all"
                                    >
                                        Buy Now
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{product.name}</h3>
                                    <span className="bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-1 rounded-lg text-xs font-bold">
                                        {product.pv} PV
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{product.description}</p>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">${product.price}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShopPage;
