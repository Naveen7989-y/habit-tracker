import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { calendarService } from '../services/calendar.service';
import { completionService } from '../services/completion.service';
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Target,
  Trophy,
  BarChart3,
  TrendingUp,
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

export default function CalendarView() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Calendar State
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [calendarData, setCalendarData] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Heatmap State
  const [heatmapDaysRange, setHeatmapDaysRange] = useState(90);
  const [heatmapData, setHeatmapData] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(true);

  // Day Inspector Modal State
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayDetails, setDayDetails] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [togglingHabitId, setTogglingHabitId] = useState(null);

  const [error, setError] = useState(null);

  // Fetch Month Data
  const fetchMonthCalendar = async (year, month) => {
    setCalendarLoading(true);
    try {
      const data = await calendarService.getMonthView(year, month);
      setCalendarData(data);
    } catch (err) {
      setError(err.message || 'Failed to load calendar month');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Fetch Heatmap Data
  const fetchHeatmap = async (days) => {
    setHeatmapLoading(true);
    try {
      const data = await calendarService.getHeatmap(days);
      setHeatmapData(data);
    } catch (err) {
      console.error('Heatmap load error:', err);
    } finally {
      setHeatmapLoading(false);
    }
  };

  // Fetch Day Details for Modal
  const openDayInspector = async (dateStr) => {
    setSelectedDate(dateStr);
    setDayLoading(true);
    try {
      const details = await calendarService.getDayDetails(dateStr);
      setDayDetails(details);
    } catch (err) {
      console.error('Day details load error:', err);
    } finally {
      setDayLoading(false);
    }
  };

  const closeDayInspector = () => {
    setSelectedDate(null);
    setDayDetails(null);
  };

  useEffect(() => {
    fetchMonthCalendar(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchHeatmap(heatmapDaysRange);
  }, [heatmapDaysRange]);

  // Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleTodayMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  // Handle 1-click toggle directly inside Day Inspector
  const handleToggleHabitInModal = async (habit) => {
    if (!dayDetails || !dayDetails.isToday) return;

    const isCurrentlyDone = habit.isCompleted;
    setTogglingHabitId(habit.id);

    // Optimistic modal update
    setDayDetails((prev) => {
      if (!prev) return prev;
      const updatedHabits = prev.habits.map((h) => {
        if (h.id === habit.id) {
          return {
            ...h,
            isCompleted: !isCurrentlyDone,
            completion: !isCurrentlyDone
              ? { completedDate: prev.date, completedAt: new Date().toISOString() }
              : null,
          };
        }
        return h;
      });
      const newCount = isCurrentlyDone
        ? Math.max(0, prev.completedCount - 1)
        : prev.completedCount + 1;
      const newPct = prev.totalHabits > 0
        ? Math.round((newCount / prev.totalHabits) * 100)
        : 0;
      return {
        ...prev,
        completedCount: newCount,
        percentage: newPct,
        habits: updatedHabits,
      };
    });

    try {
      if (isCurrentlyDone) {
        await completionService.undoCompletion(habit.id, dayDetails.date);
      } else {
        await completionService.completeHabit(habit.id, { completedDate: dayDetails.date });
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: [habit.color, '#10b981', '#6366f1', '#ffffff'],
        });
      }
      // Silently refresh month and heatmap
      fetchMonthCalendar(currentYear, currentMonth);
      fetchHeatmap(heatmapDaysRange);
    } catch (err) {
      console.error('Error toggling in modal:', err);
      // Re-fetch accurate day details
      openDayInspector(dayDetails.date);
    } finally {
      setTogglingHabitId(null);
    }
  };

  // Structure heatmap days into weekly columns for GitHub-style layout
  const heatmapWeeks = useMemo(() => {
    if (!heatmapData || !heatmapData.days || heatmapData.days.length === 0) return [];

    const weeks = [];
    let currentWeek = [];

    // Pad first week with empty slots if start day is not Sunday (0)
    const firstDayOfWeek = heatmapData.days[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (const day of heatmapData.days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [heatmapData]);

  // Color classes for GitHub-style heatmap cells
  const getHeatmapColorClass = (level) => {
    if (theme === 'vibrant-red') {
      switch (level) {
        case 1:
          return 'bg-[#3d0000] border-[#830000] text-red-300 hover:border-[#BC0202]';
        case 2:
          return 'bg-[#830000] border-[#BC0202] text-red-200 hover:border-[#FF0000]';
        case 3:
          return 'bg-[#BC0202] border-[#FF0000] text-white hover:brightness-110';
        case 4:
          return 'bg-[#FF0000] border-[#ff4d4d] text-white shadow-sm shadow-red-500/40 hover:bg-[#ff1a1a]';
        default:
          return 'bg-[#000000] border-[#830000]/60 text-slate-500 hover:border-[#830000]';
      }
    }
    switch (level) {
      case 1:
        return 'bg-emerald-950/80 border-emerald-800/40 text-emerald-300 hover:border-emerald-600';
      case 2:
        return 'bg-emerald-800/80 border-emerald-600/50 text-emerald-200 hover:border-emerald-500';
      case 3:
        return 'bg-emerald-600 border-emerald-500 text-white hover:border-emerald-400';
      case 4:
        return 'bg-emerald-400 border-emerald-300 text-slate-950 shadow-sm shadow-emerald-400/40 hover:bg-emerald-300';
      default:
        return 'bg-slate-900 border-slate-800/80 text-slate-600 hover:border-slate-700';
    }
  };

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
            <span className="hidden sm:inline-block ml-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Calendar
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/statistics"
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/habits"
              className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ListTodo className="w-3.5 h-3.5 text-violet-400" />
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

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <CalendarIcon className="w-8 h-8 text-emerald-400" />
              <span>Habit History & Heatmap</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Visualize your daily consistency, explore GitHub-style activity trends, and review past achievements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTodayMonth}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Current Month
            </button>
          </div>
        </div>

        {/* SECTION 1: GitHub-Style Contribution Heatmap */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Consistency Matrix
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">GitHub-Style Activity</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Contribution Heatmap
              </h2>
            </div>

            {/* Range Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 p-1 rounded-xl">
              {[30, 90, 180, 365].map((days) => (
                <button
                  key={days}
                  onClick={() => setHeatmapDaysRange(days)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${heatmapDaysRange === days
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {days === 365 ? '1 Year' : `${days}d`}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap Metrics Bar */}
          {heatmapData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-slate-800/60">
              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Active Days</p>
                <p className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                  {heatmapData.activeDaysCount}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {heatmapData.daysCount}</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Consistency Rate</p>
                <p className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5">
                  {heatmapData.consistencyRate}%
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Current Streak</p>
                <p className="text-lg sm:text-xl font-extrabold text-amber-400 mt-0.5 flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  <span>{heatmapData.currentStreak} days</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Logged</p>
                <p className="text-lg sm:text-xl font-extrabold text-indigo-400 mt-0.5">
                  {heatmapData.totalCompletions}{' '}
                  <span className="text-xs text-slate-400 font-normal">habits</span>
                </p>
              </div>
            </div>
          )}

          {/* Heatmap Grid */}
          {heatmapLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading contribution heatmap...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div className="inline-flex gap-1.5 min-w-max p-1">
                  {heatmapWeeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1.5">
                      {week.map((day, dayIdx) => {
                        if (!day) {
                          return (
                            <div
                              key={`empty-${dayIdx}`}
                              className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-[4px] bg-transparent opacity-0 pointer-events-none"
                            />
                          );
                        }

                        const isCurrentDay = day.isToday;

                        return (
                          <button
                            key={day.date}
                            onClick={() => openDayInspector(day.date)}
                            className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-[4px] border transition-all relative group cursor-pointer ${getHeatmapColorClass(
                              day.level
                            )} ${isCurrentDay ? (theme === 'vibrant-red' ? 'ring-1.5 ring-[#FF0000] ring-offset-1 ring-offset-black' : 'ring-1.5 ring-emerald-400 ring-offset-1 ring-offset-slate-950') : ''}`}
                            title={`${day.date}: ${day.count} habit(s) completed (${day.percentage}%)`}
                          >
                            {/* Hover tooltip for quick preview */}
                            <span className="sr-only">
                              {day.date}: {day.count} completions
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                <span className="text-[11px] text-slate-500">
                  Tip: Click any cell to inspect or log habit completions for that date.
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Less</span>
                  <div className={`w-3 h-3 rounded-[3px] border ${theme === 'vibrant-red' ? 'bg-[#000000] border-[#830000]/60' : 'bg-slate-900 border-slate-800'}`} />
                  <div className={`w-3 h-3 rounded-[3px] border ${theme === 'vibrant-red' ? 'bg-[#3d0000] border-[#830000]' : 'bg-emerald-950/80 border-emerald-800/40'}`} />
                  <div className={`w-3 h-3 rounded-[3px] border ${theme === 'vibrant-red' ? 'bg-[#830000] border-[#BC0202]' : 'bg-emerald-800/80 border-emerald-600/50'}`} />
                  <div className={`w-3 h-3 rounded-[3px] border ${theme === 'vibrant-red' ? 'bg-[#BC0202] border-[#FF0000]' : 'bg-emerald-600 border-emerald-500'}`} />
                  <div className={`w-3 h-3 rounded-[3px] border ${theme === 'vibrant-red' ? 'bg-[#FF0000] border-[#ff4d4d]' : 'bg-emerald-400 border-emerald-300'}`} />
                  <span className="text-[11px] text-slate-400">More</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Monthly Calendar View */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          {/* Calendar Header with Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Monthly Grid
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">Day-by-Day Breakdown</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{calendarData ? `${calendarData.monthName} ${calendarData.year}` : 'Loading...'}</span>
              </h2>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Status Summary Tags */}
          {calendarData && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {calendarData.fullDaysCount} Full Days (100%)
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                {calendarData.partialDaysCount} Partial Days
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 font-medium">
                {calendarData.missedDaysCount} Missed Days
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                {calendarData.totalCompletionsInMonth} Completions Logged
              </span>
            </div>
          )}

          {/* Calendar Grid Table */}
          {calendarLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading month data...</p>
            </div>
          ) : !calendarData ? (
            <div className="p-8 text-center text-slate-400">No data available</div>
          ) : (
            <div className="space-y-2">
              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-800">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty padding slots before first day */}
                {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="min-h-[75px] sm:min-h-[90px] rounded-2xl bg-slate-950/30 border border-slate-900/60 opacity-20 pointer-events-none"
                  />
                ))}

                {/* Actual Days */}
                {calendarData.days.map((day) => {
                  const isToday = day.isToday;
                  const isFuture = day.isFuture;

                  let cardBg = theme === 'vibrant-red'
                    ? 'bg-[#000000] border-[#830000]/80 hover:border-[#BC0202]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700';
                  let statusBadge = null;

                  if (day.status === 'full') {
                    cardBg = theme === 'vibrant-red'
                      ? 'bg-[#830000]/25 border-[#BC0202] hover:border-[#FF0000] shadow-sm shadow-red-500/10'
                      : 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400 shadow-sm shadow-emerald-500/5';
                    statusBadge = (
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${theme === 'vibrant-red' ? 'text-[#FF0000]' : 'text-emerald-400'}`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{day.completedCount}/{day.totalHabits}</span>
                      </span>
                    );
                  } else if (day.status === 'partial') {
                    cardBg = theme === 'vibrant-red'
                      ? 'bg-[#830000]/15 border-[#830000] hover:border-[#BC0202]'
                      : 'bg-indigo-950/30 border-indigo-500/40 hover:border-indigo-400';
                    statusBadge = (
                      <span className={`text-[10px] font-semibold ${theme === 'vibrant-red' ? 'text-[#ff8080]' : 'text-indigo-300'}`}>
                        {day.completedCount}/{day.totalHabits}
                      </span>
                    );
                  } else if (day.status === 'missed') {
                    cardBg = theme === 'vibrant-red'
                      ? 'bg-[#000000] border-[#830000]/50 text-slate-500'
                      : 'bg-slate-950/70 border-slate-800/90 text-slate-500';
                    statusBadge = (
                      <span className="text-[10px] text-slate-500">
                        0/{day.totalHabits}
                      </span>
                    );
                  }

                  if (isToday) {
                    cardBg += theme === 'vibrant-red'
                      ? ' ring-2 ring-[#FF0000] ring-offset-2 ring-offset-black'
                      : ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-950';
                  }

                  return (
                    <button
                      key={day.date}
                      onClick={() => openDayInspector(day.date)}
                      className={`min-h-[75px] sm:min-h-[90px] p-2.5 rounded-2xl border transition-all text-left flex flex-col justify-between group cursor-pointer ${cardBg} ${isFuture ? 'opacity-40 hover:opacity-80' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-sm sm:text-base font-extrabold ${isToday
                              ? (theme === 'vibrant-red' ? 'text-[#FF0000] bg-red-500/20 px-1.5 py-0.5 rounded-lg' : 'text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-lg')
                              : isFuture
                                ? 'text-slate-500'
                                : 'text-slate-200'
                            }`}
                        >
                          {day.day}
                        </span>

                        {isToday && (
                          <span className={`hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full ${theme === 'vibrant-red' ? 'bg-[#FF0000] text-white' : 'bg-indigo-500 text-white'}`}>
                            Today
                          </span>
                        )}
                      </div>

                      <div className="w-full flex items-center justify-between mt-2">
                        {statusBadge}
                        {day.completionRate > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {day.completionRate}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* SECTION 3: Day Inspector Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Day Details
                  </span>
                  {dayDetails?.isToday && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Today
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>

              <button
                onClick={closeDayInspector}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {dayLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading day completions...</p>
              </div>
            ) : !dayDetails ? (
              <p className="text-sm text-slate-400">Failed to load day details.</p>
            ) : (
              <div className="space-y-5 relative z-10">
                {/* Day Summary Progress Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Completion Score</span>
                    <p className="text-2xl font-extrabold text-white mt-0.5">
                      {dayDetails.completedCount} / {dayDetails.totalHabits}{' '}
                      <span className="text-xs text-emerald-400 font-bold">
                        ({dayDetails.percentage}%)
                      </span>
                    </p>
                  </div>

                  <div className="w-28 bg-slate-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${dayDetails.percentage}%` }}
                    />
                  </div>
                </div>

                {/* List of Habits for the Day */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Habits Logged on this Date:
                  </p>

                  {dayDetails.habits.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No active habits found for this period.
                    </p>
                  ) : (
                    dayDetails.habits.map((h) => {
                      const IconComp = ICONS[h.icon] || Activity;
                      const isToggling = togglingHabitId === h.id;

                      return (
                        <div
                          key={h.id}
                          className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${h.isCompleted
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-slate-950/50 border-slate-800/80'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Toggle Button (active only for Today) */}
                            {dayDetails.isToday ? (
                              <button
                                onClick={() => handleToggleHabitInModal(h)}
                                disabled={isToggling}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${h.isCompleted
                                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'
                                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                                  }`}
                                title={h.isCompleted ? 'Click to undo' : 'Click to complete'}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : h.isCompleted ? (
                                  <CheckCircle2 className="w-4.5 h-4.5" />
                                ) : (
                                  <Circle className="w-4.5 h-4.5" />
                                )}
                              </button>
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${h.isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800/60 text-slate-500 border border-slate-800'
                                  }`}
                              >
                                {h.isCompleted ? (
                                  <CheckCircle2 className="w-4.5 h-4.5" />
                                ) : (
                                  <Circle className="w-4.5 h-4.5" />
                                )}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p
                                className={`text-sm font-bold truncate ${h.isCompleted ? 'text-white' : 'text-slate-300'
                                  }`}
                              >
                                {h.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <span
                                  className="font-semibold uppercase tracking-wider"
                                  style={{ color: h.color }}
                                >
                                  {h.category}
                                </span>
                                {h.completion?.note && (
                                  <span className="text-slate-500 italic truncate max-w-[120px]">
                                    "{h.completion.note}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {h.isCompleted ? (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                Completed
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                                {dayDetails.isPast ? 'Missed' : 'Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{dayDetails.isToday ? 'Live changes update your streaks instantly.' : 'Past records are archived for historical tracking.'}</span>
                  <button
                    onClick={closeDayInspector}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        HAbyTAT SaaS • Built with React, Vite, Express, Prisma & PostgreSQL
      </footer>
    </div>
  );
}
