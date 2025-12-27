import { useGetFomoAlertsQuery } from '../store/api';
import { AlertTriangle, Lock, ArrowRight, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FomoAlerts = () => {
    const { data: alerts, isLoading } = useGetFomoAlertsQuery(undefined);

    if (isLoading || !alerts || alerts.length === 0) return null;

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {alerts.map((alert: any, index: number) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`
              relative overflow-hidden rounded-xl border p-5 shadow-lg flex items-start gap-4 transition-all
              ${alert.severity === 'critical'
                                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-100 shadow-red-500/10'
                                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-100 shadow-amber-500/10'
                            }
            `}
                    >
                        {/* Icon */}
                        <div className={`
              p-3 rounded-full shrink-0 shadow-inner
              ${alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200' : 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-200'}
            `}>
                            {alert.type === 'INACTIVE_LOSS' ? <Lock size={24} /> : <AlertTriangle size={24} />}
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h4 className="font-extrabold text-lg flex items-center gap-2">
                                {alert.title}
                                {alert.severity === 'critical' && (
                                    <span className="flex items-center gap-1.5 ml-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded shadow-sm">
                                            Action Req
                                        </span>
                                    </span>
                                )}
                            </h4>
                            <p className="mt-1 opacity-90 leading-relaxed font-medium">
                                {alert.message}
                            </p>

                            {alert.actionUrl && (
                                <button
                                    onClick={() => window.location.href = alert.actionUrl}
                                    className={`
                    mt-4 text-sm font-bold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0
                    ${alert.severity === 'critical'
                                            ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-500/20'
                                            : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-500/20'}
                  `}
                                >
                                    {alert.actionLabel} <ArrowRight size={16} strokeWidth={3} />
                                </button>
                            )}
                        </div>

                        {/* Close / Dismiss Action */}
                        <button className="text-black/20 hover:text-black/40 dark:text-white/20 dark:hover:text-white/40 transition-colors">
                            <XCircle size={20} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default FomoAlerts;
