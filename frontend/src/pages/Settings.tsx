import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useGetConfigQuery, useUpdateConfigMutation, useUpdateProfileMutation } from '../store/api';

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
    pairUnit: 100
  });

  useEffect(() => {
    if (configData) {
      setAdminForm({
        pairRatio: configData.pairRatio,
        commissionValue: configData.commissionValue,
        dailyCapAmount: configData.dailyCapAmount,
        pairUnit: configData.pairUnit
      });
    }
  }, [configData]);

  // User Config State
  const [preference, setPreference] = useState('weaker_leg');

  // Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ spilloverPreference: preference }).unwrap();
      alert('Profile Updated');
    } catch (err) {
      alert('Error updating profile');
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig(adminForm).unwrap();
      alert('System Configuration Updated');
    } catch (err) {
      alert('Error updating config');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>

      {/* ADMIN SECTION */}
      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-teal-500/20 dark:border-teal-700 shadow-lg shadow-teal-500/5 dark:shadow-teal-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-teal-600 w-2 h-8 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Compensation Rules <span className="text-xs bg-teal-100 dark:bg-teal-900 px-2 py-1 rounded text-teal-800 dark:text-teal-200 ml-2">ADMIN</span></h2>
          </div>

          <form onSubmit={handleSaveAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Binary Pair Ratio</label>
              <select
                value={adminForm.pairRatio}
                onChange={(e) => setAdminForm({ ...adminForm, pairRatio: e.target.value })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-teal-500"
              >
                <option value="1:1">1:1 (Balanced)</option>
                <option value="1:2">1:2 (Power Leg)</option>
                <option value="2:1">2:1 (Power Leg)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Pair Unit (PV)</label>
              <input
                type="number"
                value={adminForm.pairUnit}
                onChange={(e) => setAdminForm({ ...adminForm, pairUnit: Number(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Commission per Pair ($)</label>
              <input
                type="number"
                value={adminForm.commissionValue}
                onChange={(e) => setAdminForm({ ...adminForm, commissionValue: Number(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Daily Cap Amount ($)</label>
              <input
                type="number"
                value={adminForm.dailyCapAmount}
                onChange={(e) => setAdminForm({ ...adminForm, dailyCapAmount: Number(e.target.value) })}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-teal-500"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg transition">
                Update System Rules
              </button>
            </div>
          </form>
        </div>
      )}

      {/* USER SECTION */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Network Preferences</h2>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-2">Spillover Placement Strategy</label>
            <p className="text-xs text-gray-500 dark:text-slate-500 mb-3">When people register using your main referral link, where should they go?</p>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="left">Extreme Left</option>
              <option value="right">Extreme Right</option>
              <option value="weaker_leg">Auto Balance (Weaker Leg)</option>
              <option value="balanced">Alternate (1 Left, 1 Right)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <button className="bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition">
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-gray-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>
        <div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-slate-300">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-500">Username</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-500">Email</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-500">Role</p>
            <p className="font-medium capitalize text-gray-900 dark:text-white">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;