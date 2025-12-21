import { useState, useMemo } from 'react';
import { ShoppingBag, Search, Filter, ShoppingCart, Plus, Check, Eye, Heart } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useGetShopProductsQuery, useGetWishlistQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } from '../store/api';
import { motion } from 'framer-motion';
import { useCart } from '../components/CartContext';
import { CartDrawer } from '../components/CartDrawer';
import { ProductDetailsModal } from '../components/ProductDetailsModal';

const ShopPage = () => {
    const { data: products, isLoading } = useGetShopProductsQuery({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null); // Selected Product State
    const { addToCart, toggleCart, itemCount } = useCart();

    // Wishlist
    const { data: wishlist } = useGetWishlistQuery({});
    const [addToWishlist] = useAddToWishlistMutation();
    const [removeFromWishlist] = useRemoveFromWishlistMutation();

    const toggleWishlist = (e: React.MouseEvent, productId: string) => {
        e.stopPropagation();
        const exists = wishlist?.some((p: any) => p._id === productId);
        if (exists) removeFromWishlist(productId);
        else addToWishlist(productId);
    };

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
            {/* Header / Toolbar */}
            <PageHeader
                title="Product Shop"
                subtitle="Purchase products to boost your volume."
                icon={<ShoppingBag size={24} />}
                actions={
                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-64 shadow-sm text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={toggleCart}
                            className="relative p-2 bg-white dark:bg-[#1a1b23] border border-gray-200 dark:border-white/10 rounded-lg hover:shadow-md transition-all group"
                        >
                            <ShoppingCart className="text-gray-700 dark:text-gray-200 group-hover:text-teal-500 transition-colors" size={20} />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white dark:border-[#1a1b23]">
                                    {itemCount}
                                </span>
                            )}
                        </button>
                    </div>
                }
            />

            {/* HERO SECTION */}
            <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-r from-teal-900 to-slate-900 shadow-xl max-h-[300px]">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
                <div className="relative p-6 md:p-10 flex flex-col items-start max-w-xl justify-center h-full">
                    <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-widest border border-teal-500/30 mb-3 backdrop-blur-sm">
                        New Collection
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
                        Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Lifestyle</span>
                    </h2>
                    <p className="text-slate-300 text-sm md:text-base mb-6 max-w-md leading-relaxed line-clamp-2">
                        Discover premium products designed to boost your personal volume and enhance your daily routine.
                    </p>
                    <button className="px-6 py-2.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-lg shadow-white/10 flex items-center gap-2 group text-sm">
                        Browse Best Sellers
                        <Heart className="w-3 h-3 text-red-500 fill-red-500 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Mobile Search - Visible only on mobile below header */}
            <div className="md:hidden mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1b23] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 w-full shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Category Sidebar (Desktop) or Wrap (Mobile) */}
                <div className="w-full lg:w-64 shrink-0 space-y-2 lg:sticky lg:top-8">
                    <div className="flex items-center gap-2 text-gray-400 dark:text-slate-500 uppercase text-xs font-bold tracking-wider mb-2">
                        <Filter size={12} /> Categories
                    </div>
                    <div className="flex flex-wrap lg:flex-col gap-2">
                        {categories.map((cat: any) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap text-left flex items-center justify-between group ${selectedCategory === cat
                                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20'
                                    : 'bg-white dark:bg-[#1a1b23] text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:text-gray-900 dark:hover:text-white lg:w-full'
                                    }`}
                            >
                                <span className={selectedCategory === cat ? 'translate-x-1 transition-transform' : ''}>
                                    {cat}
                                </span>
                                {selectedCategory === cat && <span className="bg-white/20 p-1 rounded-full"><Check size={12} /></span>}
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
                                    className="bg-white dark:bg-[#1a1b23] rounded-3xl p-4 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-teal-900/10 dark:hover:shadow-black/50 transition-all duration-300 flex flex-col h-full group hover:-translate-y-1"
                                >
                                    {/* Image Container - Clickable */}
                                    <div
                                        className="aspect-square rounded-xl bg-gray-50 dark:bg-white/5 mb-4 flex items-center justify-center relative overflow-hidden cursor-pointer group/image"
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <ShoppingBag size={48} className="text-gray-300 dark:text-slate-600" />
                                        )}

                                        {/* Quick View Overlay */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="bg-white/90 dark:bg-black/80 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transform translate-y-4 group-hover/image:translate-y-0 transition-transform">
                                                <Eye size={14} /> Quick View
                                            </span>
                                        </div>

                                        {/* Wishlist Button */}
                                        <button
                                            onClick={(e) => toggleWishlist(e, product._id)}
                                            className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-all z-10"
                                        >
                                            <Heart size={18} className={wishlist?.some((p: any) => p._id === product._id) ? "fill-red-500 text-red-500" : ""} />
                                        </button>

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

                                        <h3
                                            className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 p-0.5 cursor-pointer hover:text-teal-500 transition-colors"
                                            title={product.name}
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{product.description}</p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-xl font-black text-gray-900 dark:text-white">${product.price}</span>

                                            <button
                                                onClick={() => addToCart(product)}
                                                disabled={product.stock <= 0}
                                                className="bg-gray-900 dark:bg-white text-white dark:text-black w-10 h-10 rounded-xl flex items-center justify-center hover:bg-teal-600 dark:hover:bg-teal-400 dark:hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
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
            <ProductDetailsModal
                product={selectedProduct}
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </div>
    );
};

export default ShopPage;
