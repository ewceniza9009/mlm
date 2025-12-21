import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, Scale } from 'lucide-react';

interface ProfitOptimizerProps {
    leftPV: number;
    rightPV: number;
    pairUnit?: number; // Default 100
    commissionPerPair?: number; // Default 10
}

const ProfitOptimizer: React.FC<ProfitOptimizerProps> = ({
    leftPV,
    rightPV,
    pairUnit = 100,
    commissionPerPair = 10
}) => {

    // Logic
    const isLeftStrong = leftPV > rightPV;
    const isBalanced = leftPV === rightPV;

    const strongLegPV = Math.max(leftPV, rightPV);
    const weakLegPV = Math.min(leftPV, rightPV);

    const targetLeg = isLeftStrong ? 'Right' : (rightPV > leftPV ? 'Left' : 'Both');

    // Calculate Gap to next cycle
    // How many pairs currently?
    // We assume 1:1 ratio for simplicity in this widget
    const currentPairs = Math.floor(weakLegPV / pairUnit);

    // Potential Pairs if we catch up to Strong Leg
    const maxPotentialPairs = Math.floor(strongLegPV / pairUnit);
    const potentialEarnings = (maxPotentialPairs - currentPairs) * commissionPerPair;

    // Immediate Next Goal: Just 1 more pair? Or Fill the gap?
    // "Profit Max" usually means "Fill the Weak Leg to match the Strong Leg" to cash out held volume.

    const volumeNeededToMax = (maxPotentialPairs * pairUnit) - weakLegPV;
    // Actually, we want to match the Strong PV exactly? Or just the units?
    // Usually units.

    if (isBalanced && leftPV === 0) {
        return (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                        <Target className="text-yellow-400" /> Start Your Engines!
                    </h3>
                    <p className="text-indigo-100 text-sm mb-4">
                        Your binary tree is empty. Enrolling your first 2 members (1 Left, 1 Right) is the best way to activate your income.
                    </p>
                    <button onClick={() => window.location.href = '/enroll'} className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition">
                        Enroll First Member
                    </button>
                </div>
                {/* Decor */}
                <div className="absolute -bottom-4 -right-4 opacity-10">
                    <Target size={100} />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Scale size={18} className="text-blue-500" /> Profit Optimizer
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        AI-driven advice to maximize your payout.
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold">
                    Dynamic
                </div>
            </div>

            {isBalanced ? (
                <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-3 text-green-600 dark:text-green-400">
                        <Scale size={32} />
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">Perfectly Balanced</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Both legs are equal. To scale, recruit evenly on both sides or use "Auto" placement.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* The Advice Card */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="text-xs font-medium text-blue-100 uppercase tracking-wider mb-1">
                                High Impact Action
                            </div>
                            <div className="text-lg font-bold flex items-center gap-2">
                                Focus on {targetLeg} Leg <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-blue-100 text-xs mt-2 leading-relaxed">
                                You have <span className="font-bold text-white">{potentialEarnings > 0 ? `$${potentialEarnings}` : 'volume'}</span> waiting in your strong leg.
                                Add <span className="font-bold text-white">{volumeNeededToMax} PV</span> to your {targetLeg} leg to unlock it.
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                            <Zap size={120} />
                        </div>
                    </div>

                    {/* Payout Unlock Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-slate-400">
                            <span>{targetLeg} Leg Goal</span>
                            <span className={weakLegPV > 0 ? "text-indigo-600 dark:text-indigo-400" : ""}>{Math.round((weakLegPV / Math.max(pairUnit, strongLegPV)) * 100)}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(weakLegPV / Math.max(pairUnit, strongLegPV)) * 100}%` }}
                                transition={{ duration: 1 }}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full relative"
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </motion.div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                            <span>Current: {weakLegPV} PV</span>
                            <span>Target: {Math.max(pairUnit, strongLegPV)} PV</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitOptimizer;
