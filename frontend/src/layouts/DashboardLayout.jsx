import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from '../components/ProfileModal';
import Logo from '../components/Logo';
import MobileBottomNav from '../components/fitness/MobileBottomNav';
import {
  LayoutDashboard,
  Dumbbell,
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
  Bell,
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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
      {/* Top Navigation Bar (Hidden on Mobile, Visible on Desktop/Tablet) */}
      <header className="hidden md:block border-b border-[#1D2332] bg-[#080A12]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#111522] transition-colors"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#C8FF00]" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
              <Logo className="h-7 sm:h-8 w-auto object-contain transition-all" />
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <nav className="desktop-navbar-pill hidden md:flex items-center gap-1 bg-[#111522] p-1.5 rounded-2xl border border-[#242A3A]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-150 ${
                    isActive
                      ? 'bg-[#C8FF00] text-[#080A12] shadow-md shadow-[#C8FF00]/20 font-bold'
                      : 'text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29]'
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
            {/* Notification Bell */}
            <div className="relative p-2 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#111522] transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C8FF00] shadow-[0_0_6px_#C8FF00]" />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#111522] transition-colors"
              title={`Switch theme (Current: ${theme})`}
              aria-label="Toggle visual theme"
            >
              <Sun className="w-4 h-4 text-[#C8FF00]" />
            </button>

            {/* User Dropdown (Hidden on Mobile View) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#111522] transition-colors"
                aria-expanded={profileDropdownOpen}
              >
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#C8FF00]/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/50 flex items-center justify-center text-[#F5F7FC] font-bold text-xs shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#39E58C] border-2 border-[#080A12]" />
                </div>

                <span className="hidden sm:inline-block text-xs font-semibold text-[#F5F7FC] max-w-[100px] truncate">
                  {user?.name || 'Account'}
                </span>
                <ChevronDown className="hidden sm:inline-block w-3.5 h-3.5 text-[#70788D]" />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0D101B] border border-[#242A3A] shadow-2xl py-2 z-50 animate-scale-in text-xs">
                    <div className="px-4 py-2.5 border-b border-[#1D2332]">
                      <p className="font-bold text-[#F5F7FC] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[#70788D] truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/settings"
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

                    <div className="border-t border-[#1D2332] my-1" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-[#FF5C67] hover:bg-[#FF5C67]/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1D2332] bg-[#0D101B] px-4 py-3 space-y-1 backdrop-blur-xl animate-fade-in shadow-xl">
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

            <div className="pt-2 mt-2 border-t border-[#1D2332] flex items-center justify-between">
              <span className="text-[11px] text-[#70788D] truncate max-w-[200px]">
                Signed in as <strong className="text-[#F5F7FC]">{user?.name}</strong>
              </span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#FF5C67]/10 text-[#FF5C67] text-xs font-semibold hover:bg-[#FF5C67]/20 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pb-24 md:pb-10 max-w-7xl mx-auto w-full px-3.5 sm:px-6">
        {children}
      </main>

      {/* 4-Item Mobile Navigation Bar */}
      <MobileBottomNav />

      {/* Persistent Desktop Footer */}
      <footer className="border-t border-[#1D2332] py-5 text-center text-xs text-[#70788D] hidden md:block">
        HAbyTAT • Intelligent Fitness, Habit & Nutrition Platform
      </footer>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}
