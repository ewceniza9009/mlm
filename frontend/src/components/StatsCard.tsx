import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="bg-white dark:bg-[#1a1b23] p-6 rounded-2xl shadow-sm hover:shadow-lg dark:hover:shadow-teal-900/10 border border-gray-200 dark:border-white/5 flex items-center justify-between transition-all duration-300 transform hover:-translate-y-1 group">
      <div>
        <p className="text-gray-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 mb-1">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1">
            <span className={`text-xs font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">vs last period</span>
          </div>
        )}
      </div>
      <div className="p-4 bg-teal-50 dark:bg-white/5 rounded-2xl group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300">
        <Icon className="text-teal-600 dark:text-teal-400 group-hover:text-white w-6 h-6 transition-colors" />
      </div>
    </div>
  );
};

export default StatsCard;
