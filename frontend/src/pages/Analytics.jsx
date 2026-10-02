import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { statisticsService } from '../services/statistics.service';
import {
  Flame,
  Trophy,
  Target,
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Award,
  Layers,
  ListTodo,
  Sun,
  Moon,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';

// Custom Glassmorphic Tooltip for Recharts
function CustomTooltip({ active, payload, label, unit = '' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1">
        <p className="font-bold text-white border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2" style={{ color: entry.color || entry.fill }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="font-extrabold text-white">
              {entry.value} {unit}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Analytics() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [trendDays, setTrendDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async (days) => {
    setLoading(true);
    setError(null);
    try {
      const data = await statisticsService.getComprehensiveOverview(days);
      setAnalyticsData(data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(trendDays);
  }, [trendDays]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="HAbyTAT"
              className="h-9 w-auto object-contain dark:bg-white/90 dark:px-2 dark:py-1 dark:rounded-xl transition-all"
            />
            <span className="hidden sm:inline-block ml-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              Analytics
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/calendar"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calendar</span>
            </Link>
            <Link
              to="/habits"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ListTodo className="w-3.5 h-3.5 text-slate-400" />
              <span>Habits</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        {/* Title & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <TrendingUp className="w-8 h-8 text-violet-400" />
              <span>Performance Analytics & Insights</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Visualize completion consistency, categorical distribution, and long-term momentum curves.
            </p>
          </div>

          {/* Time range selector for monthly trend */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setTrendDays(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${trendDays === d
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                Last {d} Days
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-9 h-9 text-violet-400 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Computing analytics and rendering charts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400">
            <AlertCircle className="w-7 h-7 mx-auto mb-2" />
            <p className="font-bold">{error}</p>
            <button
              onClick={() => fetchAnalytics(trendDays)}
              className="mt-3 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !analyticsData ? (
          <div className="p-8 text-center text-slate-400">No data available</div>
        ) : (
          <>
            {/* Top 6 KPI Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Success Rate</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {analyticsData.summary.averageCompletionRate}%
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Across all habits</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Logged</span>
                <p className="text-2xl font-black text-indigo-400 mt-1">
                  {analyticsData.summary.totalCompletions}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Completions in DB</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Current</span>
                <p className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  <span>{analyticsData.summary.bestCurrentStreak}d</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Active streak</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All-Time Peak</span>
                <p className="text-2xl font-black text-violet-400 mt-1 flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span>{analyticsData.summary.bestEverStreak}d</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Personal record</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peak Weekday</span>
                <p className="text-lg sm:text-xl font-black text-white mt-1.5 truncate">
                  {analyticsData.summary.bestDay}
                </p>
                <p className="text-[10px] text-emerald-400 mt-0.5 font-semibold">Highest completion</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Category</span>
                <p className="text-lg sm:text-xl font-black text-white mt-1.5 truncate">
                  {analyticsData.summary.topCategory}
                </p>
                <p className="text-[10px] text-indigo-400 mt-0.5 font-semibold">Most consistent</p>
              </div>
            </div>

            {/* CHART ROW 1: Weekly Bar Chart & Category Donut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Weekly Completion Bar Chart (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      Weekly Cadence
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      <span>Past 7 Days Completion</span>
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400">
                    Target: {analyticsData.weekly.totalHabits} habits/day
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.weekly.days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'golden-olive' ? '#4C5C2D' : theme === 'vibrant-red' ? '#830000' : '#1e293b'} vertical={false} />
                      <XAxis dataKey="day" stroke={theme === 'golden-olive' ? '#d5cebe' : theme === 'vibrant-red' ? '#d1d5db' : '#64748b'} fontSize={11} tickLine={false} />
                      <YAxis stroke={theme === 'golden-olive' ? '#d5cebe' : theme === 'vibrant-red' ? '#d1d5db' : '#64748b'} fontSize={11} tickLine={false} domain={[0, Math.max(5, analyticsData.weekly.totalHabits)]} />
                      <Tooltip content={<CustomTooltip unit="habits" />} />
                      <Bar
                        dataKey="completed"
                        name="Completed Habits"
                        fill={theme === 'golden-olive' ? '#FFDE42' : theme === 'vibrant-red' ? '#FF0000' : '#6366f1'}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown Donut Chart (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div className="mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400">
                    Distribution
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-pink-400" />
                    <span>Completions by Category</span>
                  </h2>
                </div>

                <div className="h-56 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.categories}
                        dataKey="completions"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {analyticsData.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip unit="completions" />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Category Legend Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-800">
                  {analyticsData.categories.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-slate-300 font-medium">{cat.name}</span>
                      <span className="text-slate-400 font-bold">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CHART ROW 2: Monthly Rolling Momentum Curve (Area Chart) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                    Long-Term Momentum
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    <span>Rolling Habit Consistency Trend ({trendDays} Days)</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                    <span>Daily Completion Rate (%)</span>
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.monthly.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={theme === 'golden-olive' ? '#FFDE42' : theme === 'vibrant-red' ? '#BC0202' : '#8b5cf6'}
                          stopOpacity={theme === 'golden-olive' ? 0.6 : theme === 'vibrant-red' ? 0.6 : 0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor={theme === 'golden-olive' ? '#313E17' : theme === 'vibrant-red' ? '#830000' : '#8b5cf6'}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'golden-olive' ? '#4C5C2D' : theme === 'vibrant-red' ? '#830000' : '#1e293b'} vertical={false} />
                    <XAxis dataKey="label" stroke={theme === 'golden-olive' ? '#d5cebe' : theme === 'vibrant-red' ? '#d1d5db' : '#64748b'} fontSize={11} tickLine={false} interval="preserveStartEnd" />
                    <YAxis stroke={theme === 'golden-olive' ? '#d5cebe' : theme === 'vibrant-red' ? '#d1d5db' : '#64748b'} fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                    <Tooltip content={<CustomTooltip unit="%" />} />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      name="Completion Rate"
                      stroke={theme === 'golden-olive' ? '#FFDE42' : theme === 'vibrant-red' ? '#FF0000' : '#8b5cf6'}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRate)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART ROW 3: Weekday Performance & Habit Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Day of Week Radar/Bar Chart (5 Cols) */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Day-of-Week Patterns
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Consistency by Weekday</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Identify your strongest and most challenging days of the week.
                  </p>
                </div>

                <div className="h-60 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.dayOfWeek.days} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'golden-olive' ? '#4C5C2D' : theme === 'vibrant-red' ? '#830000' : '#1e293b'} horizontal={false} />
                      <XAxis type="number" stroke={theme === 'golden-olive' ? '#d5cebe' : theme === 'vibrant-red' ? '#d1d5db' : '#64748b'} fontSize={11} tickLine={false} />
                      <YAxis type="category" dataKey="short" stroke={theme === 'golden-olive' ? '#d5cebe' : theme === 'vibrant-red' ? '#d1d5db' : '#64748b'} fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip unit="habits" />} />
                      <Bar dataKey="completions" name="Logged Completions" fill={theme === 'golden-olive' ? '#4C5C2D' : theme === 'vibrant-red' ? '#BC0202' : '#10b981'} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Habit Leaderboard Table (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Leaderboard
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Habit Performance Comparison</span>
                  </h2>
                </div>

                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Habit</th>
                        <th className="py-2.5 px-2">Success Rate</th>
                        <th className="py-2.5 px-2 text-center">Streak</th>
                        <th className="py-2.5 px-2 text-center">Best</th>
                        <th className="py-2.5 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {analyticsData.habitsComparison.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <p className="font-bold text-white">{h.name}</p>
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider"
                              style={{ color: h.color }}
                            >
                              {h.category}
                            </span>
                          </td>

                          <td className="py-3 px-2 w-36">
                            <div className="space-y-1">
                              <span className="font-extrabold text-white">{h.completionRate}%</span>
                              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${h.completionRate}%`,
                                    backgroundColor: h.color,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2 text-center font-bold text-amber-400">
                            {h.currentStreak}d
                          </td>

                          <td className="py-3 px-2 text-center font-bold text-violet-400">
                            {h.longestStreak}d
                          </td>

                          <td className="py-3 px-2 text-right font-extrabold text-slate-200">
                            {h.totalCompletions}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        HAbyTAT SaaS • Built with React, Recharts, Express, Prisma & PostgreSQL
      </footer>
    </div>
  );
}
