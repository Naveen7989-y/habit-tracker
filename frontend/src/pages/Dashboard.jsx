import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardService } from '../services/dashboard.service';
import { completionService } from '../services/completion.service';
import { nutritionService } from '../services/nutrition.service';
import { workoutService } from '../services/workout.service';
import DashboardLayout from '../layouts/DashboardLayout';
import CircularProgressRing from '../components/fitness/CircularProgressRing';
import HeartRateCard from '../components/fitness/HeartRateCard';
import ActivitySummaryCard from '../components/fitness/ActivitySummaryCard';
import {
  Flame,
  Footprints,
  Clock,
  Calendar as CalendarIcon,
  Bell,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  Sparkles,
  Droplets,
  Scale,
  UtensilsCrossed,
  Activity,
  Dumbbell,
  BookOpen,
  Brain,
  Heart,
  Moon,
  Zap,
  Loader2,
  AlertCircle,
  TrendingUp,
  ListTodo,
  LayoutDashboard,
} from 'lucide-react';

const ICONS = {
  Activity,
  Dumbbell,
  BookOpen,
  Brain,
  Sparkles,
  Droplets,
  Heart,
  Moon,
  Zap,
  Footprints,
};

export default function Dashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [dashboardData, setDashboardData] = useState(null);
  const [nutritionLogs, setNutritionLogs] = useState(null);
  const [nutritionGoals, setNutritionGoals] = useState(null);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [waterTotalMl, setWaterTotalMl] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingHabitId, setTogglingHabitId] = useState(null);
  const [waterAdding, setWaterAdding] = useState(false);

  // Dynamic Greeting based on current local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format today's date (e.g. "Today, May 24")
  const formatTodayDisplay = () => {
    const now = new Date();
    const options = { month: 'short', day: 'numeric' };
    return `Today, ${now.toLocaleDateString('en-US', options)}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch all dashboard & fitness telemetry
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, nutLogs, nutGoals, wStats, water] = await Promise.allSettled([
        dashboardService.getOverview(),
        nutritionService.getDailyLogs(todayStr),
        nutritionService.getGoals(),
        workoutService.getStats(),
        nutritionService.getWaterLogs(todayStr),
      ]);

      if (dash.status === 'fulfilled') setDashboardData(dash.value);
      if (nutLogs.status === 'fulfilled') setNutritionLogs(nutLogs.value);
      if (nutGoals.status === 'fulfilled') setNutritionGoals(nutGoals.value);
      if (wStats.status === 'fulfilled') setWorkoutStats(wStats.value);
      if (water.status === 'fulfilled' && water.value?.totalMl !== undefined) {
        setWaterTotalMl(water.value.totalMl);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Quick Log Water (+250ml per glass)
  const handleAddWater = async () => {
    if (waterAdding) return;
    try {
      setWaterAdding(true);
      setWaterTotalMl((prev) => prev + 250);
      await nutritionService.logWater({
        amountMl: 250,
        logDate: todayStr,
      });
    } catch (e) {
      console.warn('Could not save water log:', e);
    } finally {
      setWaterAdding(false);
    }
  };

  // Toggle habit completion with optimistic updates & confetti
  const handleToggleHabit = async (habit) => {
    const isCurrentlyDone = habit.isCompletedToday;
    setTogglingHabitId(habit.id);

    // Optimistic UI update
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
          colors: ['#C8FF00', '#39E58C', '#8B5CF6', '#25D9E6'],
        });
      }
    } catch (err) {
      console.error('Failed to toggle habit:', err);
      // Revert if error
      fetchAllData();
    } finally {
      setTogglingHabitId(null);
    }
  };

  if (loading && !dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 text-[#C8FF00] animate-spin" />
          <p className="text-xs font-semibold text-[#70788D]">
            Loading your HAByTAT telemetry...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Derive Real Metrics
  const dailyCaloriesTarget = nutritionGoals?.dailyCalories || 2000;
  const caloriesConsumed = Math.round(nutritionLogs?.totals?.calories || 0);

  const stepsGoal = 10000;
  const stepsLogged = workoutStats?.today?.steps || 0;

  const activeTimeGoal = 60;
  const activeTimeMinutes = workoutStats?.today?.activeMinutes || 0;

  const todayDistanceKm = workoutStats?.today?.distanceKm || 0;
  const todayActiveCalories = workoutStats?.today?.caloriesBurned || 0;

  const todayHabits = dashboardData?.todayHabits || [];
  const completedHabitsCount = dashboardData?.today?.completedCount || 0;
  const totalHabitsCount = dashboardData?.today?.totalHabits || todayHabits.length;
  const habitCompletionRate = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;

  // Calculate Overall Daily Vitality Momentum (0 - 100%)
  const calProgress = Math.min(100, Math.round((caloriesConsumed / dailyCaloriesTarget) * 100));
  const stepsProgress = Math.min(100, Math.round((stepsLogged / stepsGoal) * 100));
  const activeProgress = Math.min(100, Math.round((activeTimeMinutes / activeTimeGoal) * 100));
  const vitalityScore = Math.round((calProgress + stepsProgress + activeProgress) / 3);

  // Motivational Quote
  const motivationalQuote = "Every rep, every step, every healthy choice builds your peak vitality.";

  // Quick Direct Glass Water Log
  const handleSetWaterGlass = async (glassNumber) => {
    const targetMl = glassNumber * 250;
    const diff = targetMl - waterTotalMl;
    if (diff === 0 || waterAdding) return;
    try {
      setWaterAdding(true);
      setWaterTotalMl(targetMl);
      await nutritionService.logWater({
        amountMl: diff,
        logDate: todayStr,
      });
      if (targetMl >= 2500) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#25D9E6', '#60A5FA', '#C8FF00'],
        });
      }
    } catch (e) {
      console.warn('Could not update water log:', e);
    } finally {
      setWaterAdding(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full pt-2 sm:pt-4 pb-8 space-y-5 sm:space-y-6">
        {/* A. Energetic Top Hero & Greeting Banner */}
        <div className="bg-gradient-to-r from-[#111522] via-[#151A29] to-[#111522] border border-[#242A3A] rounded-[26px] p-4 sm:p-6 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#C8FF00]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#25D9E6]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-[#C8FF00]">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Daily Telemetry Hub</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFB020]/15 border border-[#FFB020]/30 text-[#FFB020]">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>1 Day Active</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#F5F7FC] tracking-tight">
                <span>{getGreeting()}</span>
                {', '}
                <span className="text-[#C8FF00]">
                  {user?.name ? user.name.split(' ')[0] : 'Athlete'}!
                </span>{' '}
                👋
              </h1>
              <p className="text-xs sm:text-sm text-[#A4AABC] font-medium mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C8FF00] shrink-0" />
                <span>{motivationalQuote}</span>
              </p>
            </div>

            {/* Quick Action Launcher Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
              <Link
                to="/workouts"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] text-xs font-bold transition-all shadow-[0_0_12px_rgba(200,255,0,0.25)] hover:scale-105 active:scale-95"
              >
                <Dumbbell className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Start Workout</span>
              </Link>

              <Link
                to="/nutrition"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151A29] hover:bg-[#1D2332] border border-[#242A3A] hover:border-[#39E58C]/40 text-[#F5F7FC] text-xs font-bold transition-all hover:scale-105 active:scale-95"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#39E58C]" />
                <span>Log Meal</span>
              </Link>

              <button
                onClick={handleAddWater}
                disabled={waterAdding}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151A29] hover:bg-[#1D2332] border border-[#242A3A] hover:border-[#25D9E6]/40 text-[#F5F7FC] text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Quick Add 250ml Water"
              >
                <Droplets className="w-3.5 h-3.5 text-[#25D9E6]" />
                <span>+250ml Water</span>
              </button>

              <Link
                to="/habits"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#151A29] hover:bg-[#1D2332] border border-[#242A3A] hover:border-[#8B5CF6]/40 text-[#F5F7FC] text-xs font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>New Habit</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Responsive Dashboard Grid: 2-Columns on Desktop (7/5), 1-Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column (Primary Telemetry & Activity Metrics) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">
            {/* Daily Progress Section */}
            <div className="bg-[#111522]/90 backdrop-blur-xl border border-[#242A3A] hover:border-[#C8FF00]/40 rounded-[26px] p-5 sm:p-6 space-y-4 shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#F5F7FC] tracking-tight">
                      Daily Activity Rings
                    </h2>
                    <p className="text-[11px] text-[#70788D]">
                      Core movement, metabolic burn, and duration goals
                    </p>
                  </div>
                </div>

                {/* Overall Vitality Pill */}
                <div className="flex items-center gap-2 bg-[#0D101B] border border-[#1D2332] px-3 py-1.5 rounded-full">
                  <span className={`w-2 h-2 rounded-full ${vitalityScore > 0 ? 'bg-[#C8FF00] animate-ping' : 'bg-[#70788D]'}`} />
                  <span className="text-xs font-black text-[#F5F7FC]">
                    Vitality: {vitalityScore}%
                  </span>
                  <span className="text-[10px] font-semibold text-[#70788D] hidden sm:inline">
                    {vitalityScore >= 80 ? 'Peak' : vitalityScore >= 40 ? 'On Track' : 'Rising'}
                  </span>
                </div>
              </div>

              {/* 3 Circular Rings in a Single Row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-3 pb-1 border-t border-[#1D2332]">
                <CircularProgressRing
                  value={caloriesConsumed}
                  target={dailyCaloriesTarget}
                  label="Calories"
                  subLabel="Kcal Burned"
                  icon={Flame}
                  color={isDark ? '#C8FF00' : '#0D9488'}
                  gradientTo="#39E58C"
                  trackColor={isDark ? '#151A29' : '#E2E8F0'}
                  size={112}
                  strokeWidth={9}
                />

                <CircularProgressRing
                  value={stepsLogged}
                  target={stepsGoal}
                  label="Steps"
                  subLabel="Step Count"
                  icon={Footprints}
                  color={isDark ? '#25D9E6' : '#0284C7'}
                  gradientTo="#0284C7"
                  trackColor={isDark ? '#151A29' : '#E2E8F0'}
                  size={112}
                  strokeWidth={9}
                />

                <CircularProgressRing
                  value={activeTimeMinutes}
                  target={activeTimeGoal}
                  label="Active Time"
                  subLabel="Duration (min)"
                  icon={Clock}
                  color={isDark ? '#8B5CF6' : '#7C3AED'}
                  gradientTo="#EC4899"
                  trackColor={isDark ? '#151A29' : '#E2E8F0'}
                  size={112}
                  strokeWidth={9}
                />
              </div>
            </div>

            {/* Heart Rate Card */}
            <HeartRateCard currentBpm={workoutStats?.today?.avgHeartRate || 0} />

            {/* Activity Summary Card */}
            <ActivitySummaryCard
              distanceKm={todayDistanceKm}
              activeCalories={todayActiveCalories}
              workoutCount={workoutStats?.today?.count || 0}
              sleepHours="--"
            />
          </div>

          {/* Right Column (Habits, Meal Diary & Water Intake) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 sm:space-y-6">
            {/* Today's Habit Checklist Section */}
            <div className="bg-[#111522]/90 backdrop-blur-xl border border-[#242A3A] hover:border-[#C8FF00]/40 rounded-[26px] p-4 sm:p-5 space-y-3.5 shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F7FC]">
                      Habits ({completedHabitsCount}/{totalHabitsCount})
                    </h3>
                    <p className="text-[10px] text-[#70788D]">Daily consistency routine</p>
                  </div>
                </div>
                <Link
                  to="/habits"
                  className="text-xs font-bold text-[#C8FF00] hover:underline flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Habit Completion Progress Bar */}
              {totalHabitsCount > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-[#A4AABC]">Progress</span>
                    <span className="text-[#39E58C] font-bold">{habitCompletionRate}% Done</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#151A29] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C8FF00] to-[#39E58C] rounded-full transition-all duration-500 shadow-[0_0_8px_#39E58C]"
                      style={{ width: `${habitCompletionRate}%` }}
                    />
                  </div>
                </div>
              )}

              {todayHabits.length === 0 ? (
                <div className="p-6 text-center bg-[#0D101B]/80 border border-[#1D2332] rounded-2xl space-y-2">
                  <p className="text-xs text-[#70788D]">No habits scheduled for today.</p>
                  <Link
                    to="/habits"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C8FF00] text-[#080A12] text-xs font-bold hover:bg-[#B4E600] transition-transform active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create your first habit</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {todayHabits.map((habit) => {
                    const isDone = habit.isCompletedToday;
                    const isToggling = togglingHabitId === habit.id;
                    const Icon = ICONS[habit.icon] || Activity;

                    return (
                      <div
                        key={habit.id}
                        onClick={() => !isToggling && handleToggleHabit(habit)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                          isDone
                            ? 'bg-[#0D101B]/80 border-[#39E58C]/30 text-[#A4AABC]'
                            : 'bg-[#151A29]/80 border-[#242A3A] text-[#F5F7FC] hover:border-[#C8FF00]/40 hover:bg-[#151A29]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox Icon */}
                          <button
                            type="button"
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                              isDone
                                ? 'bg-[#39E58C] text-[#080A12] shadow-[0_0_8px_#39E58C]'
                                : 'border-2 border-[#70788D] group-hover:border-[#C8FF00]'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 fill-current stroke-none" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-transparent" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <p
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isDone ? 'line-through text-[#70788D]' : 'text-[#F5F7FC]'
                              }`}
                            >
                              {habit.name}
                            </p>
                            <p className="text-[10px] text-[#70788D] flex items-center gap-2">
                              <span>{habit.category}</span>
                              {habit.currentStreak > 0 && (
                                <span className="text-[#C8FF00] font-semibold flex items-center gap-0.5">
                                  <Flame className="w-3 h-3 fill-current" />
                                  {habit.currentStreak} day streak
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${habit.color || '#C8FF00'}15`,
                            color: habit.color || '#C8FF00',
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nutrition Summary Card with Macro Breakdown */}
            <div className="bg-[#111522]/90 backdrop-blur-xl border border-[#242A3A] hover:border-[#C8FF00]/40 rounded-[26px] p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#39E58C]/15 border border-[#39E58C]/30 flex items-center justify-center text-[#39E58C]">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                      Meal Diary & Macros
                    </h3>
                    <p className="text-[10px] text-[#70788D]">Daily caloric budget</p>
                  </div>
                </div>
                <Link
                  to="/nutrition"
                  className="text-xs font-bold text-[#C8FF00] hover:underline"
                >
                  Open Diary
                </Link>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#F5F7FC]">
                      {caloriesConsumed}
                    </span>
                    <span className="text-xs text-[#70788D]">
                      / {dailyCaloriesTarget} kcal
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#C8FF00] bg-[#C8FF00]/10 px-2.5 py-0.5 rounded-full border border-[#C8FF00]/20">
                    {Math.max(0, dailyCaloriesTarget - caloriesConsumed)} left
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#151A29] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C8FF00] to-[#39E58C] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(200,255,0,0.3)]"
                    style={{
                      width: `${Math.min(100, (caloriesConsumed / dailyCaloriesTarget) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Macro Nutrients Progress Bars */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* Protein */}
                <div className="bg-[#0D101B]/80 p-2 rounded-xl border border-[#1D2332]">
                  <div className="flex items-center justify-between text-[10px] text-[#A4AABC] font-semibold mb-1">
                    <span>Protein</span>
                    <span className="text-[#39E58C] font-bold">{Math.round(nutritionLogs?.totals?.protein || 0)}g</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
                    <div
                      className="h-full bg-[#39E58C] rounded-full"
                      style={{ width: `${Math.min(100, ((nutritionLogs?.totals?.protein || 0) / 130) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div className="bg-[#0D101B]/80 p-2 rounded-xl border border-[#1D2332]">
                  <div className="flex items-center justify-between text-[10px] text-[#A4AABC] font-semibold mb-1">
                    <span>Carbs</span>
                    <span className="text-[#FFB020] font-bold">{Math.round(nutritionLogs?.totals?.carbs || 0)}g</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
                    <div
                      className="h-full bg-[#FFB020] rounded-full"
                      style={{ width: `${Math.min(100, ((nutritionLogs?.totals?.carbs || 0) / 220) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Fat */}
                <div className="bg-[#0D101B]/80 p-2 rounded-xl border border-[#1D2332]">
                  <div className="flex items-center justify-between text-[10px] text-[#A4AABC] font-semibold mb-1">
                    <span>Fat</span>
                    <span className="text-[#8B5CF6] font-bold">{Math.round(nutritionLogs?.totals?.fat || 0)}g</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
                    <div
                      className="h-full bg-[#8B5CF6] rounded-full"
                      style={{ width: `${Math.min(100, ((nutritionLogs?.totals?.fat || 0) / 65) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hydration Tracker Card with 10 Interactive Glasses */}
            <div className="bg-[#111522]/90 backdrop-blur-xl border border-[#242A3A] hover:border-[#25D9E6]/40 rounded-[26px] p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#25D9E6]/15 border border-[#25D9E6]/30 flex items-center justify-center text-[#25D9E6]">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                      Water Intake
                    </h3>
                    <p className="text-[10px] text-[#70788D]">Target: 2,500 ml daily</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleAddWater}
                    disabled={waterAdding}
                    className="px-2.5 py-1 rounded-lg bg-[#25D9E6]/15 border border-[#25D9E6]/30 text-[#25D9E6] hover:bg-[#25D9E6]/25 text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>250 ml</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (waterAdding) return;
                      setWaterAdding(true);
                      setWaterTotalMl((prev) => prev + 500);
                      try {
                        await nutritionService.logWater({ amountMl: 500, logDate: todayStr });
                      } finally {
                        setWaterAdding(false);
                      }
                    }}
                    disabled={waterAdding}
                    className="px-2.5 py-1 rounded-lg bg-[#151A29] border border-[#242A3A] hover:border-[#25D9E6]/40 text-[#A4AABC] hover:text-[#25D9E6] text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>500 ml</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#25D9E6]">
                      {waterTotalMl}
                    </span>
                    <span className="text-xs text-[#70788D]">
                      / 2500 ml
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#25D9E6]">
                    {Math.round(waterTotalMl / 250)} of 10 glasses
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#151A29] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#25D9E6] to-[#0284C7] rounded-full transition-all duration-500 shadow-[0_0_8px_#25D9E6]"
                    style={{
                      width: `${Math.min(100, (waterTotalMl / 2500) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 10 Interactive Water Glasses Grid */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] text-[#70788D] font-medium flex items-center justify-between">
                  <span>Interactive Glass Tracker (Click any glass to fill)</span>
                  <span>{waterTotalMl >= 2500 ? '🎉 Goal Reached!' : `${Math.max(0, 10 - Math.round(waterTotalMl / 250))} left`}</span>
                </p>
                <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                  {[...Array(10)].map((_, i) => {
                    const isFilled = i < Math.round(waterTotalMl / 250);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSetWaterGlass(i + 1)}
                        className={`h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isFilled
                            ? 'bg-[#25D9E6]/20 border border-[#25D9E6]/50 text-[#25D9E6] shadow-[0_0_6px_rgba(37,217,230,0.3)]'
                            : 'bg-[#0D101B]/80 border border-[#1D2332] text-[#70788D] hover:border-[#25D9E6]/40 hover:text-[#25D9E6]'
                        }`}
                        title={`Log ${ (i + 1) * 250 } ml (${i + 1} glasses)`}
                      >
                        <Droplets className={`w-3.5 h-3.5 ${isFilled ? 'fill-current' : ''}`} />
                        <span className="text-[8px] font-bold mt-0.5">{i + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
