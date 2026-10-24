import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { statisticsService } from '../services/statistics.service';
import { workoutService } from '../services/workout.service';
import DashboardLayout from '../layouts/DashboardLayout';
import AchievementsSection from '../components/fitness/AchievementsSection';
import PersonalRecordsCard from '../components/fitness/PersonalRecordsCard';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  TrendingUp,
  BarChart2,
  Trophy,
  Loader2,
  Layers,
  PieChart as PieIcon,
} from 'lucide-react';

// Zero-Initialized Weekly & Monthly fallback series for brand-new users
const ZERO_WEEKLY_SERIES = [
  { day: 'Mon', steps: 0, calories: 0, time: 0 },
  { day: 'Tue', steps: 0, calories: 0, time: 0 },
  { day: 'Wed', steps: 0, calories: 0, time: 0 },
  { day: 'Thu', steps: 0, calories: 0, time: 0 },
  { day: 'Fri', steps: 0, calories: 0, time: 0 },
  { day: 'Sat', steps: 0, calories: 0, time: 0 },
  { day: 'Sun', steps: 0, calories: 0, time: 0 },
];

const ZERO_MONTHLY_SERIES = [
  { day: 'W1', steps: 0, calories: 0, time: 0 },
  { day: 'W2', steps: 0, calories: 0, time: 0 },
  { day: 'W3', steps: 0, calories: 0, time: 0 },
  { day: 'W4', steps: 0, calories: 0, time: 0 },
];

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [period, setPeriod] = useState('Week'); // 'Week' | 'Month'
  const [activeTab, setActiveTab] = useState('fitness'); // 'fitness' | 'habits'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real statistics from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, workoutRes] = await Promise.allSettled([
          statisticsService.getComprehensiveOverview(30),
          workoutService.getStats(),
        ]);
        if (statsRes.status === 'fulfilled') setAnalyticsData(statsRes.value);
        if (workoutRes.status === 'fulfilled') setWorkoutStats(workoutRes.value);
      } catch (err) {
        console.warn('Could not load statistics from API:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = period === 'Week'
    ? (workoutStats?.weeklySeries && workoutStats.weeklySeries.length > 0
        ? workoutStats.weeklySeries
        : ZERO_WEEKLY_SERIES)
    : (workoutStats?.monthlySeries && workoutStats.monthlySeries.length > 0
        ? workoutStats.monthlySeries
        : ZERO_MONTHLY_SERIES);

  // Dynamic Date Range Display
  const getPeriodDisplay = () => {
    const now = new Date();
    if (period === 'Week') {
      const currentDay = now.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const mStr = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const sStr = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${mStr} – ${sStr}`;
    }
    return now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Real values for achievements
  const bestStreak = analyticsData?.streaks?.bestCurrentStreak || 0;
  const totalCaloriesBurned = workoutStats?.totalCaloriesBurned || 0;
  const totalDistanceKm = workoutStats?.totalDistanceKm || 0;

  // Real values for personal records
  const mostStepsRec = workoutStats?.personalRecords?.mostSteps?.value || (workoutStats?.today?.steps ? `${workoutStats.today.steps}` : '0');
  const mostStepsDate = workoutStats?.personalRecords?.mostSteps?.date || '--';
  const longestRunRec = workoutStats?.personalRecords?.longestRun?.value || '0 km';
  const longestRunDate = workoutStats?.personalRecords?.longestRun?.date || '--';
  const mostCaloriesRec = workoutStats?.personalRecords?.mostCalories?.value || '0 Kcal';
  const mostCaloriesDate = workoutStats?.personalRecords?.mostCalories?.date || '--';

  return (
    <DashboardLayout>
      <div className="w-full pt-2 sm:pt-4 pb-6 space-y-5 sm:space-y-6">
        {/* A. Analytics Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-[#111522] border border-[#242A3A] text-[#F5F7FC] flex items-center justify-center hover:bg-[#151A29] transition-colors"
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-[#F5F7FC] tracking-tight">
                Analytics & Performance Hub
              </h1>
              <p className="text-xs text-[#70788D] hidden sm:block">
                Aggregated biometric trends, weekly consistency, and milestone achievements
              </p>
            </div>
          </div>

          {/* Week / Month Segmented Control & Date Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="bg-[#0D101B] border border-[#1D2332] p-1 rounded-2xl flex items-center">
              <button
                onClick={() => setPeriod('Week')}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  period === 'Week'
                    ? 'bg-[#151A29] text-[#C8FF00] border border-[#C8FF00]/40 shadow-[0_0_10px_rgba(200,255,0,0.15)]'
                    : 'text-[#70788D] hover:text-[#A4AABC]'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setPeriod('Month')}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  period === 'Month'
                    ? 'bg-[#151A29] text-[#C8FF00] border border-[#C8FF00]/40 shadow-[0_0_10px_rgba(200,255,0,0.15)]'
                    : 'text-[#70788D] hover:text-[#A4AABC]'
                }`}
              >
                Month
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111522] border border-[#242A3A] text-xs font-semibold text-[#A4AABC]">
              <CalendarIcon className="w-3.5 h-3.5 text-[#C8FF00]" />
              <span>{getPeriodDisplay()}</span>
            </div>
          </div>
        </div>

        {/* Responsive Grid: 2-Columns on Desktop (8/4), 1-Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Interactive Telemetry Charts & Habit Breakdown */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">
            {/* Period Overview & Grouped Bar Chart Card */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                    This {period} Overview
                  </h3>
                  <p className="text-xs text-[#70788D] mt-0.5">
                    Multi-metric comparative telemetry (Steps, Calories & Duration)
                  </p>
                </div>

                <div className="flex sm:hidden items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D101B] border border-[#1D2332] text-xs font-medium text-[#A4AABC]">
                  <span>{getPeriodDisplay()}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#70788D]" />
                </div>
              </div>

              {/* Grouped Bar Chart */}
              <div className="h-64 sm:h-72 w-full -ml-3 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    barGap={4}
                  >
                    <CartesianGrid
                      stroke={isDark ? '#1D2332' : '#E2E8F0'}
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="day"
                      stroke={isDark ? '#70788D' : '#64748B'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: isDark ? '#1D2332' : '#E2E8F0' }}
                    />

                    <YAxis
                      stroke={isDark ? '#70788D' : '#64748B'}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${val / 1000}K` : val)}
                    />

                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#0D101B] border border-[#242A3A] p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                              <p className="font-bold text-[#F5F7FC] border-b border-[#1D2332] pb-1">
                                {label}
                              </p>
                              {payload.map((entry, idx) => (
                                <p key={idx} className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-[#A4AABC]">{entry.name}:</span>
                                  <span className="font-bold text-white">
                                    {entry.value.toLocaleString()}
                                  </span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />

                    {/* 3 Series Bars Matching Reference Colors */}
                    <Bar
                      dataKey="steps"
                      name="Steps"
                      fill={isDark ? '#C8FF00' : '#0D9488'}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={14}
                    />

                    <Bar
                      dataKey="calories"
                      name="Active Calories (Kcal)"
                      fill={isDark ? '#8B5CF6' : '#7C3AED'}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={14}
                    />

                    <Bar
                      dataKey="time"
                      name="Active Time (min)"
                      fill={isDark ? '#25D9E6' : '#0284C7'}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={14}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs text-[#A4AABC] border-t border-[#1D2332]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#C8FF00] shadow-[0_0_6px_#C8FF00]" />
                  <span className="font-semibold">Steps</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
                  <span className="font-semibold">Active Calories</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-[#25D9E6] shadow-[0_0_6px_#25D9E6]" />
                  <span className="font-semibold">Active Time</span>
                </div>
              </div>
            </div>

            {/* Deep Habit Breakdown Section */}
            {analyticsData?.categories && analyticsData.categories.length > 0 && (
              <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-6 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                      Habits by Discipline & Category
                    </h3>
                    <p className="text-xs text-[#70788D] mt-0.5">
                      Distribution of completed habits by category classification
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#C8FF00] bg-[#C8FF00]/10 px-2.5 py-1 rounded-full border border-[#C8FF00]/20">
                    {analyticsData.categories.length} Categories
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {analyticsData.categories.map((cat, idx) => (
                    <div key={idx} className="bg-[#0D101B] border border-[#1D2332] p-3 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#F5F7FC] font-semibold">{cat.name}</span>
                        <span className="text-[#70788D] font-mono">{cat.completions} hits ({cat.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#151A29] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color || '#C8FF00',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Achievements & Personal Bests */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 sm:space-y-6">
            {/* Achievements Section */}
            <AchievementsSection
              currentStreak={bestStreak}
              totalCaloriesBurned={totalCaloriesBurned}
              totalDistanceKm={totalDistanceKm}
            />

            {/* Personal Records Cards */}
            <PersonalRecordsCard
              mostSteps={mostStepsRec}
              mostStepsDate={mostStepsDate}
              longestRun={longestRunRec}
              longestRunDate={longestRunDate}
              mostCalories={mostCaloriesRec}
              mostCaloriesDate={mostCaloriesDate}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
