
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useRegisterMutation, useLazySearchDownlineQuery } from '../store/api';
import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, ArrowLeft, CheckCircle, AlertCircle, Search } from 'lucide-react';

const EnrollMember = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [triggerSearch, { data: searchResults, isFetching: isSearching }] = useLazySearchDownlineQuery();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: 'password123',
    position: 'left',
    sponsorUsername: ''
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search for Sponsor
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.sponsorUsername && formData.sponsorUsername.length >= 2) {
        triggerSearch(formData.sponsorUsername);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.sponsorUsername, triggerSearch]);

  useEffect(() => {
    if (currentUser?.username) {
      setFormData(prev => ({ ...prev, sponsorUsername: currentUser.username }));
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
        sponsorUsername: formData.sponsorUsername || currentUser?.username,
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
        className="flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
            <UserPlus className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enroll New Member</h1>
            <p className="text-gray-500 dark:text-slate-400">Add a new distributor directly to your downline</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center space-x-3 text-red-700 dark:text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">New Username</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="e.g. johndoe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Temporary Password</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Placement Strategy</label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="left">Place on Left Leg</option>
                <option value="right">Place on Right Leg</option>
                <option value="auto">Auto-Balance (Weak Leg)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-slate-500">Determines where they fall in the binary tree.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              {/* Sponsor Input with Autocomplete */}
              <div className="flex items-center space-x-2 relative" ref={searchRef}>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Sponsor:</label>
                <div className="relative">
                  <input
                    type="text"
                    name="sponsorUsername"
                    value={formData.sponsorUsername}
                    onChange={(e) => {
                      handleChange(e);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (formData.sponsorUsername) setShowDropdown(true);
                    }}
                    autoComplete="off"
                    className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 w-40"
                  />

                  {/* Suggestions Dropdown */}
                  {showDropdown && searchResults && searchResults.length > 0 && (
                    <div className="absolute bottom-full left-0 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 mb-1">
                      {searchResults.map((user: any) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, sponsorUsername: user.username }));
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 text-sm text-gray-700 dark:text-slate-300 flex justify-between items-center border-b border-gray-100 dark:border-slate-700 last:border-0"
                        >
                          <span className="font-bold text-gray-900 dark:text-white">{user.username}</span>
                          <span className="text-xs text-gray-500 dark:text-slate-500">{user.rank || 'Member'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !currentUser?.username}
                className={`bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-lg font-bold transition-all transform active:scale-95 flex items-center space-x-2 ${isLoading || !currentUser?.username ? 'opacity-50 cursor-not-allowed' : ''
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
