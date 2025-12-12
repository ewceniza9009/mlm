import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Package,
  CreditCard,
  FileText
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { api } from '../store/api';
import { RootState } from '../store';
import { ThemeToggle } from './ThemeToggle';
import NotificationCenter from './NotificationCenter';

import { ShoppingBag } from 'lucide-react';
import { useGetShopStatusQuery } from '../store/api';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Overview': true,
    'Finance': true, // Expanded by default for visibility
    'Members': false,
    'Catalog': false,
    'System': false
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: shopStatus } = useGetShopStatusQuery({});

  const handleLogout = () => {
    dispatch(logout());
    dispatch(api.util.resetApiState());
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'My Network', path: '/network' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    ...(shopStatus?.enableShop ? [{ icon: ShoppingBag, label: 'Shop', path: '/shop' }] : []),
    { icon: MessageSquare, label: 'Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ].filter(item => {
    if (user?.status === 'pending_payment') {
      return ['/shop', '/wallet'].includes(item.path);
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f1014] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#1a1b23] border-r border-gray-200 dark:border-white/5 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:translate-x-0 flex flex-col shadow-2xl md:shadow-none`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/30 overflow-hidden">
              <img src="/src/assets/logo.png" alt="GenMatrix Logo" className="w-full h-full object-cover mix-blend-screen p-1" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">Gen<span className="text-teal-500">Matrix</span></h1>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-semibold mt-1">Enterprise</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2 flex-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-2">Menu</p>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsSidebarOpen(false);
              }}
              className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-sm ${location.pathname === item.path
                ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
            >
              <item.icon size={20} className={`${location.pathname === item.path ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'}`} />
              <span>{item.label}</span>
              {location.pathname === item.path && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
              )}
            </button>
          ))}

          {user?.role === 'admin' && (
            <div className="mt-8 space-y-4">
              <p className="px-4 text-xs font-semibold text-amber-500/80 uppercase tracking-wider">Administration</p>

              {/* Admin Groups */}
              <div className="space-y-1 mx-2">
                {[
                  {
                    title: 'Overview',
                    items: [
                      { icon: LayoutDashboard, label: 'System Overview', path: '/admin' }
                    ]
                  },
                  {
                    title: 'Finance',
                    items: [
                      { icon: CreditCard, label: 'Run Commissions', path: '/admin/commissions' },
                      { icon: ShoppingBag, label: 'Order Management', path: '/admin/orders' },
                      { icon: Wallet, label: 'Withdrawals', path: '/admin/withdrawals' }
                    ]
                  },
                  {
                    title: 'Members',
                    items: [
                      { icon: Users, label: 'User Management', path: '/admin/users' },
                      { icon: FileText, label: 'KYC Requests', path: '/admin/kyc' },
                      { icon: MessageSquare, label: 'Support Tickets', path: '/admin/support' }
                    ]
                  },
                  {
                    title: 'Catalog',
                    items: [
                      { icon: Package, label: 'Packages', path: '/admin/packages' },
                      ...(shopStatus?.enableShop ? [{ icon: ShoppingBag, label: 'Products', path: '/admin/products' }] : [])
                    ]
                  },
                  {
                    title: 'System',
                    items: [
                      { icon: Settings, label: 'System Settings', path: '/admin/settings' }
                    ]
                  }
                ].map((group) => (
                  <div key={group.title} className="rounded-xl overflow-hidden bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/10">
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-500/10 transition-colors"
                    >
                      <span>{group.title}</span>
                      {expandedGroups[group.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {expandedGroups[group.title] && (
                      <div className="p-1 space-y-1">
                        {group.items.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => {
                              navigate(item.path);
                              setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${location.pathname === item.path
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-100'
                              : 'text-gray-600 dark:text-amber-100/60 hover:bg-amber-100 dark:hover:bg-amber-500/10'
                              }`}
                          >
                            {/*  <item.icon size={16} className={location.pathname === item.path ? 'text-amber-600 dark:text-amber-400' : 'opacity-70'} /> */}
                            <div className={`w-1.5 h-1.5 rounded-full ${location.pathname === item.path ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/20'}`}></div>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

      </aside>

      {/* Sidebar Overlay (Mobile) */}
      {
        isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )
      }

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        {/* Unified Header */}
        <header className="h-16 bg-white/80 dark:bg-[#1a1b23]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <span className="font-bold text-lg text-gray-900 dark:text-white md:hidden">GenMatrix</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationCenter />

            <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1"></div>

            {/* User Profile - Moved from Sidebar */}
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.username || 'User'}</p>
                <div className="flex items-center justify-end gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Online</p>
                </div>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-[#1a1b23]">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 ml-1 text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Gradient Overlay for Main Content Area */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none z-0"></div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 relative z-10 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700">
          <div className="h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div >
  );
};

export default DashboardLayout;