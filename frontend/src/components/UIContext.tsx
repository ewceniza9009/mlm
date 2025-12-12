import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, AlertTriangle, Info } from 'lucide-react';

// --- Types ---
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
}

interface UIContextType {
    showAlert: (message: string, type?: ToastType) => void;
    showConfirm: (options: ConfirmOptions) => void;
}

// --- Context ---
const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

// --- Components ---

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        layout
                        className="pointer-events-auto min-w-[300px] max-w-md bg-white dark:bg-[#1a1b23] border border-gray-100 dark:border-white/10 shadow-xl rounded-xl p-4 flex items-start gap-4 backdrop-blur-md"
                    >
                        <div className={`mt-0.5 shrink-0 ${toast.type === 'success' ? 'text-green-500' :
                            toast.type === 'error' ? 'text-red-500' :
                                toast.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                            }`}>
                            {toast.type === 'success' && <CheckCircle size={20} className="fill-current/10" />}
                            {toast.type === 'error' && <AlertCircle size={20} className="fill-current/10" />}
                            {toast.type === 'warning' && <AlertTriangle size={20} className="fill-current/10" />}
                            {toast.type === 'info' && <Info size={20} className="fill-current/10" />}
                        </div>

                        <div className="flex-1 pt-0.5">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{toast.message}</p>
                        </div>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const ConfirmModal = ({
    isOpen,
    options,
    onClose
}: {
    isOpen: boolean;
    options: ConfirmOptions | null;
    onClose: () => void
}) => {
    if (!isOpen || !options) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={options.onCancel || onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-md bg-white dark:bg-[#1e2029] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex gap-4">
                                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${options.type === 'danger'
                                    ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                    : 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400'
                                    }`}>
                                    {options.type === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{options.title}</h3>
                                    <p className="text-gray-600 dark:text-slate-300 leading-relaxed">
                                        {options.message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    if (options.onCancel) options.onCancel();
                                    onClose();
                                }}
                                className="px-4 py-2 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                {options.cancelText || 'Cancel'}
                            </button>
                            <button
                                onClick={() => {
                                    options.onConfirm();
                                    onClose();
                                }}
                                className={`px-6 py-2 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${options.type === 'danger'
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                    : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'
                                    }`}
                            >
                                {options.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// --- Provider ---

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; options: ConfirmOptions | null }>({
        isOpen: false,
        options: null
    });

    const showAlert = (message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const showConfirm = (options: ConfirmOptions) => {
        setConfirmState({ isOpen: true, options });
    };

    const closeConfirm = () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <UIContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <ConfirmModal
                isOpen={confirmState.isOpen}
                options={confirmState.options}
                onClose={closeConfirm}
            />
        </UIContext.Provider>
    );
};
