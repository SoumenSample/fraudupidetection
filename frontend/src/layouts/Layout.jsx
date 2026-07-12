import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, History, ShieldAlert,
  LogOut, Menu, X, Users, BarChart3, Sun, Moon, ChevronDown
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleDark = () => {
    setDark(!dark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Transaction', path: '/transaction', icon: ArrowLeftRight },
    { name: 'History', path: '/history', icon: History },
    { name: 'Fraud Alerts', path: '/alerts', icon: ShieldAlert },
  ];

  const adminItems = [
    { name: 'Admin Dashboard', path: '/admin', icon: BarChart3 },
    { name: 'All Transactions', path: '/admin/transactions', icon: ArrowLeftRight },
    { name: 'Fraud Logs', path: '/admin/fraud-logs', icon: ShieldAlert },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
  ];

  const currentItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <div className={`min-h-screen flex ${dark ? 'dark' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white">FraudGuard</h1>
            <p className="text-xs text-gray-500">UPI Protection</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {currentItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {isAdmin && (
          <div className="px-4 mt-4">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Admin</div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                {dark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-slide-in">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="font-semibold">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">{user?.role}</span>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
