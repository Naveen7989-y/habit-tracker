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
import StepTrackerCard from '../components/fitness/StepTrackerCard';
import {
  Flame,
  Footprints,
  Clock,
  Calendar as CalendarIcon,
  Bell,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  RotateCcw,
  Undo2,
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
  X,
  Send,
  Check,
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
  const [waterEntries, setWaterEntries] = useState([]);
  const [extraSteps, setExtraSteps] = useState(0);
  const [stepLoading, setStepLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingHabitId, setTogglingHabitId] = useState(null);
  const [waterAdding, setWaterAdding] = useState(false);

  // AI Daily Health Briefing Modal State
  const [showAiBriefing, setShowAiBriefing] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiParseResult, setAiParseResult] = useState(null);

  const [calorieRingMode, setCalorieRingMode] = useState('burn'); // 'burn' (Active Burn) | 'intake' (Dietary Fuel)
  const [aiLogging, setAiLogging] = useState(false);

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

  const getLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateStr();

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
      if (water.status === 'fulfilled') {
        const rawTotal = Number(water.value?.totalMl);
        setWaterTotalMl(!isNaN(rawTotal) ? rawTotal : 0);
        setWaterEntries(Array.isArray(water.value?.entries) ? water.value.entries : []);
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

  // Quick Log Water (flexible ml amount)
  const handleAddWater = async (amount = 250) => {
    const numericAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 250;
    if (waterAdding) return;
    try {
      setWaterAdding(true);
      const prevTotal = Number(waterTotalMl) && !isNaN(Number(waterTotalMl)) ? Number(waterTotalMl) : 0;
      const newTotal = prevTotal + numericAmount;
      setWaterTotalMl(newTotal);
      const entry = await nutritionService.logWater({
        amountMl: numericAmount,
        logDate: todayStr,
      });
      if (entry) {
        setWaterEntries((prev) => [...prev, entry]);
      }
      if (newTotal >= 2500 && prevTotal < 2500) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#25D9E6', '#60A5FA', '#C8FF00'],
        });
      }
    } catch (e) {
      console.warn('Could not save water log:', e);
    } finally {
      setWaterAdding(false);
    }
  };

  // Withdraw Water Intake Changes (-amount ml)
  const handleWithdrawWater = async (amountToWithdraw = 250) => {
    const numericAmount = typeof amountToWithdraw === 'number' && !isNaN(amountToWithdraw) ? amountToWithdraw : 250;
    const currentTotal = Number(waterTotalMl) && !isNaN(Number(waterTotalMl)) ? Number(waterTotalMl) : 0;
    if (waterAdding || currentTotal <= 0) return;
    try {
      setWaterAdding(true);
      let entries = [...waterEntries];
      if (entries.length === 0) {
        const res = await nutritionService.getWaterLogs(todayStr);
        entries = res?.entries || [];
      }

      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1];
        await nutritionService.deleteWaterLog(lastEntry.id);
        setWaterEntries(entries.slice(0, -1));
        const entryMl = Number(lastEntry.amountMl) || numericAmount;
        setWaterTotalMl((prev) => {
          const prevNum = Number(prev) && !isNaN(Number(prev)) ? Number(prev) : 0;
          return Math.max(0, prevNum - entryMl);
        });
      } else {
        setWaterTotalMl((prev) => {
          const prevNum = Number(prev) && !isNaN(Number(prev)) ? Number(prev) : 0;
          return Math.max(0, prevNum - numericAmount);
        });
      }
    } catch (e) {
      console.warn('Could not withdraw water log:', e);
      setWaterTotalMl((prev) => {
        const prevNum = Number(prev) && !isNaN(Number(prev)) ? Number(prev) : 0;
        return Math.max(0, prevNum - numericAmount);
      });
    } finally {
      setWaterAdding(false);
    }
  };

  // Clear/Reset all water logs for today
  const handleResetWater = async () => {
    if (waterAdding || waterTotalMl <= 0) return;
    try {
      setWaterAdding(true);
      const res = await nutritionService.getWaterLogs(todayStr);
      const entries = res?.entries || [];
      for (const entry of entries) {
        try {
          await nutritionService.deleteWaterLog(entry.id);
        } catch (err) {
          console.warn('Error clearing water entry:', err);
        }
      }
      setWaterEntries([]);
      setWaterTotalMl(0);
    } catch (e) {
      console.warn('Could not reset water:', e);
      setWaterTotalMl(0);
    } finally {
      setWaterAdding(false);
    }
  };

  // Handle adding steps with persistent walking activity
  const handleAddSteps = async (amount = 500) => {
    if (stepLoading) return;
    try {
      setStepLoading(true);
      const newExtra = extraSteps + amount;
      setExtraSteps(newExtra);

      const distKm = Math.round((amount / 1350) * 100) / 100;
      const durationMin = Math.max(5, Math.round(amount / 100));
      const calories = Math.round(amount * 0.04);

      await workoutService.logWorkout({
        title: 'Daily Walking Cadence',
        activityType: 'Walking',
        durationSeconds: durationMin * 60,
        distanceKm: distKm,
        caloriesBurned: calories,
        loggedDate: todayStr,
        status: 'COMPLETED',
      });

      const updatedStats = await workoutService.getStats();
      if (updatedStats) {
        setWorkoutStats(updatedStats);
        setExtraSteps(0);
      }

      if (stepsLogged + amount >= stepsGoal && stepsLogged < stepsGoal) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#25D9E6', '#39E58C', '#C8FF00'],
        });
      }
    } catch (e) {
      console.warn('Could not log steps:', e);
    } finally {
      setStepLoading(false);
    }
  };

  // Handle withdrawing steps
  const handleWithdrawSteps = async (amount = 500) => {
    const numericAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 500;
    if (stepLoading || stepsLogged <= 0) return;
    try {
      setStepLoading(true);
      if (extraSteps >= numericAmount) {
        setExtraSteps((prev) => Math.max(0, prev - numericAmount));
      } else {
        try {
          const userWorkoutsRes = await workoutService.getWorkouts({ limit: 20 });
          const workoutList = userWorkoutsRes?.workouts || (Array.isArray(userWorkoutsRes) ? userWorkoutsRes : []);
          const todayWalk = workoutList.find(
            (w) =>
              (w.loggedDate === todayStr || (w.startedAt && w.startedAt.startsWith(todayStr))) &&
              (w.activityType?.toLowerCase() === 'walking' || w.title?.toLowerCase().includes('walk') || w.title?.toLowerCase().includes('step'))
          );
          if (todayWalk) {
            await workoutService.deleteWorkout(todayWalk.id);
            const updatedStats = await workoutService.getStats();
            if (updatedStats) setWorkoutStats(updatedStats);
          } else {
            setExtraSteps((prev) => Math.max(0, prev - numericAmount));
          }
        } catch (err) {
          console.warn('Could not delete workout for steps:', err);
          setExtraSteps((prev) => Math.max(0, prev - numericAmount));
        }
      }
    } catch (e) {
      console.warn('Could not withdraw steps:', e);
    } finally {
      setStepLoading(false);
    }
  };

  // Natural Language AI Parsing inside Daily Briefing Modal
  const handleRunAiParse = async (e) => {
    e?.preventDefault();
    if (!aiInputText.trim() || aiParsing) return;
    try {
      setAiParsing(true);
      const res = await nutritionService.parseNaturalLanguage(aiInputText);
      setAiParseResult(res);
    } catch (err) {
      console.warn('AI parse error:', err);
      setAiParseResult({
        error: 'Could not parse description. Try specifying foods with portions (e.g., "2 boiled eggs and 1 slice toast").',
      });
    } finally {
      setAiParsing(false);
    }
  };

  // Actionable Log AI Parsed Items Directly to Food Diary
  const handleLogAiItems = async () => {
    if (!aiParseResult?.parsedItems?.length || aiLogging) return;
    try {
      setAiLogging(true);
      const itemsToLog = aiParseResult.parsedItems.map((item) => ({
        foodName: item.name || 'Food item',
        mealType: 'Lunch',
        logDate: todayStr,
        servingQuantity: 1,
        servingUnit: item.servingUnit || 'serving',
        totalGrams: Number(item.servingSizeGrams || item.grams || 100),
        calories: Number(item.calories || 0),
        protein: Number(item.protein || 0),
        carbs: Number(item.carbs || 0),
        fat: Number(item.fat || 0),
        fiber: Number(item.fiber || 0),
      }));

      await nutritionService.logMultipleFoods(itemsToLog);
      const updatedLogs = await nutritionService.getDailyLogs(todayStr);
      if (updatedLogs) setNutritionLogs(updatedLogs);
      setShowAiBriefing(false);
      setAiParseResult(null);
      setAiInputText('');
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#39E58C', '#C8FF00', '#25D9E6'],
      });
    } catch (e) {
      console.warn('Could not log AI items to diary:', e);
    } finally {
      setAiLogging(false);
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

  // Derive Dynamic Goals & Live Telemetry
  const dailyCaloriesTarget = Number(nutritionGoals?.dailyCalories) || 2000;
  const caloriesConsumed = Math.round(nutritionLogs?.totals?.calories || 0);

  const stepsGoal = Number(nutritionGoals?.dailyStepsTarget) || 10000;
  const stepsLogged = (workoutStats?.today?.steps || 0) + extraSteps;

  const activeTimeGoal = Number(nutritionGoals?.activeTimeGoal) || 60;
  const extraActiveMinutes = Math.round(extraSteps / 100);
  const activeTimeMinutes = (workoutStats?.today?.activeMinutes || 0) + extraActiveMinutes;

  const activeBurnGoal = Number(nutritionGoals?.activeBurnGoal) || 500;
  const extraCaloriesBurned = Math.round(extraSteps * 0.04);
  const todayActiveCalories = Math.round((workoutStats?.today?.caloriesBurned || 0) + extraCaloriesBurned);

  const baseDistance = Number(workoutStats?.today?.distanceKm) || 0;
  const extraDist = extraSteps > 0 ? (extraSteps * 0.00075) : 0;
  const todayDistanceKm = Math.round((baseDistance + extraDist) * 10) / 10;

  const waterTargetMl = Number(nutritionGoals?.waterTargetMl) || 2500;
  const safeWaterTotal = Number(waterTotalMl) && !isNaN(Number(waterTotalMl)) ? Math.max(0, Number(waterTotalMl)) : 0;
  const targetGlasses = Math.max(1, Math.round(waterTargetMl / 250));
  const filledWaterGlasses = Math.min(targetGlasses, Math.max(0, Math.round(safeWaterTotal / 250)));

  const targetProtein = Number(nutritionGoals?.proteinGrams) || 125;
  const targetCarbs = Number(nutritionGoals?.carbsGrams) || 225;
  const targetFat = Number(nutritionGoals?.fatGrams) || 65;

  const todayHabits = dashboardData?.todayHabits || [];
  const completedHabitsCount = dashboardData?.today?.completedCount || 0;
  const totalHabitsCount = dashboardData?.today?.totalHabits || todayHabits.length;
  const habitCompletionRate = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;

  // Calculate Overall Daily Vitality Momentum (0 - 100%)
  const burnProgress = activeBurnGoal > 0 ? Math.min(100, Math.round((todayActiveCalories / activeBurnGoal) * 100)) : 0;
  const intakeProgress = dailyCaloriesTarget > 0 ? Math.min(100, Math.round((caloriesConsumed / dailyCaloriesTarget) * 100)) : 0;
  const stepsProgress = stepsGoal > 0 ? Math.min(100, Math.round((stepsLogged / stepsGoal) * 100)) : 0;
  const activeProgress = activeTimeGoal > 0 ? Math.min(100, Math.round((activeTimeMinutes / activeTimeGoal) * 100)) : 0;
  const waterProgress = waterTargetMl > 0 ? Math.min(100, Math.round((safeWaterTotal / waterTargetMl) * 100)) : 0;

  // Holistic Vitality: responsive to movement, hydration, active burn, and habits
  const calProgToUse = calorieRingMode === 'burn' ? burnProgress : intakeProgress;
  const vitalityScore = Math.min(
    100,
    Math.round(
      (calProgToUse * 0.3) +
      (stepsProgress * 0.3) +
      (activeProgress * 0.2) +
      (waterProgress * 0.1) +
      (habitCompletionRate * 0.1)
    )
  );

  // Motivational Quote
  const motivationalQuote = "Every rep, every step, every healthy choice builds your peak vitality.";

  // Quick Interactive Glass Click (Supports both filling and withdrawing)
  const handleSetWaterGlass = async (glassNumber) => {
    if (waterAdding) return;
    const currentFilledGlasses = filledWaterGlasses;

    if (glassNumber === currentFilledGlasses) {
      // Toggling the last filled glass off (withdraw 1 glass)
      await handleWithdrawWater(250);
    } else if (glassNumber < currentFilledGlasses) {
      // Withdrawing down to this glass
      const glassesToWithdraw = currentFilledGlasses - glassNumber;
      for (let i = 0; i < glassesToWithdraw; i++) {
        await handleWithdrawWater(250);
      }
    } else {
      // Adding difference up to this glass
      const diffMl = (glassNumber - currentFilledGlasses) * 250;
      await handleAddWater(diffMl);
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#151A29] border border-[#242A3A] text-[#A4AABC]">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#C8FF00]" />
                  <span>{formatTodayDisplay()}</span>
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

            {/* Executive Bio-Readiness & AI Health Briefing Launcher (Non-repetitive & High-Value) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 lg:pt-0">
              {/* Daily Bio-Readiness Capsule */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#0D101B]/80 border border-[#242A3A] shadow-md backdrop-blur-md">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#39E58C] animate-pulse" />
                  <span className="text-xs font-bold text-[#F5F7FC]">
                    Readiness: <span className="text-[#39E58C]">94%</span>
                  </span>
                  <span className="text-[10px] text-[#70788D] hidden xl:inline font-medium">• Prime</span>
                </div>

                <div className="w-px h-3.5 bg-[#242A3A]" />

                <div className="flex items-center gap-1.5 text-xs text-[#A4AABC]">
                  <Activity className="w-3.5 h-3.5 text-[#25D9E6]" />
                  <span className="text-[11px] font-semibold text-[#F5F7FC]">Telemetry Active</span>
                </div>
              </div>

              {/* AI Daily Health Briefing Interactive Button */}
              <button
                type="button"
                onClick={() => setShowAiBriefing(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#C8FF00] via-[#85FF72] to-[#25D9E6] hover:brightness-110 text-[#080A12] text-xs font-black transition-all shadow-[0_0_16px_rgba(200,255,0,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                title="View personalized AI health assessment & daily coaching tips"
              >
                <Sparkles className="w-4 h-4 fill-current stroke-none text-[#080A12]" />
                <span>AI Health Briefing</span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/15 text-[10px] font-black uppercase tracking-wider">
                  Live
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Dashboard Grid: 2-Columns on Desktop (7/5), 1-Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column (Primary Telemetry & Activity Metrics) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">
            {/* Daily Progress Section */}
            <div className="bg-[#111522]/90 backdrop-blur-xl border border-[#242A3A] hover:border-[#C8FF00]/40 rounded-[26px] p-5 sm:p-6 space-y-4 shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                <div className="flex items-center gap-2">
                  {/* Calorie Mode Segmented Switch: Active Burn vs Dietary Fuel */}
                  <div className="flex items-center bg-[#0D101B] border border-[#1D2332] p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCalorieRingMode('burn')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        calorieRingMode === 'burn'
                          ? 'bg-[#C8FF00] text-[#080A12] shadow-[0_0_8px_rgba(200,255,0,0.3)]'
                          : 'text-[#70788D] hover:text-[#F5F7FC]'
                      }`}
                      title="Show Active Metabolic Calories Burned from Workouts & Steps"
                    >
                      Active Burn
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalorieRingMode('intake')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        calorieRingMode === 'intake'
                          ? 'bg-[#39E58C] text-[#080A12] shadow-[0_0_8px_rgba(57,229,140,0.3)]'
                          : 'text-[#70788D] hover:text-[#F5F7FC]'
                      }`}
                      title="Show Dietary Calories Consumed from Meal Diary"
                    >
                      Dietary Fuel
                    </button>
                  </div>

                  {/* Overall Vitality Pill */}
                  <div className="flex items-center gap-2 bg-[#0D101B] border border-[#1D2332] px-3 py-1.5 rounded-full shrink-0">
                    <span className={`w-2 h-2 rounded-full ${vitalityScore > 0 ? 'bg-[#C8FF00] animate-ping' : 'bg-[#70788D]'}`} />
                    <span className="text-xs font-black text-[#F5F7FC]">
                      Vitality: {vitalityScore}%
                    </span>
                    <span className="text-[10px] font-semibold text-[#70788D] hidden sm:inline">
                      {vitalityScore >= 80 ? 'Peak' : vitalityScore >= 40 ? 'On Track' : 'Rising'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Circular Rings in a Single Row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-3 pb-2 border-t border-[#1D2332]">
                <CircularProgressRing
                  value={calorieRingMode === 'burn' ? todayActiveCalories : caloriesConsumed}
                  target={calorieRingMode === 'burn' ? activeBurnGoal : dailyCaloriesTarget}
                  label={calorieRingMode === 'burn' ? 'Active Burn' : 'Calories'}
                  subLabel={calorieRingMode === 'burn' ? 'Kcal Burned' : 'Kcal Consumed'}
                  icon={calorieRingMode === 'burn' ? Flame : UtensilsCrossed}
                  color={calorieRingMode === 'burn' ? (isDark ? '#C8FF00' : '#0D9488') : (isDark ? '#39E58C' : '#059669')}
                  gradientTo={calorieRingMode === 'burn' ? '#39E58C' : '#25D9E6'}
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

              {/* Integrated Real-Time Biomarker Telemetry Sub-bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#1D2332] text-[11px]">
                <div className="flex items-center gap-1.5 text-[#A4AABC]">
                  <Flame className="w-3.5 h-3.5 text-[#C8FF00]" />
                  <span>Active Burn:</span>
                  <span className="font-bold text-[#F5F7FC]">{todayActiveCalories} Kcal</span>
                  <span className="text-[#70788D]">/ {activeBurnGoal}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#A4AABC]">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-[#39E58C]" />
                  <span>Dietary Fuel:</span>
                  <span className="font-bold text-[#F5F7FC]">{caloriesConsumed} Kcal</span>
                  <span className="text-[#70788D]">/ {dailyCaloriesTarget}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#A4AABC]">
                  <Droplets className="w-3.5 h-3.5 text-[#25D9E6]" />
                  <span>Hydration:</span>
                  <span className="font-bold text-[#F5F7FC]">{safeWaterTotal} ml</span>
                  <span className="text-[#70788D]">/ {waterTargetMl}</span>
                </div>
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

          {/* Right Column (Habits, Meal Diary, Water Intake & Steps) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-4.5">
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
                    <span className="text-[#39E58C] font-bold">{Math.round(nutritionLogs?.totals?.protein || 0)}/{targetProtein}g</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
                    <div
                      className="h-full bg-[#39E58C] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((nutritionLogs?.totals?.protein || 0) / targetProtein) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div className="bg-[#0D101B]/80 p-2 rounded-xl border border-[#1D2332]">
                  <div className="flex items-center justify-between text-[10px] text-[#A4AABC] font-semibold mb-1">
                    <span>Carbs</span>
                    <span className="text-[#FFB020] font-bold">{Math.round(nutritionLogs?.totals?.carbs || 0)}/{targetCarbs}g</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
                    <div
                      className="h-full bg-[#FFB020] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((nutritionLogs?.totals?.carbs || 0) / targetCarbs) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Fat */}
                <div className="bg-[#0D101B]/80 p-2 rounded-xl border border-[#1D2332]">
                  <div className="flex items-center justify-between text-[10px] text-[#A4AABC] font-semibold mb-1">
                    <span>Fat</span>
                    <span className="text-[#8B5CF6] font-bold">{Math.round(nutritionLogs?.totals?.fat || 0)}/{targetFat}g</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
                    <div
                      className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((nutritionLogs?.totals?.fat || 0) / targetFat) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hydration Tracker Card with Dynamic Interactive Glasses */}
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
                    <p className="text-[10px] text-[#70788D]">Target: {waterTargetMl.toLocaleString()} ml daily</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* Withdraw 250 ml button */}
                  <button
                    type="button"
                    onClick={() => handleWithdrawWater(250)}
                    disabled={waterAdding || waterTotalMl <= 0}
                    className="h-7 px-2.5 rounded-lg bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] hover:bg-[#FF453A]/25 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
                    title="Withdraw 250 ml (Undo)"
                  >
                    <Minus className="w-3 h-3" />
                    <span>250 ml</span>
                  </button>

                  {/* Add 250 ml button */}
                  <button
                    type="button"
                    onClick={() => handleAddWater(250)}
                    disabled={waterAdding}
                    className="h-7 px-2.5 rounded-lg bg-[#25D9E6]/15 border border-[#25D9E6]/30 text-[#25D9E6] hover:bg-[#25D9E6]/25 text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
                    title="Add 250 ml"
                  >
                    <Plus className="w-3 h-3" />
                    <span>250 ml</span>
                  </button>

                  {/* Add 500 ml button */}
                  <button
                    type="button"
                    onClick={() => handleAddWater(500)}
                    disabled={waterAdding}
                    className="h-7 px-2.5 rounded-lg bg-[#151A29] border border-[#242A3A] hover:border-[#25D9E6]/40 text-[#A4AABC] hover:text-[#25D9E6] text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
                    title="Add 500 ml"
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
                      {safeWaterTotal}
                    </span>
                    <span className="text-xs text-[#70788D]">
                      / {waterTargetMl.toLocaleString()} ml
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#25D9E6]">
                    {filledWaterGlasses} of {targetGlasses} glasses
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#151A29] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#25D9E6] to-[#0284C7] rounded-full transition-all duration-500 shadow-[0_0_8px_#25D9E6]"
                    style={{
                      width: `${Math.min(100, (safeWaterTotal / waterTargetMl) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Dynamic Interactive Water Glasses Grid */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#70788D] font-medium flex items-center justify-between">
                  <span>Interactive Glass Tracker (Click any glass to fill or withdraw)</span>
                  <div className="flex items-center gap-2">
                    <span>{safeWaterTotal >= waterTargetMl ? '🎉 Goal Reached!' : `${Math.max(0, targetGlasses - filledWaterGlasses)} left`}</span>
                    {safeWaterTotal > 0 && (
                      <button
                        type="button"
                        onClick={handleResetWater}
                        disabled={waterAdding}
                        className="text-[10px] text-[#FF453A] hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Reset all water for today"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="grid gap-1 sm:gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${Math.min(10, targetGlasses)}, minmax(0, 1fr))` }}
                >
                  {[...Array(targetGlasses)].map((_, i) => {
                    const isFilled = i < filledWaterGlasses;
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
                        title={isFilled ? `Glass ${i + 1} filled (Click to withdraw)` : `Log ${ (i + 1) * 250 } ml (${i + 1} glasses)`}
                      >
                        <Droplets className={`w-3.5 h-3.5 ${isFilled ? 'fill-current' : ''}`} />
                        <span className="text-[8px] font-bold mt-0.5">{i + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step Counter & Cadence Card (Balances Column Alignment & Pedometer Telemetry) */}
            <StepTrackerCard
              steps={stepsLogged}
              target={stepsGoal}
              onAddSteps={handleAddSteps}
              onWithdrawSteps={handleWithdrawSteps}
              isLoading={stepLoading}
            />
          </div>
        </div>

        {/* AI Daily Health Briefing Modal */}
        {showAiBriefing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div className="bg-[#111522] border border-[#242A3A] rounded-[28px] max-w-xl w-full p-5 sm:p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C8FF00]/20 to-[#25D9E6]/20 border border-[#C8FF00]/40 flex items-center justify-center text-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.2)]">
                    <Brain className="w-5 h-5 text-[#C8FF00]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-[#F5F7FC] tracking-tight">
                        AI Daily Health Briefing
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#39E58C]/15 border border-[#39E58C]/30 text-[#39E58C] text-[10px] font-bold">
                        Personalized
                      </span>
                    </div>
                    <p className="text-xs text-[#70788D]">
                      Real-time biological feedback & recommendations for {user?.name || 'Athlete'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowAiBriefing(false);
                    setAiParseResult(null);
                  }}
                  className="p-1.5 rounded-xl text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3 Real-Time Diagnostic Telemetry Cards */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Cadence & Movement */}
                <div className="p-3.5 rounded-2xl bg-[#0D101B]/80 border border-[#1D2332] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#F5F7FC]">
                    <span className="flex items-center gap-1.5 text-[#25D9E6]">
                      <Footprints className="w-4 h-4" />
                      <span>Movement & Cadence Pacing</span>
                    </span>
                    <span className="text-[#A4AABC]">{stepsLogged.toLocaleString()} / {stepsGoal.toLocaleString()} steps</span>
                  </div>
                  <p className="text-xs text-[#A4AABC] leading-relaxed">
                    {stepsLogged === 0
                      ? 'No steps recorded yet today. An initial 15-minute brisk walk will activate baseline metabolic burn.'
                      : `You have logged ${stepsLogged.toLocaleString()} steps (${todayDistanceKm} km) and ${todayActiveCalories} Kcal of active burn. Keep this pacing to reach today's milestone!`}
                  </p>
                </div>

                {/* 2. Hydration Balance */}
                <div className="p-3.5 rounded-2xl bg-[#0D101B]/80 border border-[#1D2332] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#F5F7FC]">
                    <span className="flex items-center gap-1.5 text-[#39E58C]">
                      <Droplets className="w-4 h-4" />
                      <span>Metabolic Hydration Level</span>
                    </span>
                    <span className="text-[#A4AABC]">{safeWaterTotal.toLocaleString()} / {waterTargetMl.toLocaleString()} ml</span>
                  </div>
                  <p className="text-xs text-[#A4AABC] leading-relaxed">
                    {safeWaterTotal >= waterTargetMl
                      ? '🎉 Daily hydration target accomplished! Optimal electrolyte and cognitive equilibrium maintained.'
                      : `You have logged ${safeWaterTotal} ml (${filledWaterGlasses} of ${targetGlasses} glasses). Drinking ${Math.max(1, targetGlasses - filledWaterGlasses)} more glasses before evening optimizes deep REM recovery.`}
                  </p>
                </div>

                {/* 3. Consistency & Habit Streak */}
                <div className="p-3.5 rounded-2xl bg-[#0D101B]/80 border border-[#1D2332] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#F5F7FC]">
                    <span className="flex items-center gap-1.5 text-[#C8FF00]">
                      <Sparkles className="w-4 h-4" />
                      <span>Habit Momentum & Routine</span>
                    </span>
                    <span className="text-[#A4AABC]">{completedHabitsCount}/{totalHabitsCount} Complete</span>
                  </div>
                  <p className="text-xs text-[#A4AABC] leading-relaxed">
                    {totalHabitsCount === 0
                      ? 'Create your first daily habits in the habits checklist to start tracking behavioral consistency streaks.'
                      : `You have completed ${completedHabitsCount} of ${totalHabitsCount} scheduled routines today (${habitCompletionRate}% completion rate).`}
                  </p>
                </div>
              </div>

              {/* Natural Language AI Food & Activity Parser */}
              <div className="pt-2 border-t border-[#1D2332]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#F5F7FC] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C8FF00]" />
                    <span>AI Natural Language Quick-Query</span>
                  </span>
                  <span className="text-[10px] text-[#70788D]">Powered by Natural Parser</span>
                </div>

                <form onSubmit={handleRunAiParse} className="flex gap-2">
                  <input
                    type="text"
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                    placeholder="Describe food (e.g. '2 boiled eggs and 1 avocado toast')..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0D101B] border border-[#242A3A] focus:border-[#C8FF00] text-xs text-[#F5F7FC] outline-none transition-all placeholder:text-[#70788D]"
                  />
                  <button
                    type="submit"
                    disabled={aiParsing || !aiInputText.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] disabled:opacity-50 text-[#080A12] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {aiParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{aiParsing ? 'Analyzing...' : 'Parse'}</span>
                  </button>
                </form>

                {aiParseResult && (
                  <div className="mt-2.5 p-3 rounded-xl bg-[#151A29] border border-[#242A3A] text-xs animate-fade-in">
                    {aiParseResult.error ? (
                      <p className="text-[#FF5C67]">{aiParseResult.error}</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[#39E58C] font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>AI Parsed Successfully</span>
                          </p>
                          <span className="text-[10px] text-[#A4AABC]">Ready to Log</span>
                        </div>

                        {aiParseResult.parsedItems && aiParseResult.parsedItems.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[11px] text-[#A4AABC]">
                            {aiParseResult.parsedItems.map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-lg bg-[#0D101B] border border-[#1D2332]">
                                {item.name} • {item.calories || 0} kcal
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Instant Log Button to save directly into user's nutrition log */}
                        {aiParseResult.parsedItems && aiParseResult.parsedItems.length > 0 && (
                          <button
                            type="button"
                            onClick={handleLogAiItems}
                            disabled={aiLogging}
                            className="w-full mt-1.5 py-2 px-3 rounded-xl bg-[#39E58C]/20 border border-[#39E58C]/40 hover:bg-[#39E58C]/30 text-[#39E58C] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            {aiLogging ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>Log {aiParseResult.parsedItems.length} {aiParseResult.parsedItems.length === 1 ? 'item' : 'items'} to Today's Food Diary</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Action */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAiBriefing(false);
                    setAiParseResult(null);
                    confetti({
                      particleCount: 40,
                      spread: 60,
                      origin: { y: 0.6 },
                      colors: ['#C8FF00', '#25D9E6', '#39E58C'],
                    });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8FF00] to-[#39E58C] text-[#080A12] text-xs font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center"
                >
                  Acknowledge & Apply Briefing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
