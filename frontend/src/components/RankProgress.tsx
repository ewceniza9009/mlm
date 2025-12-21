import React from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, DollarSign, Crown, Zap, Gift } from 'lucide-react';

interface RankProgressProps {
    currentRank: string;
    data: {
        nextRank: string;
        percent: number;
        current: { earnings: number; recruits: number };
        target: { earnings: number; recruits: number };
        isCompleted?: boolean;
    };
}

const RankProgress: React.FC<RankProgressProps> = ({ currentRank, data }) => {
    // Graceful fallback if data is missing/loading
    if (!data) return null;

    const { nextRank, percent, current, target, isCompleted } = data;

    const getRankColor = (rank: string) => {
        switch (rank) {
            case 'Bronze': return 'text-amber-700 bg-amber-100 dark:text-amber-500 dark:bg-amber-900/30 ring-amber-500/20';
            case 'Silver': return 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 ring-slate-500/20';
            case 'Gold': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30 ring-yellow-500/20';
            case 'Diamond': return 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/30 ring-cyan-500/20';
            default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-slate-800 ring-gray-500/20';
        }
    };

    const getPerks = (rank: string) => {
        switch (rank) {
            case 'Bronze': return ['10% Direct Bonus', 'Basic Analytics'];
            case 'Silver': return ['15% Direct Bonus', 'Unlocks Matching Bonus (Lvl 1)', 'Silver Badge'];
            case 'Gold': return ['20% Direct Bonus', 'Matching Bonus (Lvl 1-3)', 'Priority Support', 'Gold Badge'];
            case 'Diamond': return ['25% Direct Bonus', 'Global Profit Share', 'Matching Bonus (All Lvls)', 'VIP Events'];
            default: return [];
        }
    };

    const perks = isCompleted ? getPerks(currentRank) : getPerks(nextRank);
    const perkLabel = isCompleted ? `Current ${currentRank} Privileges` : `Unlock ${nextRank} Privileges`;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden flex flex-col">

            {/* Background Decor - Massive Icon */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none transform rotate-12">
                {isCompleted ? <Crown size={300} /> : <TrendingUp size={300} />}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-8 shrink-0">
                <div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                        {isCompleted ? <Crown size={24} className="text-cyan-500" /> : <TrendingUp size={24} className="text-yellow-500" />}
                        {isCompleted ? 'Pinnacle Reached' : `Road to ${nextRank}`}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        {isCompleted ? "You are at the top of the food chain." : "Complete these goals to level up:"}
                    </p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ring-1 ${getRankColor(currentRank)}`}>
                    <Star size={14} className="fill-current" /> {currentRank}
                </div>
            </div>

            {/* Main Content Area - Fills Space, Centered Group */}
            <div className="flex-grow flex flex-col justify-center gap-6 relative z-10 py-4">

                {/* Perks Grid */}
                <div className="bg-gray-50/50 dark:bg-black/20 rounded-2xl p-5 border border-gray-100 dark:border-white/5 backdrop-blur-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4 flex items-center gap-2">
                        <Gift size={12} /> {perkLabel}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {perks.map((perk, i) => (
                            <div key={i} className="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-white/50 dark:hover:bg-white/5">
                                <div className={`p-1.5 rounded-md mt-0.5 shrink-0 ${isCompleted ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
                                    <Zap size={14} />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-200 leading-snug">{perk}</span>
                            </div>
                        ))}
                        {/* Fallback if no perks found */}
                        {perks.length === 0 && (
                            <div className="col-span-2 text-center text-xs text-gray-400 italic py-4">
                                No specific perks defined for this rank yet.
                            </div>
                        )}

                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-5 px-1">
                    {/* Overall Progress Bar */}
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-bold text-gray-700 dark:text-slate-200">
                            <span>Overall Progress</span>
                            <span>{Math.round(percent)}%</span>
                        </div>
                        <div className="h-5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden border border-gray-200 dark:border-slate-600 shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 1 }}
                                className={`h-full rounded-full relative shadow-lg ${isCompleted ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'}`}
                            >
                                <div className="absolute inset-0 bg-white/30 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Detailed Criteria */}
                    <div className="grid grid-cols-1 gap-4">
                        <CriteriaRow
                            label="Earnings Volume"
                            icon={DollarSign}
                            current={current.earnings}
                            target={target.earnings}
                            unit="$"
                            color={isCompleted ? "cyan" : "green"}
                            hideTarget={isCompleted}
                        />

                        <CriteriaRow
                            label="Personal Recruits"
                            icon={Users}
                            current={current.recruits}
                            target={target.recruits}
                            unit=""
                            color={isCompleted ? "cyan" : "blue"}
                            hideTarget={isCompleted}
                        />
                    </div>
                </div>
            </div>

            {/* CSS for Shimmer */}
            <style>{`
                @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
                }
                .animate-shimmer {
                animation: shimmer 3s infinite linear;
                background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
                background-size: 200% 100%;
                }
            `}</style>
        </div>
    );
};

// Sub-component for individual criteria rows
const CriteriaRow = ({ label, icon: Icon, current, target, unit, color, hideTarget }: any) => {
    const isMet = current >= target || hideTarget;
    const pct = hideTarget ? 100 : Math.min(100, (current / target) * 100);

    const colorClasses: any = {
        green: isMet ? 'bg-green-500' : 'bg-green-400',
        blue: isMet ? 'bg-blue-500' : 'bg-blue-400',
        cyan: isMet ? 'bg-cyan-500' : 'bg-cyan-400'
    };

    return (
        <div className="group">
            <div className="flex justify-between mb-1.5 items-end">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200 flex items-center gap-2">
                    <Icon size={14} className="opacity-70" /> {label} {isMet && <span className="text-[10px] bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 rounded py-0.5">DONE</span>}
                </span>
                <span className="text-xs font-mono text-gray-500 dark:text-slate-400">
                    {hideTarget ? (
                        <span className="text-gray-700 dark:text-slate-300 font-bold">{unit}{current.toLocaleString()}</span>
                    ) : (
                        <>{unit}{current.toLocaleString()} <span className="text-gray-300 dark:text-slate-600">/</span> {unit}{target.toLocaleString()}</>
                    )}
                </span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className={`h-full rounded-full ${colorClasses[color] || 'bg-gray-400'}`}
                />
            </div>
        </div>
    );
};

export default RankProgress;
