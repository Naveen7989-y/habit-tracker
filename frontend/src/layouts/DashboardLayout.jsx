import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from '../components/ProfileModal';
import Logo from '../components/Logo';
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  TrendingUp,
  LogOut,
  User,
  Sun,
  Menu,
  X,
  ChevronDown,
  Settings,
  UtensilsCrossed,
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'All Habits', path: '/habits', icon: ListTodo },
    { label: 'Nutrition', path: '/nutrition', icon: UtensilsCrossed },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Analytics', path: '/statistics', icon: TrendingUp },
  ];

  const bottomNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Habits', path: '/habits', icon: ListTodo },
    { label: 'Nutrition', path: '/nutrition', icon: UtensilsCrossed },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Analytics', path: '/statistics', icon: TrendingUp },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];


  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isRouteActive = (path) => {
    if (path === '/statistics') {
      return location.pathname === '/statistics' || location.pathname === '/analytics';
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <Logo className="h-8 sm:h-9 w-auto object-contain transition-all" />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="desktop-navbar-pill hidden md:flex items-center gap-1.5 bg-[#EBFDEA] p-1 rounded-2xl border border-[#C4F7CA]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & User Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
              title={`Switch theme (Current: ${theme === 'midnight-sea' ? 'Midnight Sea' : (theme === 'warm-horizon' ? 'Warm Horizon' : (theme === 'fresh-sky' ? 'Fresh Sky' : 'Soft Sunrise'))})`}
              aria-label="Toggle visual theme"
            >
              <Sun className={`w-4 h-4 ${
                theme === 'midnight-sea' ? 'text-[#068FFF]' : (theme === 'warm-horizon' ? 'text-[#F2765E]' : (theme === 'fresh-sky' ? 'text-sky-400' : 'text-amber-500'))
              }`} />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-800"
                aria-label="User account menu"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold ring-1 ring-indigo-500/40">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-medium text-slate-200 max-w-[120px] truncate">
                  {user?.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs space-y-1 animate-scale-in">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Edit Profile</span>
                    </button>

                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full px-3 py-2 rounded-xl text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Account Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-dropdown md:hidden border-t border-slate-800/80 px-4 py-3 space-y-1 backdrop-blur-xl animate-fade-in shadow-xl">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                Signed in as <strong className="text-white">{user?.name}</strong>
              </span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area: padded at bottom on mobile to accommodate native bottom nav */}
      <div className="flex-1 flex flex-col pb-20 md:pb-0">{children}</div>

      {/* Native Mobile Bottom Navigation Bar (Thumb friendly for small screens) */}
      <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1 flex items-center justify-around shadow-2xl pb-safe">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isRouteActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all duration-150 ${
                isActive
                  ? 'text-indigo-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 transition-transform ${
                  isActive ? 'stroke-[2.5px] scale-110 text-indigo-400' : 'stroke-[1.75px]'
                }`}
              />
              <span className="truncate max-w-[56px] text-center">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Persistent Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 hidden md:block">
        HAbyTAT SaaS • Built with React, Vite, Express, Prisma & PostgreSQL
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}
