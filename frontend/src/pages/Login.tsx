import React, { useState } from 'react';
import { useLoginMutation } from '../store/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [login, { isLoading, error }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(formData).unwrap();
      dispatch(setCredentials(user));
      navigate('/');
    } catch (err) {
      console.error('Failed to login', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0f1014] relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="md:flex w-full max-w-5xl mx-auto z-10 my-auto p-4">
        {/* Left Side: Brand Area */}
        <div className="hidden md:flex flex-col justify-center w-1/2 p-10 text-white">
          <div className="mb-4">
            <span className="bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-teal-500/30">
              Network System 2.0
            </span>
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight mb-4 leading-tight">
            Grow your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400">
              Digital Empire
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
            Manage your genealogy, track commissions, and scale your network with our next-gen binary platform.
          </p>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
            {/* Glow Effect behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-purple-600 rounded-3xl blur opacity-20 -z-10"></div>

            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-slate-400 text-sm">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm text-center">
                Invalid credentials. Please try again.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <input
                    type="email"
                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {/* Hover Border Effect */}
                  <div className="absolute inset-0 border border-teal-500/50 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <a href="#" className="text-xs text-teal-400 hover:text-teal-300">Forgot?</a>
                </div>
                <div className="relative group">
                  <input
                    type="password"
                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <div className="absolute inset-0 border border-teal-500/50 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/20 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    Authenticating...
                  </span>
                ) : 'Sign In to Dashboard'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-white font-bold hover:text-teal-400 transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
