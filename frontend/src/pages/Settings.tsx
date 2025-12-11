import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetConfigQuery, useUpdateConfigMutation, useUpdateProfileMutation } from '../store/api';
import { Sliders, Shield, Network, Settings as SettingsIcon, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [updateProfile] = useUpdateProfileMutation();

  // Admin Config State
  const { data: configData } = useGetConfigQuery(undefined, { skip: user?.role !== 'admin' });
  const [updateConfig] = useUpdateConfigMutation();

  const [adminForm, setAdminForm] = useState({
    pairRatio: '1:1',
    commissionValue: 10,
    dailyCapAmount: 500,
    pairUnit: 100,
    referralBonusPercentage: 10,
    matchingBonusGenerations: '10, 5, 2',
    holdingTankMode: true
  });

  useEffect(() => {
    if (configData) {
      setAdminForm({
        pairRatio: configData.pairRatio,
        commissionValue: configData.commissionValue,
        dailyCapAmount: configData.dailyCapAmount,
        pairUnit: configData.pairUnit,
        referralBonusPercentage: configData.referralBonusPercentage || 10,
        matchingBonusGenerations: configData.matchingBonusGenerations ? configData.matchingBonusGenerations.join(', ') : '10, 5, 2',
        holdingTankMode: configData.holdingTankMode ?? true
      });
    }
  }, [configData]);

  // User Config State
  const [preference, setPreference] = useState('weaker_leg');
  const [enableHoldingTank, setEnableHoldingTank] = useState('system'); // Default to system

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      if (user.spilloverPreference) setPreference(user.spilloverPreference);
      if (user.enableHoldingTank) setEnableHoldingTank(user.enableHoldingTank);
      setEmail(user.email || '');
    }
  }, [user]);

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await updateProfile({
        spilloverPreference: preference,
        enableHoldingTank,
        email: isEditing ? email : undefined,
        password: isEditing && password ? password : undefined
      }).unwrap();

      alert('Profile Updated');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert('Error updating profile');
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...adminForm,
        matchingBonusGenerations: adminForm.matchingBonusGenerations.split(',').map(s => Number(s.trim()))
      };
      await updateConfig(payload).unwrap();
      alert('System Configuration Updated');
    } catch (err) {
      alert('Error updating config');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-12 animate-fade-in-up">
      <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-teal-500/10 p-3 rounded-2xl">
          <SettingsIcon size={32} className="text-teal-500" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings & Preferences</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your account and system configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">

        {/* LEFT COLUMN - USER PREFERENCES */}
        <div className="lg:col-span-1 space-y-8">
          {/* PROFILE CARD */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-4 md:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center gap-4 mb-6 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user?.username}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-slate-400 hover:text-teal-500 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                ) : (
                  <div className="text-gray-700 dark:text-slate-300 font-medium">{user?.email}</div>
                )}
              </div>

              {isEditing && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">New Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </>
              )}

              {!isEditing && (
                <div>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">Member ID</label>
                  <div className="text-gray-700 dark:text-slate-300 font-medium font-mono text-sm">{user?.id}</div>
                </div>
              )}
            </div>
          </div>

          {/* NETWORK PREFERENCES */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-4 md:p-6 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Network size={100} />
            </div>

            <div className="flex items-center gap-2 mb-6 relative z-10">
              <Network className="text-teal-500" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Placement Strategy</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="relative z-10">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Automatic Placement</label>
                <select
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="weaker_leg">Auto Balance (Weaker Leg)</option>
                  <option value="left">Extreme Left</option>
                  <option value="right">Extreme Right</option>
                  <option value="balanced">Alternate (1 Left, 1 Right)</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">Determines where new signups from your referral link are placed.</p>
              </div>

              <div className="mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Holding Tank Preference</label>
                <select
                  value={enableHoldingTank}
                  onChange={(e) => setEnableHoldingTank(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="system">Use System Default</option>
                  <option value="enabled">Always Enabled (Override)</option>
                  <option value="disabled">Always Disabled (Override)</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">
                  "System Default" follows the admin setting. <br />
                  "Always Enabled/Disabled" overrides the admin setting for YOUR recruits.
                </p>
              </div>
              <button className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                <Save size={18} /> Save Preference
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN - ADMIN CONTROLS */}
        {user?.role === 'admin' && (
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 rounded-3xl p-4 md:p-8 text-gray-900 dark:text-white shadow-xl dark:shadow-2xl relative overflow-hidden border border-gray-100 dark:border-slate-700"
            >
              {/* Decorative Background - Dark Mode Only */}
              <div className="hidden dark:block absolute -top-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-purple-500"></div>

              <div className="flex items-center gap-3 mb-6 md:mb-8 relative z-10">
                <div className="bg-teal-50 dark:bg-teal-500/20 p-2 rounded-lg">
                  <Sliders className="text-teal-600 dark:text-teal-400" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Compensation Rules</h2>
                  <p className="text-gray-500 dark:text-slate-400 text-sm">Control the financial engine of the entire network.</p>
                </div>
              </div>

              <form onSubmit={handleSaveAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">

                {/* Binary Settings Group */}
                <div className="md:col-span-2 space-y-2">
                  <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700/50 pb-2">Binary Engine</h3>

                  <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white">Global Holding Tank Mode</label>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Default setting for all users who haven't overridden it. <br />
                        <span className="text-teal-500 font-bold">ON</span> = Recruits go to Tank. <span className="text-red-500 font-bold">OFF</span> = Auto-placed.
                      </p>
                    </div>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                      <input
                        type="checkbox"
                        className="absolute w-full h-full opacity-0 cursor-pointer z-10 left-0 top-0"
                        checked={adminForm.holdingTankMode}
                        onChange={(e) => setAdminForm({ ...adminForm, holdingTankMode: e.target.checked })}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${adminForm.holdingTankMode ? 'bg-teal-500' : 'bg-gray-300 dark:bg-slate-600'}`}></div>
                      <div className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full shadow transform transition-transform duration-200 ease-in-out ${adminForm.holdingTankMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Binary Pair Ratio</label>
                  <select
                    value={adminForm.pairRatio}
                    onChange={(e) => setAdminForm({ ...adminForm, pairRatio: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  >
                    <option value="1:1">1:1 (Balanced)</option>
                    <option value="1:2">1:2 (Power Leg)</option>
                    <option value="2:1">2:1 (Power Leg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Pair Unit (PV)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={adminForm.pairUnit}
                      onChange={(e) => setAdminForm({ ...adminForm, pairUnit: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 pl-4 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                    <span className="absolute right-4 top-3 text-gray-400 dark:text-slate-500 text-xs">PV</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Commission per Pair</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400 dark:text-slate-400">$</span>
                    <input
                      type="number"
                      value={adminForm.commissionValue}
                      onChange={(e) => setAdminForm({ ...adminForm, commissionValue: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 pl-8 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Daily Cap Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400 dark:text-slate-400">$</span>
                    <input
                      type="number"
                      value={adminForm.dailyCapAmount}
                      onChange={(e) => setAdminForm({ ...adminForm, dailyCapAmount: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 pl-8 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Bonus Settings Group */}
                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-slate-700/50 pb-2">Bonus Configuration</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Referral Bonus</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={adminForm.referralBonusPercentage}
                      onChange={(e) => setAdminForm({ ...adminForm, referralBonusPercentage: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 pr-8 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-bold text-lg"
                    />
                    <span className="absolute right-4 top-4 text-gray-400 dark:text-slate-500">%</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">Percentage of Package Price</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Matching Bonus Generations</label>
                  <input
                    type="text"
                    placeholder="10, 5, 2"
                    value={adminForm.matchingBonusGenerations}
                    onChange={(e) => setAdminForm({ ...adminForm, matchingBonusGenerations: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none font-mono tracking-wider"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">Separate percentages with commas (L1, L2, L3...)</p>
                </div>

                <div className="md:col-span-2 pt-6">
                  <button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/20 transform transition-all active:scale-[0.99] flex items-center justify-center gap-3">
                    <Shield size={20} /> Update System Rules
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;