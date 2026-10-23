import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { calendarService } from '../services/calendar.service';
import { completionService } from '../services/completion.service';
import DashboardLayout from '../layouts/DashboardLayout';
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

  // Color classes for GitHub-style heatmap cells (Unified Dark Fitness Neon Lime Palette)
  const getHeatmapColorClass = (level) => {
    switch (level) {
      case 1:
        return 'bg-[#C8FF00]/20 border-[#C8FF00]/35 hover:border-[#C8FF00]';
      case 2:
        return 'bg-[#C8FF00]/45 border-[#C8FF00]/55 hover:border-[#C8FF00]';
      case 3:
        return 'bg-[#C8FF00]/75 border-[#C8FF00]/85 text-[#080A12] font-bold hover:brightness-105';
      case 4:
        return 'bg-[#C8FF00] border-[#C8FF00] text-[#080A12] font-black shadow-[0_0_8px_rgba(200,255,0,0.35)] hover:brightness-105';
      default:
        return 'bg-[#0D101B] border-[#1D2332] text-[#70788D] hover:border-[#C8FF00]/40';
    }
  };

  return (
    <DashboardLayout>
      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 w-full space-y-6 sm:space-y-8">
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F7FC] flex items-center gap-2.5">
              <CalendarIcon className="w-8 h-8 text-[#C8FF00]" />
              <span>Habit History & Heatmap</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#A4AABC] mt-1">
              Visualize your daily consistency, explore activity trends, and review past achievements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTodayMonth}
              className="px-3.5 py-1.5 rounded-xl bg-[#111522] border border-[#242A3A] hover:border-[#C8FF00]/50 text-xs font-semibold text-[#F5F7FC] transition-colors"
            >
              Current Month
            </button>
          </div>
        </div>

        {/* SECTION 1: GitHub-Style Contribution Heatmap */}
        <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-6 md:p-7 shadow-xl space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8FF00]">
                  Consistency Matrix
                </span>
                <span className="text-xs text-[#70788D]">•</span>
                <span className="text-xs text-[#A4AABC]">Activity Heatmap</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F7FC] mt-0.5">
                Contribution Heatmap
              </h2>
            </div>

            {/* Range Selector */}
            <div className="flex items-center gap-1 bg-[#0D101B] border border-[#242A3A] p-1 rounded-xl self-start sm:self-auto">
              {[30, 90, 180, 365].map((days) => (
                <button
                  key={days}
                  onClick={() => setHeatmapDaysRange(days)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${heatmapDaysRange === days
                      ? 'bg-[#C8FF00] text-[#080A12] font-bold shadow-sm'
                      : 'text-[#A4AABC] hover:text-[#F5F7FC]'
                    }`}
                >
                  {days === 365 ? '1 Year' : `${days}d`}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap Metrics Bar */}
          {heatmapData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-3 border-y border-[#242A3A]">
              <div>
                <p className="text-[10px] sm:text-[11px] text-[#A4AABC] uppercase font-semibold">Active Days</p>
                <p className="text-base sm:text-xl font-extrabold text-[#F5F7FC] mt-0.5">
                  {heatmapData.activeDaysCount}{' '}
                  <span className="text-xs text-[#70788D] font-normal">/ {heatmapData.daysCount}</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] sm:text-[11px] text-[#A4AABC] uppercase font-semibold">Consistency Rate</p>
                <p className="text-base sm:text-xl font-extrabold text-[#C8FF00] mt-0.5">
                  {heatmapData.consistencyRate}%
                </p>
              </div>

              <div>
                <p className="text-[10px] sm:text-[11px] text-[#A4AABC] uppercase font-semibold">Current Streak</p>
                <p className="text-base sm:text-xl font-extrabold text-[#FFBF47] mt-0.5 flex items-center gap-1">
                  <Flame className="w-4 h-4 shrink-0 text-[#FFBF47]" />
                  <span>{heatmapData.currentStreak} days</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] sm:text-[11px] text-[#A4AABC] uppercase font-semibold">Total Logged</p>
                <p className="text-base sm:text-xl font-extrabold text-[#8B5CF6] mt-0.5">
                  {heatmapData.totalCompletions}{' '}
                  <span className="text-xs text-[#70788D] font-normal">habits</span>
                </p>
              </div>
            </div>
          )}

          {/* Heatmap Grid */}
          {heatmapLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 text-[#C8FF00] animate-spin" />
              <p className="text-xs text-[#A4AABC]">Loading contribution heatmap...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto pb-2 touch-scroll scrollbar-thin">
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
                            )} ${isCurrentDay ? 'ring-2 ring-[#C8FF00] ring-offset-1 ring-offset-[#080A12]' : ''}`}
                            title={`${day.date}: ${day.count} habit(s) completed (${day.percentage}%)`}
                          >
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#A4AABC] pt-2">
                <span className="text-[11px] text-[#70788D]">
                  Tip: Click any cell to inspect or log habit completions for that date.
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#70788D]">Less</span>
                  <div className="w-3 h-3 rounded-[3px] border bg-[#0D101B] border-[#1D2332]" />
                  <div className="w-3 h-3 rounded-[3px] border bg-[#C8FF00]/20 border-[#C8FF00]/35" />
                  <div className="w-3 h-3 rounded-[3px] border bg-[#C8FF00]/45 border-[#C8FF00]/55" />
                  <div className="w-3 h-3 rounded-[3px] border bg-[#C8FF00]/75 border-[#C8FF00]/85" />
                  <div className="w-3 h-3 rounded-[3px] border bg-[#C8FF00] border-[#C8FF00]" />
                  <span className="text-[11px] text-[#70788D]">More</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Monthly Calendar View */}
        <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-3.5 sm:p-6 lg:p-7 shadow-xl space-y-5 sm:space-y-6">
          {/* Calendar Header with Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8FF00]">
                  Monthly Grid
                </span>
                <span className="text-xs text-[#70788D]">•</span>
                <span className="text-xs text-[#A4AABC]">Day-by-Day Breakdown</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F5F7FC] mt-0.5 flex items-center gap-2">
                <span>{calendarData ? `${calendarData.monthName} ${calendarData.year}` : 'Loading...'}</span>
              </h2>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-[#0D101B] border border-[#242A3A] hover:border-[#C8FF00]/50 text-[#A4AABC] hover:text-[#F5F7FC] transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-[#0D101B] border border-[#242A3A] hover:border-[#C8FF00]/50 text-[#A4AABC] hover:text-[#F5F7FC] transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Status Summary Tags */}
          {calendarData && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30 font-medium">
                {calendarData.fullDaysCount} Full Days (100%)
              </span>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-medium">
                {calendarData.partialDaysCount} Partial Days
              </span>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#151A29] text-[#70788D] border border-[#242A3A] font-medium">
                {calendarData.missedDaysCount} Missed Days
              </span>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#151A29] text-[#F5F7FC] border border-[#242A3A] font-medium">
                {calendarData.totalCompletionsInMonth} Completions Logged
              </span>
            </div>
          )}

          {/* Calendar Grid Table */}
          {calendarLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-[#C8FF00] animate-spin" />
              <p className="text-xs text-[#A4AABC]">Loading month data...</p>
            </div>
          ) : !calendarData ? (
            <div className="p-8 text-center text-[#A4AABC]">No data available</div>
          ) : (
            <div className="space-y-2">
              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-[#70788D] uppercase tracking-wider py-1 border-b border-[#242A3A]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Empty padding slots before first day */}
                {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="min-h-[50px] sm:min-h-[75px] md:min-h-[90px] rounded-xl sm:rounded-2xl bg-[#0D101B]/40 border border-[#1D2332] opacity-30 pointer-events-none"
                  />
                ))}

                {/* Actual Days */}
                {calendarData.days.map((day) => {
                  const isToday = day.isToday;
                  const isFuture = day.isFuture;

                  let cardBg = 'bg-[#0D101B] border-[#242A3A] hover:border-[#C8FF00]/50 text-[#F5F7FC]';
                  let statusBadge = null;

                  if (day.status === 'full') {
                    cardBg = 'bg-[#151A29] border-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.12)] text-[#F5F7FC]';
                    statusBadge = (
                      <span className="text-[10px] font-bold flex items-center gap-0.5 text-[#C8FF00]">
                        <CheckCircle2 className="w-3 h-3 text-[#C8FF00]" />
                        <span>{day.completedCount}/{day.totalHabits}</span>
                      </span>
                    );
                  } else if (day.status === 'partial') {
                    cardBg = 'bg-[#151A29] border-[#8B5CF6]/50 hover:border-[#8B5CF6] text-[#F5F7FC]';
                    statusBadge = (
                      <span className="text-[10px] font-semibold text-[#8B5CF6]">
                        {day.completedCount}/{day.totalHabits}
                      </span>
                    );
                  } else if (day.status === 'missed') {
                    cardBg = 'bg-[#0D101B] border-[#242A3A] text-[#70788D]';
                    statusBadge = (
                      <span className="text-[10px] font-medium text-[#70788D]">
                        0/{day.totalHabits}
                      </span>
                    );
                  }

                  if (isToday) {
                    cardBg += ' ring-2 ring-[#C8FF00] ring-offset-2 ring-offset-[#080A12]';
                  }

                  return (
                    <button
                      key={day.date}
                      onClick={() => openDayInspector(day.date)}
                      className={`min-h-[50px] sm:min-h-[75px] md:min-h-[90px] p-1 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all text-left flex flex-col justify-between group cursor-pointer ${cardBg} ${isFuture ? 'opacity-50 hover:opacity-80' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs sm:text-base font-extrabold ${isToday
                              ? 'text-[#080A12] bg-[#C8FF00] px-1.5 py-0.5 rounded-lg font-black'
                              : isFuture
                                ? 'text-[#70788D]'
                                : 'text-[#F5F7FC]'
                            }`}
                        >
                          {day.day}
                        </span>

                        {isToday && (
                          <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#C8FF00] text-[#080A12]">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="w-full flex items-center justify-between mt-2">
                        {statusBadge}
                        {day.completionRate > 0 && (
                          <span className="text-[10px] font-bold text-[#A4AABC]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080A12]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0D101B] border border-[#242A3A] rounded-[24px] w-full max-w-lg shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#C8FF00]/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#C8FF00]" />
                  <span className="text-xs uppercase font-bold text-[#A4AABC] tracking-wider">
                    Day Details
                  </span>
                  {dayDetails?.isToday && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#C8FF00]/20 text-[#C8FF00] border border-[#C8FF00]/30">
                      Today
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#F5F7FC] mt-1">
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
                className="p-1.5 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {dayLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-[#C8FF00] animate-spin" />
                <p className="text-xs text-[#A4AABC]">Loading day completions...</p>
              </div>
            ) : !dayDetails ? (
              <p className="text-sm text-[#A4AABC]">Failed to load day details.</p>
            ) : (
              <div className="space-y-5 relative z-10">
                {/* Day Summary Progress Card */}
                <div className="bg-[#151A29] border border-[#242A3A] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#A4AABC]">Completion Score</span>
                    <p className="text-2xl font-extrabold text-[#F5F7FC] mt-0.5">
                      {dayDetails.completedCount} / {dayDetails.totalHabits}{' '}
                      <span className="text-xs text-[#C8FF00] font-bold">
                        ({dayDetails.percentage}%)
                      </span>
                    </p>
                  </div>

                  <div className="w-28 bg-[#0D101B] rounded-full h-3.5 overflow-hidden p-0.5 border border-[#242A3A]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#C8FF00] transition-all duration-500"
                      style={{ width: `${dayDetails.percentage}%` }}
                    />
                  </div>
                </div>

                {/* List of Habits for the Day */}
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#A4AABC]">
                    Habits Logged on this Date:
                  </p>

                  {dayDetails.habits.length === 0 ? (
                    <p className="text-xs text-[#70788D] py-4 text-center">
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
                              ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30'
                              : 'bg-[#151A29] border-[#242A3A]'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Toggle Button (active only for Today) */}
                            {dayDetails.isToday ? (
                              <button
                                onClick={() => handleToggleHabitInModal(h)}
                                disabled={isToggling}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${h.isCompleted
                                    ? 'bg-[#C8FF00] text-[#080A12] shadow-sm shadow-[#C8FF00]/40 font-bold'
                                    : 'bg-[#0D101B] border border-[#242A3A] text-[#70788D] hover:text-[#F5F7FC]'
                                  }`}
                                title={h.isCompleted ? 'Click to undo' : 'Click to complete'}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#080A12]" />
                                ) : h.isCompleted ? (
                                  <CheckCircle2 className="w-4.5 h-4.5 text-[#080A12]" />
                                ) : (
                                  <Circle className="w-4.5 h-4.5" />
                                )}
                              </button>
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${h.isCompleted
                                    ? 'bg-[#C8FF00]/20 text-[#C8FF00] border border-[#C8FF00]/30'
                                    : 'bg-[#0D101B] text-[#70788D] border border-[#242A3A]'
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
                                className={`text-sm font-bold truncate ${h.isCompleted ? 'text-[#F5F7FC]' : 'text-[#A4AABC]'
                                  }`}
                              >
                                {h.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-[#70788D]">
                                <span
                                  className="font-semibold uppercase tracking-wider"
                                  style={{ color: h.color }}
                                >
                                  {h.category}
                                </span>
                                {h.completion?.note && (
                                  <span className="text-[#70788D] italic truncate max-w-[120px]">
                                    "{h.completion.note}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {h.isCompleted ? (
                              <span className="text-[10px] font-bold text-[#C8FF00] bg-[#C8FF00]/15 border border-[#C8FF00]/30 px-2 py-0.5 rounded-full">
                                Completed
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#70788D] bg-[#0D101B] border border-[#242A3A] px-2 py-0.5 rounded-full">
                                {dayDetails.isPast ? 'Missed' : 'Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-[#70788D]">
                  <span>{dayDetails.isToday ? 'Live changes update your streaks instantly.' : 'Past records are archived for historical tracking.'}</span>
                  <button
                    onClick={closeDayInspector}
                    className="px-4 py-2 bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] rounded-xl font-bold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
