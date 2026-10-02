import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardService } from '../services/dashboard.service';
import { completionService } from '../services/completion.service';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Circle,
  BarChart3,
  TrendingUp,
  Target,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar as CalendarIcon,
  Activity,
  Dumbbell,
  BookOpen,
  Brain,
  Droplets,
  Heart,
  Smile,
  Moon,
  Sun,
  Apple,
  Zap,
  Coffee,
  Loader2,
  AlertCircle,
  Clock,
  ListTodo,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';

const ICONS = {
  Activity,
  Dumbbell,
  BookOpen,
  Brain,
  Sparkles,
  Droplets,
  Heart,
  Smile,
  Moon,
  Apple,
  Target,
  Zap,
  Coffee,
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingHabitId, setTogglingHabitId] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getOverview();
      setDashboardData(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleHabit = async (habit) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isCurrentlyDone = habit.isCompletedToday;
    setTogglingHabitId(habit.id);

    // Optimistic UI update on todayHabits & today progress
    setDashboardData((prev) => {
      if (!prev) return prev;
      const updatedHabits = prev.todayHabits.map((h) => {
        if (h.id === habit.id) {
          const newCurrentStreak = isCurrentlyDone
            ? Math.max(0, h.currentStreak - 1)
            : h.currentStreak + 1;
          const newLongestStreak = Math.max(h.longestStreak, newCurrentStreak);
          return {
            ...h,
            isCompletedToday: !isCurrentlyDone,
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
          };
        }
        return h;
      });

      const newCompletedCount = isCurrentlyDone
        ? Math.max(0, prev.today.completedCount - 1)
        : prev.today.completedCount + 1;
      const newPercentage = prev.today.totalHabits > 0
        ? Math.round((newCompletedCount / prev.today.totalHabits) * 100)
        : 0;

      return {
        ...prev,
        today: {
          ...prev.today,
          completedCount: newCompletedCount,
          percentage: newPercentage,
        },
        metrics: {
          ...prev.metrics,
          todayCompletionRate: newPercentage,
        },
        todayHabits: updatedHabits,
      };
    });

    try {
      if (isCurrentlyDone) {
        await completionService.undoCompletion(habit.id, todayStr);
      } else {
        await completionService.completeHabit(habit.id, { completedDate: todayStr });
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.75 },
          colors: [habit.color, '#10b981', '#6366f1', '#ffffff'],
        });
      }
      // Re-sync with exact backend metrics in background
      const refreshed = await dashboardService.getOverview();
      setDashboardData(refreshed);
    } catch (err) {
      console.error('Error toggling completion:', err);
      fetchDashboard();
    } finally {
      setTogglingHabitId(null);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">HabitPulse</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Dashboard
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/statistics"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/calendar"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calendar</span>
            </Link>
            <Link
              to="/habits"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>All Habits</span>
            </Link>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <Link
              to="/settings"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
              title="Account Settings"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{user?.name}</span>
            </Link>
            <button
              onClick={logout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-9 h-9 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400">
            <AlertCircle className="w-7 h-7 mx-auto mb-2" />
            <p className="font-bold">{error}</p>
            <button
              onClick={fetchDashboard}
              className="mt-3 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Header Greeting & Date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>{dashboardData.greeting}, {dashboardData.userName}</span>
                  <span className="text-2xl animate-bounce">👋</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{formattedDate}</span>
                </p>
              </div>

              <Link
                to="/habits"
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Habit</span>
              </Link>
            </div>

            {/* Today's Progress Card */}
            <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-md">
                  <span className="text-[11px] uppercase font-bold tracking-widest text-indigo-300">
                    Daily Milestone
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Today's Progress
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {dashboardData.today.completedCount === dashboardData.today.totalHabits && dashboardData.today.totalHabits > 0
                      ? 'Incredible work! You have completed all scheduled habits for today 🎉'
                      : `Keep going! ${dashboardData.today.totalHabits - dashboardData.today.completedCount} habit(s) left to crush today.`}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                      {dashboardData.today.percentage}%
                    </span>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      {dashboardData.today.completedCount} / {dashboardData.today.totalHabits} Habits Completed
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-slate-950/70 border border-slate-800 rounded-full h-4 mt-6 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-700 ease-out shadow-sm"
                  style={{ width: `${Math.max(5, dashboardData.today.percentage)}%` }}
                />
              </div>
            </div>

            {/* 5 KPI Metric Cards (Section 7 Specification) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {/* Card 1: Current Streak */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-amber-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Current Streak
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">
                  {dashboardData.metrics.currentStreak}{' '}
                  <span className="text-xs font-normal text-slate-400">days</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Active streak</p>
              </div>

              {/* Card 2: Longest Streak */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-indigo-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Longest Streak
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-2">
                  {dashboardData.metrics.longestStreak}{' '}
                  <span className="text-xs font-normal text-slate-400">days</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Personal record</p>
              </div>

              {/* Card 3: Today's Completion */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Today's Done
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
                  {dashboardData.today.completedCount}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {dashboardData.today.totalHabits}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">{dashboardData.today.percentage}% rate today</p>
              </div>

              {/* Card 4: Weekly Success */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-violet-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Weekly Success
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-violet-400 mt-2">
                  {dashboardData.metrics.weeklySuccessRate}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Past 7 days</p>
              </div>

              {/* Card 5: Monthly Progress */}
              <div className="col-span-2 md:col-span-1 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Monthly Progress
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-2">
                  {dashboardData.metrics.monthlyProgressRate}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Past 30 days</p>
              </div>
            </div>

            {/* Today's Habits Section (Section 7 Specification) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Today's Habits</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Mark off habits as you finish them throughout the day.
                  </p>
                </div>
                <Link
                  to="/habits"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {dashboardData.todayHabits.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">No active habits scheduled</p>
                  <Link
                    to="/habits"
                    className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                  >
                    Add Your First Habit
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {dashboardData.todayHabits.map((habit) => {
                    const IconComp = ICONS[habit.icon] || Activity;
                    const isToggling = togglingHabitId === habit.id;

                    return (
                      <div
                        key={habit.id}
                        className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                          habit.isCompletedToday
                            ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        {/* Left: Icon & Habit Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Interactive 1-click Checkmark Toggle */}
                          <button
                            onClick={() => handleToggleHabit(habit)}
                            disabled={isToggling}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                              habit.isCompletedToday
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-indigo-500 hover:bg-slate-700'
                            }`}
                            title={habit.isCompletedToday ? 'Click to undo' : 'Click to complete'}
                          >
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : habit.isCompletedToday ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          {/* Habit Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`text-sm sm:text-base font-bold truncate transition-colors ${
                                  habit.isCompletedToday
                                    ? 'text-slate-300 line-through decoration-emerald-500/60'
                                    : 'text-white'
                                }`}
                              >
                                {habit.name}
                              </h3>
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: `${habit.color}15`,
                                  color: habit.color,
                                  border: `1px solid ${habit.color}30`,
                                }}
                              >
                                {habit.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                <Target className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{habit.targetCount} {habit.frequency.toLowerCase()}</span>
                              </span>

                              {habit.reminderTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{habit.reminderTime}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Streak Flame Badge */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              habit.currentStreak > 0
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <Flame className={`w-3.5 h-3.5 ${habit.currentStreak > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                            <span>{habit.currentStreak}d streak</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        HabitPulse SaaS • Built with React, Express, Prisma & PostgreSQL
      </footer>
    </div>
  );
}
