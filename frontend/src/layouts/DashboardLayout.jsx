import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from '../components/ProfileModal';
import NotificationCenter from '../components/NotificationCenter';
import Logo from '../components/Logo';
import MobileBottomNav from '../components/fitness/MobileBottomNav';
import { adminService } from '../services/admin.service';
import {
  LayoutDashboard,
  Dumbbell,
  ListTodo,
  Calendar,
  TrendingUp,
  LogOut,
  User,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
  Settings,
  UtensilsCrossed,
  Bell,
  Shield,
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileDropdownRef = useRef(null);

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [profileDropdownOpen]);

  const fetchUnreadCount = async () => {
    try {
      const items = await adminService.getPublicNotifications();
      if (Array.isArray(items)) {
        let readIds = [];
        try {
          const stored = localStorage.getItem(`readNotificationIds_${user?.id || 'guest'}`);
          readIds = stored ? JSON.parse(stored) : [];
        } catch {
          readIds = [];
        }
        const unread = items.filter((n) => !readIds.includes(n.id)).length;
        setUnreadCount(unread);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Desktop navigation items
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Workouts', path: '/workouts', icon: Dumbbell },
    { label: 'All Habits', path: '/habits', icon: ListTodo },
    { label: 'Nutrition', path: '/nutrition', icon: UtensilsCrossed },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Analytics', path: '/statistics', icon: TrendingUp },
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
    <div className="min-h-screen bg-[#080A12] text-[#F5F7FC] flex flex-col justify-between selection:bg-[#C8FF00] selection:text-[#080A12] transition-colors duration-200">
      {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.2) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#C8FF00] focus:text-[#080A12] focus:font-black focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Top Navigation Bar (Prominent, High-Visibility, Screen-Wide like adyapan.com) */}
      <header className="hidden md:block border-b border-[#1D2332] bg-[#080A12]/95 backdrop-blur-xl sticky top-0 z-40 transition-colors">
        <div className="max-w-screen-2xl 3xl:max-w-[1780px] 4xl:max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 h-20 sm:h-22 flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-2xl text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#111522] transition-colors"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#C8FF00]" /> : <Menu className="w-6 h-6 text-[#F5F7FC]" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
              <Logo className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105" />
            </Link>
          </div>

          {/* Desktop Nav Items (Substantial size, high contrast, clearly visible) */}
          <nav className="desktop-navbar-pill hidden md:flex items-center gap-1.5 bg-[#111522] p-2 rounded-2xl border border-[#242A3A] shadow-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 lg:px-5 py-2.5 rounded-xl text-sm lg:text-[15px] font-bold flex items-center gap-2.5 transition-all duration-150 ${
                    isActive
                      ? 'bg-[#C8FF00] text-[#080A12] shadow-lg shadow-[#C8FF00]/25 font-black scale-[1.02]'
                      : 'text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29]'
                  }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons, Theme Switcher, Notifications & User Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            {/* Prominent Light / Dark Theme Selector Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-[#111522] border border-[#242A3A] shadow-inner">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                    : 'text-[#70788D] hover:text-[#F5F7FC]'
                }`}
                title="Switch to Light Theme"
                type="button"
              >
                <Sun className={`w-4 h-4 ${!isDark ? 'text-amber-500 fill-amber-500' : 'text-[#70788D]'}`} />
                <span className="hidden xl:inline">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#151A29] text-[#C8FF00] border border-[#C8FF00]/40 shadow-[0_0_10px_rgba(200,255,0,0.2)]'
                    : 'text-[#70788D] hover:text-slate-900'
                }`}
                title="Switch to Dark Theme"
                type="button"
              >
                <Moon className={`w-4 h-4 ${isDark ? 'text-[#8B5CF6] fill-[#8B5CF6]/50' : 'text-[#70788D]'}`} />
                <span className="hidden xl:inline">Dark</span>
              </button>
            </div>

            {/* Interactive Admin-Controlled Notification Bell Button */}
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2.5 rounded-2xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#111522] transition-all cursor-pointer border border-[#242A3A] hover:border-[#C8FF00]/40 active:scale-95"
              title="View Broadcast Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#C8FF00] text-[#080A12] text-[10px] font-black flex items-center justify-center shadow-[0_0_8px_#C8FF00] animate-pulse">
                  {unreadCount}
                </span>
              ) : (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#39E58C]" />
              )}
            </button>

            {/* User Dropdown (Hidden on Mobile View) */}
            <div className="relative hidden md:block" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-[#111522] border border-transparent hover:border-[#242A3A] transition-all cursor-pointer"
                aria-expanded={profileDropdownOpen}
              >
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#C8FF00]/50"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 flex items-center justify-center text-[#F5F7FC] font-bold text-sm shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#39E58C] border-2 border-[#080A12]" />
                </div>

                <span className="hidden sm:inline-block text-sm font-bold text-[#F5F7FC] max-w-[120px] truncate">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="hidden sm:inline-block w-4 h-4 text-[#70788D]" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0D101B] border border-[#242A3A] shadow-2xl py-2 z-50 animate-scale-in text-xs">
                    <div className="px-4 py-2.5 border-b border-[#1D2332]">
                      <p className="font-bold text-[#F5F7FC] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[#70788D] truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#C8FF00]" />
                      <span>Profile & Goals</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#8B5CF6]" />
                      <span>Theme & Settings</span>
                    </Link>

                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-[#FFB020] hover:bg-[#FFB020]/10 transition-colors font-semibold"
                      >
                        <Shield className="w-4 h-4 text-[#FFB020]" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="border-t border-[#1D2332] my-1" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-[#FF5C67] hover:bg-[#FF5C67]/10 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1D2332] bg-[#0D101B] px-4 py-3 space-y-1 backdrop-blur-xl animate-fade-in shadow-xl">
            {/* Mobile Theme Toggle */}
            <div className="flex items-center justify-between py-2 px-3 border-b border-[#1D2332] mb-2">
              <span className="text-xs font-bold text-[#A4AABC]">Theme</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    !isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-[#70788D]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'bg-[#151A29] text-[#C8FF00] border border-[#C8FF00]/40' : 'text-[#70788D]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                    isActive
                      ? 'bg-[#C8FF00] text-[#080A12] font-bold'
                      : 'text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile Additional Quick Links */}
            <div className="pt-2 border-t border-[#1D2332] space-y-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setNotificationOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-[#C8FF00]" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#C8FF00] text-[#080A12]">
                    {unreadCount}
                  </span>
                )}
              </button>

              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-3 text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
              >
                <User className="w-4 h-4 text-[#39E58C]" />
                <span>Profile & Goals</span>
              </Link>

              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-3 text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#8B5CF6]" />
                <span>Theme & Settings</span>
              </Link>

              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-3 text-[#FFB020] hover:bg-[#FFB020]/10 transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#FFB020]" />
                  <span>Admin Console</span>
                </Link>
              )}
            </div>

            <div className="pt-2 mt-2 border-t border-[#1D2332] flex items-center justify-between">
              <span className="text-[11px] text-[#70788D] truncate max-w-[200px]">
                Signed in as <strong className="text-[#F5F7FC]">{user?.name}</strong>
              </span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#FF5C67]/10 text-[#FF5C67] text-xs font-semibold hover:bg-[#FF5C67]/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area (Fluid & Responsive: Mobile to 4K Ultrawide) */}
      <main
        id="main-content"
        tabIndex="-1"
        className="flex-1 flex flex-col pb-28 md:pb-12 max-w-screen-2xl 3xl:max-w-[1780px] 4xl:max-w-[2100px] mx-auto w-full px-3.5 sm:px-6 lg:px-8 xl:px-10 focus:outline-none"
      >
        {children}
      </main>

      {/* 4-Item Mobile Navigation Bar */}
      <MobileBottomNav />

      {/* Persistent Desktop Footer */}
      <footer className="border-t border-[#1D2332] py-6 text-center text-xs text-[#70788D] hidden md:block">
        <div className="max-w-screen-2xl 3xl:max-w-[1780px] 4xl:max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between">
          <span>© 2026 HAbyTAT • Intelligent Fitness, Habit & Nutrition Platform</span>
          <div className="flex items-center gap-4 text-[#A4AABC]">
            <Link to="/dashboard" className="hover:text-[#F5F7FC]">Dashboard</Link>
            <Link to="/workouts" className="hover:text-[#F5F7FC]">Workouts</Link>
            <Link to="/habits" className="hover:text-[#F5F7FC]">Habits</Link>
            <Link to="/nutrition" className="hover:text-[#F5F7FC]">Nutrition</Link>
          </div>
        </div>
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Notification Center Popover Drawer */}
      <NotificationCenter
        isOpen={notificationOpen}
        onClose={() => {
          setNotificationOpen(false);
          fetchUnreadCount();
        }}
      />
    </div>
  );
}
