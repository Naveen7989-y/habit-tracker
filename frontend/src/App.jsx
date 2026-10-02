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
import { Flame, LogOut, Sparkles, User, ShieldCheck, Database, Server, CheckCircle2, ArrowRight } from 'lucide-react';

function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                HabitPulse
              </span>
              <span className="ml-2 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Production Ready v1.0
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all duration-200 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{user?.name || 'Dashboard'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all duration-200"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center items-center">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Full-Stack SaaS Habit Tracking Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Build Unstoppable Daily Momentum.
          </h1>

          <p className="text-slate-400 text-base sm:text-lg">
            Track daily rituals, inspect consistency heatmaps, and visualize your progress with advanced analytics.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 flex items-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 flex items-center gap-2"
                >
                  <span>Sign In with Demo User</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors"
                >
                  Register New Account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Product Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-12">
          <Link
            to={isAuthenticated ? "/habits" : "/login"}
            className="group bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all block"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">Smart Habit Engine</h3>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-400 mb-3">Custom frequencies, color tagging, target counts, and instant completion toggling.</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Active & Operational
            </div>
          </Link>

          <Link
            to={isAuthenticated ? "/calendar" : "/login"}
            className="group bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-violet-500/50 hover:bg-slate-900/90 transition-all block"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">Calendar & Heatmap</h3>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-400 mb-3">Interactive monthly matrix with day inspection and GitHub-style 90-day consistency heatmap.</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Active & Operational
            </div>
          </Link>

          <Link
            to={isAuthenticated ? "/statistics" : "/login"}
            className="group bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/50 hover:bg-slate-900/90 transition-all block"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Server className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">Deep Visual Analytics</h3>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-400 mb-3">Interactive charts with weekly velocity, category distributions, and habit comparisons.</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Active & Operational
            </div>
          </Link>

          <Link
            to={isAuthenticated ? "/settings" : "/login"}
            className="group bg-slate-900/60 border border-emerald-500/40 rounded-2xl p-5 bg-gradient-to-b from-emerald-500/5 to-transparent hover:border-emerald-500/60 hover:bg-slate-900/90 transition-all block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">Enterprise Security</h3>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-400 mb-3">JWT authentication, bcrypt password hashing, Zod validation, and account settings.</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Active & Operational
            </div>
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        HabitPulse SaaS • Built with React, Vite, Express, Prisma & PostgreSQL
      </footer>
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
              path="/habits"
              element={
                <ProtectedRoute>
                  <Habits />
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
