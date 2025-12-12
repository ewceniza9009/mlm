import { useState, useMemo } from 'react';
import { ShoppingBag, Search, Filter, ShoppingCart, Plus } from 'lucide-react';
import { useGetShopProductsQuery } from '../store/api';
import { motion } from 'framer-motion';
import { useCart } from '../components/CartContext';
import { CartDrawer } from '../components/CartDrawer';

const ShopPage = () => {
    const { data: products, isLoading } = useGetShopProductsQuery({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const { addToCart, toggleCart, itemCount } = useCart();

    // Derive categories from products
    const categories = useMemo(() => {
        if (!products) return ['All'];
        const cats = new Set(products.map((p: any) => p.category || 'Uncategorized'));
        return ['All', ...Array.from(cats)];
    }, [products]);

    const filteredProducts = products?.filter((p: any) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || (p.category || 'Uncategorized') === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="relative min-h-screen">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Shop</h1>
                    <p className="text-gray-500 dark:text-slate-400">Purchase products to boost your volume</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-64 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={toggleCart}
                        className="relative p-3 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-white/10 rounded-xl hover:shadow-md transition-all group"
                    >
                        <ShoppingCart className="text-gray-700 dark:text-gray-200 group-hover:text-teal-500 transition-colors" size={22} />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#1a1b23]">
                                {itemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Category Sidebar (Desktop) or Horizontal Scroll (Mobile) */}
                <div className="w-full lg:w-64 shrink-0 space-y-2 lg:sticky lg:top-8">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 uppercase text-xs font-bold tracking-wider mb-2">
                        <Filter size={12} /> Categories
                    </div>
                    <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0">
                        {categories.map((cat: any) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap text-left flex items-center justify-between group ${selectedCategory === cat
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                    : 'bg-white dark:bg-[#1a1b23] text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent dark:border-transparent hover:border-gray-200 dark:hover:border-white/10'
                                    }`}
                            >
                                {cat}
                                {selectedCategory === cat && <span className="bg-white/20 px-1.5 rounded text-xs">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 w-full">
                    {isLoading ? (
                        <div className="text-center py-20 text-gray-400">Loading products...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts?.map((product: any) => (
                                <motion.div
                                    key={product._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-[#1a1b23] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all flex flex-col h-full group"
                                >
                                    {/* Image */}
                                    <div className="aspect-square rounded-xl bg-gray-50 dark:bg-white/5 mb-4 flex items-center justify-center relative overflow-hidden">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <ShoppingBag size={48} className="text-gray-300 dark:text-slate-600" />
                                        )}

                                        {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                                <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Out of Stock</span>
                                            </div>
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

                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 p-0.5" title={product.name}>{product.name}</h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{product.description}</p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xl font-black text-gray-900 dark:text-white">${product.price}</span>

                                            <button
                                                onClick={() => addToCart(product)}
                                                disabled={product.stock <= 0}
                                                className="bg-gray-900 dark:bg-white text-white dark:text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-teal-500 dark:hover:bg-teal-400 dark:hover:text-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Add to Cart"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            <CartDrawer />
        </div>
    );
};

export default ShopPage;
