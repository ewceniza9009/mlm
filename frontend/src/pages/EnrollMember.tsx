import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useRegisterMutation } from '../store/api';
import React, { useState, useEffect } from 'react';
import { UserPlus, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const EnrollMember = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [registerUser, { isLoading }] = useRegisterMutation();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: 'password123', 
    position: 'left'
  });
  
  
  useEffect(() => {
    if (!currentUser) {
       
    }
  }, [currentUser]);

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser?.username) {
        setError("Sponsor information missing. Please reload.");
        return;
    }
    
    try {
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        sponsorUsername: currentUser.username, 
        spilloverPreference: formData.position as 'left' | 'right' | 'weaker_leg', 
        packageName: 'Starter' 
      }).unwrap();
      
      navigate('/');
    } catch (err: any) {
      setError(err.data?.message || 'Enrollment failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
        <div className="flex items-center space-x-3 mb-8">
           <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
              <UserPlus className="text-white w-7 h-7" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-white">Enroll New Member</h1>
             <p className="text-slate-400">Add a new distributor directly to your downline</p>
           </div>
        </div>

        {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center space-x-3 text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">New Username</label>
                <input 
                  type="text" 
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="e.g. johndoe"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="john@example.com"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Temporary Password</label>
                <input 
                  type="text" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Placement Strategy</label>
                <select 
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 transition-colors"
                >
                   <option value="left">Place on Left Leg</option>
                   <option value="right">Place on Right Leg</option>
                   <option value="auto">Auto-Balance (Weak Leg)</option>
                </select>
                <p className="text-xs text-slate-500">Determines where they fall in the binary tree.</p>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
             <div className="flex items-center justify-between">
                <div className="text-sm text-slate-400">
                   Sponsor: <span className="text-white font-medium">{currentUser?.username || 'Loading...'}</span>
                </div>
                <button 
                  type="submit"
                  disabled={isLoading || !currentUser?.username}
                  className={`bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-lg font-bold transition-all transform active:scale-95 flex items-center space-x-2 ${
                    isLoading || !currentUser?.username ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                   {isLoading ? <span>Processing...</span> : (
                     <>
                       <CheckCircle size={20} />
                       <span>Register Member</span>
                     </>
                   )}
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollMember;
