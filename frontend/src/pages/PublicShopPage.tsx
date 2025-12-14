import { useState } from 'react';
import { useGetPublicProductsQuery, useCreateOrderMutation, useResolveReferrerQuery } from '../store/api';
import { ShoppingBag, User, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useUI } from '../components/UIContext';

const PublicShopPage = () => {
    const { showAlert } = useUI();
    const [searchParams] = useSearchParams();
    const refUsername = searchParams.get('ref');

    const { data: products, error } = useGetPublicProductsQuery({});
    const { data: referrer, isError: isRefError } = useResolveReferrerQuery(refUsername, { skip: !refUsername });
    const [createOrder, { isLoading: isOrdering }] = useCreateOrderMutation();

    // Guest Checkout State
    const [checkoutMode, setCheckoutMode] = useState(false);
    const [cart, setCart] = useState<{ productId: string, name: string, price: number, quantity: number }[]>([]);
    const [guestDetails, setGuestDetails] = useState({ name: '', email: '', address: '' });


    const addToCart = (product: any) => {
        setCart([{
            productId: product._id,
            name: product.name,
            price: product.retailPrice || product.price, // Guests pay Retail
            quantity: 1
        }]);
        setCheckoutMode(true);
    };

    const handleBuy = async (e: any) => {
        e.preventDefault();
        if (cart.length === 0) return;

        try {
            const referrerId = referrer ? referrer.id : null;

            await createOrder({
                items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
                isGuest: true,
                guestDetails,
                referrerId: referrerId // Sent to backend
            }).unwrap();

            showAlert('Guest Order Placed Successfully!', 'success');
            setCheckoutMode(false);
            setCart([]);
        } catch (err: any) {
            showAlert(err.data?.message || 'Order Failed', 'error');
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900">
                <h1 className="text-2xl font-bold mb-2">Shop Unavailable</h1>
                <p>This shop is currently closed or disabled.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f111a] p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold">
                            GM
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GenMatrix Store</h1>
                    </div>
                    {refUsername && !isRefError && referrer && (
                        <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                            <User size={16} /> Referring Member: {referrer.firstName} {referrer.lastName}
                        </div>
                    )}
                    {refUsername && isRefError && (
                        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                            <AlertCircle size={16} /> Invalid Referrer
                        </div>
                    )}
                </header>

                {!checkoutMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products?.map((product: any) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={product._id}
                                className="bg-white dark:bg-[#1a1b23] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden"
                            >
                                <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 flex items-center justify-center relative">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <ShoppingBag size={48} className="text-gray-300" />
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{product.name}</h3>
                                    <p className="text-gray-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-teal-600">${product.retailPrice || product.price}</span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                                        >
                                            Buy Now
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto bg-white dark:bg-[#1a1b23] p-8 rounded-2xl shadow-xl">
                        <h2 className="text-xl font-bold mb-6 dark:text-white">Guest Checkout</h2>
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-xl flex justify-between items-center">
                            <div>
                                <p className="font-medium dark:text-white">{cart[0].name}</p>
                                <p className="text-sm text-gray-500">Qty: 1</p>
                            </div>
                            <span className="font-bold dark:text-white">${cart[0].price}</span>
                        </div>

                        <form onSubmit={handleBuy} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    value={guestDetails.name}
                                    onChange={e => setGuestDetails({ ...guestDetails, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                                    value={guestDetails.email}
                                    onChange={e => setGuestDetails({ ...guestDetails, email: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCheckoutMode(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 font-medium dark:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isOrdering}
                                    className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-teal-600 transition-colors"
                                >
                                    {isOrdering ? 'Processing...' : 'Pay Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicShopPage;
