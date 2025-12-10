import React, { useState } from 'react';
import TreeVisualizer from '../components/TreeVisualizer';
import StatsCard from '../components/StatsCard';
import { DollarSign, Users, TrendingUp, Activity, ChevronUp, ChevronDown, UserCheck } from 'lucide-react';

import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetUplineQuery, useGetWalletQuery, useGetTreeQuery } from '../store/api';

const DashboardHome = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: uplineData, isLoading: uplineLoading } = useGetUplineQuery(user?.id, { skip: !user?.id });
  const sponsor = uplineData?.sponsor;

  // Fetch Tree Data for Dashboard
  const { data: treeData, isLoading: treeLoading, error: treeError } = useGetTreeQuery(user?.id);

  const { data: wallet } = useGetWalletQuery(undefined);

  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isOverviewExpanded ? 'Overview' : 'Network Tree'}
        </h1>
        <button
          onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
          className="flex items-center space-x-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 font-medium shadow-sm dark:shadow-none"
        >
          <span>{isOverviewExpanded ? 'Hide Stats' : 'Show Stats'}</span>
          {isOverviewExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Collapsible Stats Section */}
      {isOverviewExpanded && (
        <div className="space-y-6 shrink-0 animation-fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Earnings"
              value={`$${wallet?.balance?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
              trend="Current Balance"
              trendUp={true}
            />
            <StatsCard
              title="Sponsor"
              value={uplineLoading ? '...' : (sponsor?.username || 'Root Account')}
              icon={UserCheck}
              trend={sponsor ? 'Active' : 'System Head'}
              trendUp={true}
            />
            <StatsCard
              title="Left Volume"
              value="Check Tree"
              icon={Activity}
              trend="Live Data"
              trendUp={true}
            />
            <StatsCard
              title="Current Rank"
              value={user?.role === 'admin' ? 'Admin' : 'Member'}
              icon={TrendingUp}
              trend="Upgrade Eligible"
              trendUp={true}
            />
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between shadow-sm dark:shadow-none">
            <div className="text-gray-600 dark:text-slate-300 text-sm">
              <span className="text-gray-500 dark:text-slate-500 mr-2">Your Referral Link:</span>
              <code className="bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded text-teal-600 dark:text-teal-400 border border-gray-200 dark:border-slate-700 select-all">https://mlm.app/ref/{user?.username}</code>
            </div>
            <button
              onClick={() => window.location.href = '/enroll'}
              className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <Users size={18} /> Enroll New Member
            </button>
          </div>
        </div>
      )}

      {/* BIGGER TREE SECTION */}
      <div className={`flex-1 flex flex-col transition-all duration-300 w-full min-h-[500px]`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="text-teal-600 dark:text-teal-400" /> Live Genealogy
          </h2>
          <div className="text-xs text-gray-400 dark:text-slate-400">Scroll to zoom • Drag to move</div>
        </div>

        <div className="flex-1 bg-gray-50 dark:bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-slate-700 relative w-full h-full">
          <TreeVisualizer data={treeData} isLoading={treeLoading} error={treeError} />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;