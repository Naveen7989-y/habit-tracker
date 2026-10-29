import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Habits from './pages/Habits';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Nutrition from './pages/Nutrition';
import Workouts from './pages/Workouts';
import AiCoach from './pages/AiCoach';
import Logo from './components/Logo';
import { adminService } from './services/admin.service';

import { LogOut, User, ArrowRight, Megaphone, Sparkles, X, Sun, Moon } from 'lucide-react';

function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [siteContent, setSiteContent] = useState(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const { theme, isDark, toggleTheme } = useTheme();

  useEffect(() => {
    adminService
      .getPublicContent()
      .then((data) => {
        if (data) setSiteContent(data);
      })
      .catch((err) => console.warn('Using default hero content:', err.message));
  }, []);

  // Dynamic values configured by Administrator CMS
  const heroTitle = siteContent?.heroTitle || 'Where dreams rise through the silence.';
  const heroSubtitle =
    siteContent?.heroSubtitle ||
    "We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.";
  const heroCtaText = siteContent?.heroCtaText || 'Start Journey';
  const heroCtaLink = siteContent?.heroCtaLink || '/register';
  const announcementText = siteContent?.announcementText;
  const isAnnouncementActive = siteContent?.announcementActive && !announcementDismissed && announcementText;

  // Active Promo Ads configured by Admin
  let activeAds = [];
  try {
    const parsed = JSON.parse(siteContent?.adsJson || '[]');
    activeAds = Array.isArray(parsed) ? parsed.filter((a) => a.active) : [];
  } catch {
    activeAds = [];
  }

  return (
    <div
      className={`min-h-screen h-[100dvh] w-full relative overflow-hidden flex flex-col justify-between landing-page transition-colors duration-500 ${
        isDark
          ? 'bg-[#080A12] text-[#F5F7FC] selection:bg-[#C8FF00] selection:text-[#080A12]'
          : 'bg-[#F8FAFC] text-[#0F172A] selection:bg-sky-200 selection:text-slate-900'
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-700 ${
            isDark ? 'opacity-80' : 'opacity-25'
          }`}
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
        <div
          className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
            isDark
              ? 'bg-gradient-to-b from-[#080A12]/50 via-transparent to-[#080A12]'
              : 'bg-gradient-to-b from-white/70 via-white/50 to-[#F8FAFC]'
          }`}
        />
      </div>

      {/* Global Dynamic Announcement Bar (Admin Controlled) */}
      {isAnnouncementActive && (
        <div
          className={`relative z-20 w-full px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-colors ${
            isDark ? 'bg-[#C8FF00] text-[#080A12]' : 'bg-sky-600 text-white'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{announcementText}</span>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="ml-2 hover:opacity-70 p-0.5"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="landing-header relative z-10 flex justify-between items-center px-6 sm:px-8 py-3.5 sm:py-4 max-w-7xl mx-auto w-full shrink-0">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <Logo variant={isDark ? 'dark' : 'light'} className="h-7 sm:h-9 w-auto object-contain transition-all" />
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className={`p-2 px-3 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
                : 'bg-white/90 hover:bg-white border-slate-200 text-slate-800 shadow-xs'
            }`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#C8FF00]" />
            ) : (
              <Moon className="w-4 h-4 text-sky-600" />
            )}
            <span className={`text-[11px] font-medium hidden sm:inline ${
              isDark ? 'text-white/90' : 'text-slate-700'
            }`}>
              {isDark ? 'Dark Theme' : 'Light Theme'}
            </span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm hover:scale-[1.03] transition-transform inline-flex items-center gap-2 cursor-pointer font-medium ${
                  isDark
                    ? 'liquid-glass text-white'
                    : 'bg-white/95 text-slate-900 border border-slate-200 shadow-sm hover:bg-white'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${isDark ? 'text-[#C8FF00]' : 'text-sky-600'}`} />
                <span className={isDark ? 'text-white' : 'text-slate-900 font-medium'}>{user?.name || 'Dashboard'}</span>
              </Link>
              <button
                onClick={logout}
                className={`rounded-full p-2 transition-colors cursor-pointer ${
                  isDark
                    ? 'liquid-glass text-slate-300 hover:text-white'
                    : 'bg-white/90 text-slate-600 hover:text-slate-950 border border-slate-200 shadow-xs'
                }`}
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className={`text-xs sm:text-sm transition-colors px-2 py-1 font-medium ${
                  isDark ? 'text-[#A1A1AA] hover:text-white' : 'text-slate-700 hover:text-slate-950 font-semibold'
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm hover:scale-[1.03] transition-transform cursor-pointer font-medium shadow-sm ${
                  isDark
                    ? 'liquid-glass text-white'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                }`}
              >
                Start Journey
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto w-full my-auto">
        <h1
          className={`animate-fade-rise text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.02] sm:leading-[0.95] tracking-[-1.5px] sm:tracking-[-2.46px] max-w-5xl font-normal transition-colors duration-500 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {heroTitle}
        </h1>

        <p
          className={`hero-subtitle animate-fade-rise-delay text-sm sm:text-base md:text-lg max-w-2xl mt-4 sm:mt-6 leading-relaxed font-normal transition-colors duration-500 ${
            isDark ? 'text-[#A1A1AA]' : 'text-slate-600'
          }`}
        >
          {heroSubtitle}
        </p>

        <div className="animate-fade-rise-delay-2 mt-6 sm:mt-8 flex items-center justify-center">
          <Link
            to={isAuthenticated ? '/dashboard' : heroCtaLink}
            className={`rounded-full px-8 sm:px-12 py-3.5 sm:py-4 text-sm sm:text-base hover:scale-[1.03] cursor-pointer transition-all shadow-lg inline-flex items-center gap-2 font-medium ${
              isDark
                ? 'liquid-glass text-white shadow-[#C8FF00]/10 border border-white/15'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
            }`}
          >
            <span>{isAuthenticated ? 'Enter Dashboard' : heroCtaText}</span>
            <ArrowRight className={`w-4 h-4 ${isDark ? 'text-[#C8FF00]' : 'text-sky-300'}`} />
          </Link>
        </div>

        {/* Dynamic Promotional Ad Pill */}
        {activeAds.length > 0 && (
          <div className="mt-8 flex items-center justify-center">
            <Link
              to={activeAds[0].ctaLink || '/register'}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs transition-all backdrop-blur-md ${
                isDark
                  ? 'bg-[#111522]/80 hover:bg-[#151A29] border-[#242A3A] text-[#A4AABC] hover:text-[#F5F7FC]'
                  : 'bg-white/80 hover:bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
              }`}
            >
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isDark ? 'bg-[#C8FF00]/15 text-[#C8FF00]' : 'bg-sky-100 text-sky-700'
                }`}
              >
                {activeAds[0].badge || 'Promo'}
              </span>
              <span>{activeAds[0].title}</span>
              <ArrowRight className={`w-3 h-3 ${isDark ? 'text-[#C8FF00]' : 'text-sky-600'}`} />
            </Link>
          </div>
        )}
      </main>

      {/* Subtle bottom spacing */}
      <div className="shrink-0 h-4 pointer-events-none" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            
            {/* Standard User Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Secret Dedicated Admin Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* User Application Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts"
              element={
                <ProtectedRoute>
                  <Workouts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/habits"
              element={
                <ProtectedRoute>
                  <Habits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nutrition"
              element={
                <ProtectedRoute>
                  <Nutrition />
                </ProtectedRoute>
              }
            />
            <Route
              path="/synapse"
              element={
                <ProtectedRoute>
                  <AiCoach />
                </ProtectedRoute>
              }
            />
            <Route path="/coach" element={<Navigate to="/synapse" replace />} />
            <Route path="/ai-agent" element={<Navigate to="/synapse" replace />} />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/statistics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route path="/analytics" element={<Navigate to="/statistics" replace />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

