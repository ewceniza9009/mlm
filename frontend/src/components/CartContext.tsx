import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUI } from './UIContext';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    pv: number;
    image?: string;
    quantity: number;
    maxStock: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: any) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, delta: number) => void;
    clearCart: () => void;
    totalPrice: number;
    totalPV: number;
    itemCount: number;
    isCartOpen: boolean;
    toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('genmatrix_cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { showAlert } = useUI();

    useEffect(() => {
        localStorage.setItem('genmatrix_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product._id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    showAlert('Max stock reached', 'warning');
                    return prev;
                }
                showAlert('Updated quantity', 'success');
                return prev.map(item =>
                    item.id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            showAlert('Added to cart', 'success');
            return [...prev, {
                id: product._id,
                name: product.name,
                price: product.price,
                pv: product.pv,
                image: product.image,
                quantity: 1,
                maxStock: product.stock
            }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty > item.maxStock) {
                    showAlert('Max stock reached', 'warning');
                    return item;
                }
                if (newQty < 1) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => setCart([]);
    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalPV = cart.reduce((sum, item) => sum + (item.pv * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart, addToCart, removeFromCart, updateQuantity, clearCart,
            totalPrice, totalPV, itemCount,
            isCartOpen, toggleCart
        }}>
            {children}
        </CartContext.Provider>
    );
};
