import { useState } from 'react';
import { useGetLeaderboardQuery } from '../store/api';
import { Medal, User as UserIcon, TrendingUp, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Leaderboard = () => {
    const { data, isLoading } = useGetLeaderboardQuery();
    const [activeTab, setActiveTab] = useState<'recruiters' | 'earners'>('recruiters');

    if (isLoading) return <div className="h-48 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>;

    const list = activeTab === 'recruiters' ? data?.recruiters : data?.earners;

    const getMedal = (index: number) => {
        switch (index) {
            case 0: return <Crown size={20} className="text-yellow-500 fill-yellow-500" />;
            case 1: return <Medal size={20} className="text-gray-400" />;
            case 2: return <Medal size={20} className="text-amber-700" />;
            default: return <span className="text-sm font-bold text-gray-400 w-5 text-center">{index + 1}</span>;
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrophyIcon /> Hall of Fame
                    </h3>
                    <div className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                        This Month
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-slate-700 rounded-lg relative">
                    <button
                        onClick={() => setActiveTab('recruiters')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all z-10 ${activeTab === 'recruiters' ? 'text-gray-900 dark:text-white shadow-sm bg-white dark:bg-slate-600' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                            }`}
                    >
                        <UserIcon size={14} /> Top Recruiters
                    </button>
                    <button
                        onClick={() => setActiveTab('earners')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all z-10 ${activeTab === 'earners' ? 'text-gray-900 dark:text-white shadow-sm bg-white dark:bg-slate-600' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
                            }`}
                    >
                        <TrendingUp size={14} /> Top Earners
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="p-2 space-y-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-1"
                    >
                        {list?.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-xs">
                                No champions yet this month. <br /> Be the first!
                            </div>
                        ) : (
                            list?.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8">
                                            {getMedal(index)}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden border border-gray-100 dark:border-slate-500">
                                                {item.profileImage ? (
                                                    <img src={item.profileImage} alt={item.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                                                        {item.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                                                    {item.username}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-1">
                                                    {activeTab === 'recruiters' ? 'Recruits' : 'Earnings'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                                        {activeTab === 'recruiters' ? item.value : `$${item.value?.toLocaleString()}`}
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-3 border-t border-gray-100 dark:border-slate-700 text-center">
                <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition">
                    View Full Rankings
                </button>
            </div>
        </div>
    );
};

const TrophyIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);

export default Leaderboard;
