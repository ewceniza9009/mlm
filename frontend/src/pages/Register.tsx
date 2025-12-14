import React, { useState, useEffect } from 'react';
import { useRegisterMutation, useGetPackagesQuery, useGetPublicSettingsQuery } from '../store/api';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

import { useUI } from '../components/UIContext';

const Register = () => {
  const { showAlert } = useUI();
  const { username: referrer } = useParams();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', sponsorUsername: referrer || '', packageName: '' });

  useEffect(() => {
    if (referrer) {
      setFormData(prev => ({ ...prev, sponsorUsername: referrer }));
    }
  }, [referrer]);

  const [register, { isLoading, error }] = useRegisterMutation();
  const { isLoading: isLoadingPackages, data: packages = [] } = useGetPackagesQuery(false);
  const { data: settings } = useGetPublicSettingsQuery();
  const isShopFirst = settings?.shopFirstEnrollment === true;
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.packageName && !isShopFirst) {
      showAlert("Please select a package", 'warning');
      return;
    }
    try {
      await register(formData).unwrap();
      navigate('/login');
      showAlert('Registration successful! Please login.', 'success');
    } catch (err) {
      console.error('Failed to register', err);
      showAlert('Registration failed. Please check the form.', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1014] relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-7xl mx-auto z-10 my-auto p-4 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side: Brand Area & Packages */}
        <div className="text-white space-y-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/30 overflow-hidden">
              <img src="/logo.png" alt="GenMatrix Logo" className="w-full h-full object-cover mix-blend-screen p-1.5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-none">Gen<span className="text-teal-400">Matrix</span></h1>
              <p className="text-xs text-teal-200/80 font-medium tracking-widest uppercase mt-0.5">Registration</p>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mt-4 leading-tight">
            Select Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400">
              Entry Level
            </span>
          </h1>


          {/* Package Selection */}
          {!isShopFirst ? (
            <div className="grid gap-4">
              {isLoadingPackages ? (
                <div className="text-gray-400">Loading packages...</div>
              ) : packages.map((pkg: any) => (
                <div
                  key={pkg._id}
                  onClick={() => setFormData({ ...formData, packageName: pkg.name })}
                  className={`relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 group
                        ${formData.packageName === pkg.name
                      ? 'bg-white/10 border-teal-500 lg:scale-105 shadow-xl shadow-teal-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                    }
                    `}
                >
                  {formData.packageName === pkg.name && (
                    <div className="absolute -top-3 -right-3 bg-teal-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle size={20} fill="currentColor" className="text-teal-500 bg-white rounded-full" />
                    </div>
                  )}
                  {pkg.badge && (
                    <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md border border-purple-500/30">
                      {pkg.badge}
                    </span>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">{pkg.name}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-teal-400">${pkg.price}</div>
                      <div className="text-xs text-slate-400 font-mono">{pkg.pv} PV</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{pkg.description}</p>
                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="space-y-1">
                      {pkg.features.slice(0, 3).map((feat: string, i: number) => (
                        <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-teal-500"></div> {feat}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Shop First Membership</h3>
              <p className="text-slate-400">
                Create your account now and select your products later from the shop to activate your membership.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Register Form */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-teal-500 rounded-3xl blur opacity-20 -z-10"></div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
              <p className="text-slate-400 text-sm">Finishing steps for {isShopFirst ? 'registration' : (formData.packageName ? <span className="text-teal-400 font-bold">{formData.packageName}</span> : 'new member')}</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm text-center">
                Registration failed. {(error as any).data?.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Username</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-3 rounded-xl focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-600"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-3 rounded-xl focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-600"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-3 rounded-xl focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-600"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Sponsor (Optional)</label>
                <input
                  type="text"
                  className={`w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-3 rounded-xl focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-600 ${referrer ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="Sponsor username"
                  value={formData.sponsorUsername}
                  onChange={(e) => setFormData({ ...formData, sponsorUsername: e.target.value })}
                  disabled={!!referrer}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/20 transform transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Creating Account...' : `Join with ${formData.packageName || 'Selection'}`}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-white font-bold hover:text-teal-400 transition-colors">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Register;
