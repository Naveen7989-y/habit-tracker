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
  const { theme } = useTheme();

  const [dashboardData, setDashboardData] = useState(null);
  const [nutritionLogs, setNutritionLogs] = useState(null);
  const [nutritionGoals, setNutritionGoals] = useState(null);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [waterTotalMl, setWaterTotalMl] = useState(1500);

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
  const dailyCaloriesTarget = nutritionGoals?.dailyCalories || 2200;
  const caloriesConsumed = Math.round(nutritionLogs?.totals?.calories || 1850);

  const stepsGoal = 10000;
  const stepsLogged = 8420; // Default active step telemetry

  const activeTimeGoal = 60;
  const activeTimeMinutes = workoutStats?.today?.activeMinutes || 45;

  const todayDistanceKm = workoutStats?.today?.distanceKm || 2.4;
  const todayActiveCalories = workoutStats?.today?.caloriesBurned || 310;

  const todayHabits = dashboardData?.todayHabits || [];
  const completedHabitsCount = dashboardData?.today?.completedCount || 0;
  const totalHabitsCount = dashboardData?.today?.totalHabits || todayHabits.length;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto w-full pt-2 sm:pt-4 space-y-5 sm:space-y-6">
        {/* A. Screen 1 Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-[#F5F7FC] tracking-tight">
              {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Athlete'}! 👋
            </h1>
            <p className="text-xs text-[#70788D] font-normal mt-0.5">
              Let's crush your goals today.
            </p>
          </div>

          {/* User Notification Bell & Profile Avatar (Profile hidden on mobile view) */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell (Matching Screen 1 Reference) */}
            <div className="relative w-10 h-10 rounded-xl bg-[#111522] border border-[#242A3A] flex items-center justify-center text-[#A4AABC] hover:text-[#F5F7FC] transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#C8FF00] shadow-[0_0_6px_#C8FF00]" />
            </div>

            {/* Profile Avatar (Hidden in mobile view, visible on desktop/tablet) */}
            <Link to="/settings" className="relative hidden md:block">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#C8FF00]/80 shadow-[0_0_16px_rgba(200,255,0,0.3)]"
                />
              ) : (
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#151A29] border-2 border-[#8B5CF6]/80 flex items-center justify-center text-sm font-bold text-[#F5F7FC] shadow-[0_0_16px_rgba(139,92,246,0.35)]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
                </div>
              )}
              {/* Active Online status ring */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#39E58C] border-2 border-[#080A12]" />
            </Link>
          </div>
        </div>

        {/* B. Daily Progress Section with 3 Progress Rings */}
        <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#C8FF00]" />
              <h2 className="text-sm font-bold text-[#F5F7FC] tracking-tight">
                Daily Progress
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A4AABC] bg-[#0D101B] px-3 py-1 rounded-full border border-[#1D2332]">
              <CalendarIcon className="w-3.5 h-3.5 text-[#C8FF00]" />
              <span>{formatTodayDisplay()}</span>
            </div>
          </div>

          {/* 3 Circular Rings in a Single Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-1">
            {/* 1. Calories Ring (Neon Lime) */}
            <CircularProgressRing
              value={caloriesConsumed}
              target={dailyCaloriesTarget}
              label="Calories"
              subLabel="Kcal"
              icon={Flame}
              color="#C8FF00"
              trackColor="#151A29"
              size={90}
              strokeWidth={7}
            />

            {/* 2. Steps Ring (Cyan-Green) */}
            <CircularProgressRing
              value={stepsLogged}
              target={stepsGoal}
              label="Steps"
              subLabel="Qadamlar"
              icon={Footprints}
              color="#25D9E6"
              trackColor="#151A29"
              size={90}
              strokeWidth={7}
            />

            {/* 3. Active Time Ring (Electric Violet) */}
            <CircularProgressRing
              value={activeTimeMinutes}
              target={activeTimeGoal}
              label="Active Time"
              subLabel="Vaqt"
              icon={Clock}
              color="#8B5CF6"
              trackColor="#151A29"
              size={90}
              strokeWidth={7}
            />
          </div>
        </div>

        {/* C. Heart Rate Card */}
        <HeartRateCard currentBpm={78} />

        {/* D. Activity Summary Card (3 Columns: Distance / Active Calories / Sleep) */}
        <ActivitySummaryCard
          distanceKm={todayDistanceKm}
          activeCalories={todayActiveCalories}
          sleepHours="7 h 32 m"
        />

        {/* E. Today's Habit Checklist Section */}
        <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C8FF00]" />
              <h3 className="text-sm font-bold text-[#F5F7FC]">
                Today's Habits ({completedHabitsCount}/{totalHabitsCount})
              </h3>
            </div>
            <Link
              to="/habits"
              className="text-xs font-semibold text-[#C8FF00] hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayHabits.length === 0 ? (
            <div className="p-6 text-center bg-[#0D101B] border border-[#1D2332] rounded-2xl space-y-2">
              <p className="text-xs text-[#70788D]">No habits scheduled for today.</p>
              <Link
                to="/habits"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C8FF00] text-[#080A12] text-xs font-bold hover:bg-[#B4E600]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create your first habit</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
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
                        ? 'bg-[#0D101B] border-[#39E58C]/30 text-[#A4AABC]'
                        : 'bg-[#151A29] border-[#242A3A] text-[#F5F7FC] hover:border-[#C8FF00]/40'
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

        {/* F. Nutrition & Hydration Fast Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Nutrition Summary Card */}
          <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#C8FF00]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                  Meal Diary
                </h3>
              </div>
              <Link
                to="/nutrition"
                className="text-xs font-semibold text-[#C8FF00] hover:underline"
              >
                Open
              </Link>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xl font-black text-[#F5F7FC]">
                  {caloriesConsumed}
                </span>
                <span className="text-xs text-[#70788D]">
                  / {dailyCaloriesTarget} kcal
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[#151A29] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C8FF00] to-[#39E58C] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (caloriesConsumed / dailyCaloriesTarget) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-[#A4AABC]">
              <span>Protein: {Math.round(nutritionLogs?.totals?.protein || 85)}g</span>
              <span>Carbs: {Math.round(nutritionLogs?.totals?.carbs || 190)}g</span>
              <span>Fat: {Math.round(nutritionLogs?.totals?.fat || 52)}g</span>
            </div>
          </div>

          {/* Hydration Tracker Card */}
          <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#25D9E6]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                  Water Intake
                </h3>
              </div>
              <button
                onClick={handleAddWater}
                disabled={waterAdding}
                className="text-xs font-bold text-[#25D9E6] hover:underline flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+250 ml</span>
              </button>
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xl font-black text-[#25D9E6]">
                  {waterTotalMl}
                </span>
                <span className="text-xs text-[#70788D]">
                  / 2500 ml
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-[#151A29] overflow-hidden">
                <div
                  className="h-full bg-[#25D9E6] rounded-full transition-all duration-500 shadow-[0_0_8px_#25D9E6]"
                  style={{
                    width: `${Math.min(100, (waterTotalMl / 2500) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-[#70788D]">
              {Math.round(waterTotalMl / 250)} of 10 glasses logged today
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
