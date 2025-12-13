
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useRegisterMutation, useLazySearchDownlineQuery, useGetPackagesQuery, useGetSettingsQuery } from '../store/api';
import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, ArrowLeft, CheckCircle, AlertCircle, Package } from 'lucide-react';

const EnrollMember = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [triggerSearch, { data: searchResults }] = useLazySearchDownlineQuery();
  const { data: packages = [] } = useGetPackagesQuery(false); // Only active packages
  const { data: settings } = useGetSettingsQuery();
  const isShopFirst = settings?.shopFirstEnrollment === true;

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: 'password123',
    position: 'left',
    sponsorUsername: '',
    packageName: ''
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

  // Auto-select first package if available and none selected (ONLY IF NOT SHOP FIRST)
  useEffect(() => {
    if (!isShopFirst && packages.length > 0 && !formData.packageName) {
      setFormData(prev => ({ ...prev, packageName: packages[0].name }));
    }
  }, [packages, isShopFirst]);

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

    if (!formData.packageName && !isShopFirst) {
      setError("Please select a package.");
      return;
    }

    try {
      await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        sponsorUsername: formData.sponsorUsername || currentUser?.username,
        spilloverPreference: formData.position as 'left' | 'right' | 'weaker_leg',
        packageName: formData.packageName
      }).unwrap();

      // Redirect to Network page to see the new member
      navigate('/dashboard/network');
    } catch (err: any) {
      setError(err.data?.message || 'Enrollment failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center space-x-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
            <UserPlus className="text-white w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Enroll New Member</h1>
            <p className="text-sm md:text-base text-gray-500 dark:text-slate-400">Add a new distributor directly to your downline</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center space-x-3 text-red-700 dark:text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* User Details Section */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">1. Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
              </div>
            </div>
          </div>

          {/* Package Selection Section */}
          {!isShopFirst ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">2. Select Package</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {packages.map((pkg: any) => (
                  <div
                    key={pkg._id}
                    onClick={() => setFormData({ ...formData, packageName: pkg.name })}
                    className={`cursor-pointer border rounded-xl p-4 transition-all relative
                              ${formData.packageName === pkg.name
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-500'
                        : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-600'
                      }
                          `}
                  >
                    {formData.packageName === pkg.name && (
                      <div className="absolute top-2 right-2 text-teal-600 dark:text-teal-400">
                        <CheckCircle size={18} fill="currentColor" className="text-teal-500 bg-white dark:bg-transparent rounded-full" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={18} className="text-gray-400" />
                      <span className="font-bold text-gray-900 dark:text-white">{pkg.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-1">${pkg.price}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 font-mono mb-2">{pkg.pv} PV</div>
                    <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-2">{pkg.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl flex items-start gap-3">
              <CheckCircle className="text-teal-500 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-bold text-teal-800 dark:text-teal-300">Shop First Mode Enabled</h3>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                  New member will be placed in <strong>Pending Payment</strong> status. They must purchase products from the shop to activate their position.
                </p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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
                    className="bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 w-full md:w-40"
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
                className={`bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center space-x-2 w-full md:w-auto ${isLoading || !currentUser?.username ? 'opacity-50 cursor-not-allowed' : ''
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
      </div >
    </div >
  );
};

export default EnrollMember;
