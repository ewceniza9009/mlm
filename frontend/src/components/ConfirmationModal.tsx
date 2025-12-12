import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'success' | 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning',
    isLoading = false
}: ConfirmationModalProps) => {

    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <AlertTriangle size={24} className="text-red-500" />,
                    button: 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20',
                    border: 'border-red-500'
                };
            case 'success':
                return {
                    icon: <CheckCircle size={24} className="text-green-500" />,
                    button: 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20',
                    border: 'border-green-500'
                };
            case 'info':
                return {
                    icon: <Info size={24} className="text-blue-500" />,
                    button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20',
                    border: 'border-blue-500'
                };
            case 'warning':
            default:
                return {
                    icon: <AlertTriangle size={24} className="text-amber-500" />,
                    button: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/20',
                    border: 'border-amber-500' // wrapper ring
                };
        }
    };

    const colors = getColors();

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={!isLoading ? onClose : undefined}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-white dark:bg-[#1e2029] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
                    >
                        <div className="p-6 text-center">
                            <div className={`w-12 h-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-white/5`}>
                                {colors.icon}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {title}
                            </h3>

                            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                                {message}
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isLoading}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${colors.button}`}
                                >
                                    {isLoading ? 'Processing...' : confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
