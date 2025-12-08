import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const Settings = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Local state for spillover preference simulation
  const [preference, setPreference] = useState('weaker_leg'); 

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, call useUpdateProfileMutation from api
    alert('Settings saved (Simulation)');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Account Settings</h1>

      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6">Network Preferences</h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Spillover Placement Strategy</label>
            <p className="text-xs text-slate-500 mb-3">When people register using your main referral link, where should they go?</p>
            <select 
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="left">Extreme Left</option>
              <option value="right">Extreme Right</option>
              <option value="weaker_leg">Auto Balance (Weaker Leg)</option>
              <option value="balanced">Alternate (1 Left, 1 Right)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <button className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-500 transition">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
        <div className="grid grid-cols-2 gap-4 text-slate-300">
           <div>
             <p className="text-xs text-slate-500">Username</p>
             <p className="font-medium">{user?.username}</p>
           </div>
           <div>
             <p className="text-xs text-slate-500">Email</p>
             <p className="font-medium">{user?.email}</p>
           </div>
           <div>
             <p className="text-xs text-slate-500">Role</p>
             <p className="font-medium capitalize">{user?.role}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;