import { useState } from 'react';
import StatsCard from '../components/StatsCard';
import { DollarSign, Users, TrendingUp, ChevronUp, ChevronDown, UserCheck, ShoppingBag, Activity } from 'lucide-react';

import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetWalletQuery, useGetEarningsAnalyticsQuery, useGetGrowthAnalyticsQuery, useGetMemberDetailsQuery } from '../store/api';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import { useUI } from '../components/UIContext';
import HypeTicker from '../components/HypeTicker';
import RankProgress from '../components/RankProgress';
import ProfitOptimizer from '../components/ProfitOptimizer';
import Leaderboard from '../components/Leaderboard';
import FomoAlerts from '../components/FomoAlerts';

const DashboardHome = () => {
  const { showAlert } = useUI();
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch Sponsor Details
  const { data: sponsorDetails, isLoading: sponsorLoading } = useGetMemberDetailsQuery(user?.sponsorId, { skip: !user?.sponsorId });


  // Fetch Current User Details (Real-time Stats)
  const { data: myDetails, isLoading: myDetailsLoading } = useGetMemberDetailsQuery(user?.id, { skip: !user?.id, pollingInterval: 30000 });

  // Resolve Sponsor Name (Prefer fresh data from myDetails, fallback to separate query)
  // @ts-ignore
  const freshSponsorName = myDetails?.profile?.sponsor?.username;
  const sponsorName = freshSponsorName || sponsorDetails?.profile?.username;

  // Use fresh data if available, fallback to Redux state
  const currentRank = myDetails?.profile?.rank || user?.rank || 'Member';
  const leftPV = myDetails?.stats?.currentLeftPV ?? user?.currentLeftPV ?? 0;

  const rightPV = myDetails?.stats?.currentRightPV ?? user?.currentRightPV ?? 0;
  // @ts-ignore
  const personalPV = myDetails?.stats?.personalPV ?? user?.personalPV ?? 0;

  // Fetch Analytics Data
  const { data: wallet } = useGetWalletQuery(undefined);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);
  const { data: earningsData, isLoading: earningsLoading } = useGetEarningsAnalyticsQuery(undefined, { pollingInterval: 60000 });
  const { data: growthData, isLoading: growthLoading } = useGetGrowthAnalyticsQuery(undefined, { pollingInterval: 60000 });

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Live Hype Ticker */}
      <div className="-mx-6 -mt-6">
        <HypeTicker />
      </div>

      {/* FOMO Alerts (Critical) */}
      <FomoAlerts />

      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Hello, {user?.username} 👋
          </h1>
          <p className="text-gray-500 dark:text-slate-400">Here's what's happening in your network today.</p>
        </div>

        <button
          onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
          className="flex items-center space-x-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 font-medium shadow-sm dark:shadow-none"
        >
          <span>{isOverviewExpanded ? 'Hide Stats' : 'Show Stats'}</span>
          {isOverviewExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Collapsible Overview Section */}
      {isOverviewExpanded && (
        <div className="space-y-6 shrink-0 animation-fade-in">

          {/* 1. Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6">
            <StatsCard
              title="Total Earnings"
              value={`$${wallet?.balance?.toFixed(2) || '0.00'} `}
              icon={DollarSign}
              trend="Current Balance"
              trendUp={true}
            />
            <StatsCard
              title="Sponsor"
              value={(sponsorLoading || myDetailsLoading) && !sponsorName ? '...' : (sponsorName || 'Root Account')}
              icon={UserCheck}
              trend={sponsorName ? 'Active' : 'System Head'}
              trendUp={true}
            />
            <StatsCard
              title="Left/Right Vol"
              value={`${leftPV} / ${rightPV}`}
              icon={Activity}
              trend="Live"
              trendUp={true}
            />
            <StatsCard
              title="Personal PV"
              value={personalPV}
              icon={ShoppingBag}
              trend="Your Volume"
              trendUp={true}
            />
            <StatsCard
              title="Current Rank"
              value={user?.role === 'admin' ? 'Admin' : currentRank}
              icon={TrendingUp}
              trend="Upgrade Eligible"
              trendUp={true}
            />
          </div >


          {/* Main Content Grid: Left (Stats/Charts) & Right (Actions) */}
          < div className="grid grid-cols-1 xl:grid-cols-3 gap-6" >

            {/* LEFT COLUMN (2/3 Width) - Rank & Charts */}
            < div className="xl:col-span-2 space-y-6" >

              {/* Rank Progress (Road to Legend) - Now at Top */}
              {/* @ts-ignore */}
              {
                myDetails?.stats?.rankProgress && (
                  // @ts-ignore
                  <RankProgress
                    currentRank={user?.rank || 'Bronze'}
                    data={myDetails.stats.rankProgress}
                  />
                )
              }

              {/* Charts Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Earnings Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={18} className="text-teal-500" /> Revenue Trend
                    </h3>
                    <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full">+12.5%</span>
                  </div>
                  <div className="h-[250px] w-full min-w-0 relative overflow-hidden">
                    {earningsLoading ? (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-slate-500 animate-pulse">Loading Chart...</div>
                    ) : (
                      <ResponsiveContainer width="99%" height="100%">
                        <AreaChart data={earningsData || []}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                            itemStyle={{ color: '#14b8a6' }}
                          />
                          <Area type="monotone" dataKey="amount" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Growth Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users size={18} className="text-indigo-500" /> Team Growth
                    </h3>
                  </div>
                  <div className="h-[250px] w-full min-w-0 relative overflow-hidden">
                    {growthLoading ? (
                      <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-slate-500 animate-pulse">Loading Chart...</div>
                    ) : (
                      <ResponsiveContainer width="99%" height="100%">
                        <BarChart data={growthData || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                          />
                          <Bar dataKey="recruits" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Hall of Fame Leaderboard - Moved to Main Column to fill space */}
              <Leaderboard />
            </div>

            {/* RIGHT COLUMN (1/3 Width) - Action Stack */}
            <div className="space-y-6">
              {/* Profit Optimizer / Start Your Engines */}
              <div className="h-auto">
                <ProfitOptimizer
                  leftPV={leftPV}
                  rightPV={rightPV}
                />
              </div>

              {/* Quick Actions Bar (Grow Your Network) */}
              <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-6 rounded-xl text-white shadow-lg shadow-teal-500/20">
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-1">Grow Your Network</h3>
                  <p className="text-teal-100 text-sm">Share your referral link to earn bonuses.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-lg border border-white/20 backdrop-blur-sm w-full">
                    <code className="px-2 py-1 font-mono text-xs select-all truncate flex-1">{import.meta.env.VITE_FRONTEND_URL || window.location.origin}/ref/{user?.username}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/ref/${user?.username}`); showAlert('Copied!', 'success'); }}
                      className="bg-white text-teal-600 px-3 py-1.5 rounded font-bold text-xs hover:bg-teal-50 transition shrink-0"
                    >
                      Copy
                    </button>
                  </div>

                  <button
                    onClick={() => window.location.href = '/enroll'}
                    className="bg-white text-teal-700 hover:bg-teal-50 px-5 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-black/10 w-full"
                  >
                    <Users size={18} /> Enroll New Member
                  </button>
                </div>
              </div>

              {/* Public Shop Link Bar */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-1">Promote Your Shop</h3>
                  <p className="text-indigo-100 text-sm">Share your public shop link.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-lg border border-white/20 backdrop-blur-sm w-full">
                    <code className="px-2 py-1 font-mono text-xs select-all truncate flex-1">{import.meta.env.VITE_FRONTEND_URL || window.location.origin}/store?ref={user?.username}</code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${import.meta.env.VITE_FRONTEND_URL || window.location.origin}/store?ref=${user?.username}`); showAlert('Copied!', 'success'); }}
                      className="bg-white text-indigo-600 px-3 py-1.5 rounded font-bold text-xs hover:bg-indigo-50 transition shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div >
      )}
    </div>
  );
};

export default DashboardHome;