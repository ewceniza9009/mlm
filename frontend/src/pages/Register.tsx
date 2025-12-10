import React, { useState } from 'react';
import { useRegisterMutation } from '../store/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', sponsorUsername: '' });
  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData).unwrap();
      navigate('/login');
    } catch (err) {
      console.error('Failed to register', err);
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
              Join the Network
            </span>
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight mb-4 leading-tight">
            Start Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-400">
              Journey Today
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
            Create an account to start building your team, earning commissions, and tracking your success.
          </p>
        </div>

        {/* Right Side: Register Card */}
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-teal-500 rounded-3xl blur opacity-20 -z-10"></div>

            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-slate-400 text-sm">Join our growing community</p>
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
                  className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-3 rounded-xl focus:outline-none focus:border-teal-500 transition-all placeholder:text-slate-600"
                  placeholder="Sponsor username"
                  value={formData.sponsorUsername}
                  onChange={(e) => setFormData({ ...formData, sponsorUsername: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-500/20 transform transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Creating Account...' : 'Register Now'}
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
