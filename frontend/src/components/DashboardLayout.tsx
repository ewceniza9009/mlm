import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Network, 
  Wallet, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { api } from '../store/api'; 
import { RootState } from '../store';

const SidebarLink = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
      active 
      ? 'bg-teal-600 text-white' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState()); 
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                <Network className="text-white w-5 h-5" />
             </div>
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
               BinaryMLM
             </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {user?.role === 'admin' ? (
             <>
               <SidebarLink to="/admin" icon={LayoutDashboard} label="Admin Overview" active={location.pathname === '/admin'} />
               <SidebarLink to="/admin/commissions" icon={Wallet} label="Commission Run" active={location.pathname === '/admin/commissions'} />
               {/* Fix 2: Added Wallet link for Admin */}
               <SidebarLink to="/wallet" icon={Wallet} label="My Wallet" active={location.pathname === '/wallet'} />
               <SidebarLink to="/" icon={User} label="Switch to User View" active={false} />
             </>
          ) : (
             <>
               <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
               <SidebarLink to="/network" icon={Network} label="My Network" active={location.pathname === '/network'} />
               <SidebarLink to="/wallet" icon={Wallet} label="Wallet" active={location.pathname === '/wallet'} />
               <SidebarLink to="/settings" icon={Settings} label="Settings" active={location.pathname === '/settings'} />
             </>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 p-3 w-full rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white md:hidden">
            <Menu size={24} />
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                <User className="text-teal-400 w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Scrollable */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;