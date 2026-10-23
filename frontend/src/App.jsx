import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Habits from './pages/Habits';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Nutrition from './pages/Nutrition';
import Workouts from './pages/Workouts';
import Logo from './components/Logo';

import { LogOut, User, ArrowRight } from 'lucide-react';

function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div 
      className="h-screen h-[100dvh] w-full bg-[#080A12] text-[#F5F7FC] selection:bg-[#C8FF00] selection:text-[#080A12] relative overflow-hidden flex flex-col justify-between landing-page"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A12]/50 via-transparent to-[#080A12] pointer-events-none" />
      </div>

      {/* Navigation Header */}
      <header className="landing-header relative z-10 flex justify-between items-center px-6 sm:px-8 py-3.5 sm:py-4 max-w-7xl mx-auto w-full shrink-0">
        <Link 
          to="/" 
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
        >
          <Logo variant="dark" className="h-7 sm:h-9 w-auto object-contain transition-all" />
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="liquid-glass rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm text-white hover:scale-[1.03] transition-transform inline-flex items-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-[#C8FF00]" />
                <span>{user?.name || 'Dashboard'}</span>
              </Link>
              <button
                onClick={logout}
                className="liquid-glass rounded-full p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="text-xs sm:text-sm text-[#A1A1AA] hover:text-white transition-colors px-2 py-1"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="liquid-glass rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm text-white hover:scale-[1.03] transition-transform cursor-pointer"
              >
                Begin Journey
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Main Content - Perfectly Centered in Viewport */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto w-full my-auto">
        <h1 
          className="animate-fade-rise text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.02] sm:leading-[0.95] tracking-[-1.5px] sm:tracking-[-2.46px] max-w-5xl font-normal text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Where <em className="not-italic text-[#A1A1AA]">dreams</em> rise <em className="not-italic text-[#A1A1AA]">through the silence.</em>
        </h1>

        <p className="animate-fade-rise-delay text-[#A1A1AA] text-sm sm:text-base md:text-lg max-w-2xl mt-4 sm:mt-6 leading-relaxed font-normal">
          We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.
        </p>

        <div className="animate-fade-rise-delay-2 mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="liquid-glass rounded-full px-8 sm:px-12 py-3.5 sm:py-4 text-sm sm:text-base text-white hover:scale-[1.03] cursor-pointer transition-transform shadow-lg inline-flex items-center gap-2"
          >
            <span>{isAuthenticated ? "Enter Dashboard" : "Begin Journey"}</span>
            <ArrowRight className="w-4 h-4 text-[#C8FF00]" />
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="text-xs sm:text-sm text-[#A1A1AA] hover:text-white transition-colors px-4 py-2"
            >
              Sign In →
            </Link>
          )}
        </div>
      </main>

      {/* Subtle bottom spacing to keep balance */}
      <div className="shrink-0 h-4 pointer-events-none" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
            <Route
              path="/analytics"
              element={
                <Navigate to="/statistics" replace />
              }
            />
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
                <Navigate to="/settings" replace />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
