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

// Weekly Grouped Data matching Screen 3 visual reference:
// Mon, Tue, Wed, Thu, Fri, Sat, Sun with Steps (Lime), Calories (Violet), Time (Cyan)
const DEFAULT_WEEKLY_SERIES = [
  { day: 'Mon', steps: 11000, calories: 4800, time: 45 },
  { day: 'Tue', steps: 8500, calories: 3600, time: 35 },
  { day: 'Wed', steps: 12000, calories: 5200, time: 50 },
  { day: 'Thu', steps: 13500, calories: 6100, time: 60 },
  { day: 'Fri', steps: 9500, calories: 4200, time: 40 },
  { day: 'Sat', steps: 11500, calories: 5000, time: 55 },
  { day: 'Sun', steps: 12500, calories: 5400, time: 45 },
];

const DEFAULT_MONTHLY_SERIES = [
  { day: 'W1', steps: 72000, calories: 32000, time: 310 },
  { day: 'W2', steps: 84000, calories: 38000, time: 350 },
  { day: 'W3', steps: 79000, calories: 35000, time: 320 },
  { day: 'W4', steps: 91000, calories: 42000, time: 390 },
];

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

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

  const chartData = period === 'Week' ? DEFAULT_WEEKLY_SERIES : DEFAULT_MONTHLY_SERIES;

  // Real values for achievements
  const bestStreak = analyticsData?.streaks?.bestCurrentStreak || 7;
  const totalCaloriesBurned = workoutStats?.totalCaloriesBurned || 10450;

  // Real values for personal records
  const longestRunRec = workoutStats?.personalRecords?.longestRun?.value || '7.8 km';
  const longestRunDate = workoutStats?.personalRecords?.longestRun?.date || 'May 19, 2024';
  const mostCaloriesRec = workoutStats?.personalRecords?.mostCalories?.value || '845 Kcal';
  const mostCaloriesDate = workoutStats?.personalRecords?.mostCalories?.date || 'May 22, 2024';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto w-full pt-2 sm:pt-4 space-y-4 sm:space-y-5">
        {/* A. Analytics Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[#111522] border border-[#242A3A] text-[#F5F7FC] flex items-center justify-center hover:bg-[#151A29] transition-colors"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-[#F5F7FC] tracking-tight">
            Analytics
          </h1>

          <div className="w-10 h-10 rounded-xl bg-[#111522] border border-[#242A3A] text-[#C8FF00] flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
        </div>

        {/* B. Week / Month Segmented Control */}
        <div className="bg-[#0D101B] border border-[#1D2332] p-1 rounded-2xl flex items-center justify-between max-w-xs mx-auto w-full">
          <button
            onClick={() => setPeriod('Week')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              period === 'Week'
                ? 'bg-[#151A29] text-[#C8FF00] border border-[#C8FF00]/40 shadow-[0_0_10px_rgba(200,255,0,0.15)]'
                : 'text-[#70788D] hover:text-[#A4AABC]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('Month')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              period === 'Month'
                ? 'bg-[#151A29] text-[#C8FF00] border border-[#C8FF00]/40 shadow-[0_0_10px_rgba(200,255,0,0.15)]'
                : 'text-[#70788D] hover:text-[#A4AABC]'
            }`}
          >
            Month
          </button>
        </div>

        {/* C. Period Overview & Grouped Bar Chart Card */}
        <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F5F7FC]">
              This {period} Overview
            </h3>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D101B] border border-[#1D2332] text-xs font-medium text-[#A4AABC]">
              <span>{period === 'Week' ? 'May 18 – May 24' : 'May 2026'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#70788D]" />
            </div>
          </div>

          {/* Grouped Bar Chart */}
          <div className="h-56 sm:h-64 w-full -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                barGap={3}
              >
                <CartesianGrid
                  stroke="#1D2332"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  stroke="#70788D"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1D2332' }}
                />

                <YAxis
                  stroke="#70788D"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${val / 1000}K` : val)}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0D101B] border border-[#242A3A] p-2.5 rounded-xl shadow-2xl text-xs space-y-1">
                          <p className="font-bold text-[#F5F7FC] border-b border-[#1D2332] pb-1">
                            {label}
                          </p>
                          {payload.map((entry, idx) => (
                            <p key={idx} className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
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
                {/* 1. Steps (Neon Lime #C8FF00) */}
                <Bar
                  dataKey="steps"
                  name="Steps"
                  fill="#C8FF00"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />

                {/* 2. Active Calories (Electric Violet #8B5CF6) */}
                <Bar
                  dataKey="calories"
                  name="Active Calories (Kcal)"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />

                {/* 3. Active Time (Cyan #25D9E6) */}
                <Bar
                  dataKey="time"
                  name="Active Time (min)"
                  fill="#25D9E6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Matching Reference Image */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-[11px] text-[#A4AABC]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C8FF00]" />
              <span>Steps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />
              <span>Active Calories (Kcal)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#25D9E6]" />
              <span>Active Time (min)</span>
            </div>
          </div>
        </div>

        {/* D. Achievements Section (Screen 3 Reference) */}
        <AchievementsSection
          currentStreak={bestStreak}
          totalCaloriesBurned={totalCaloriesBurned}
        />

        {/* E. Personal Records Cards (Screen 3 Reference) */}
        <PersonalRecordsCard
          mostSteps="12,842"
          mostStepsDate="May 20, 2024"
          longestRun={longestRunRec}
          longestRunDate={longestRunDate}
          mostCalories={mostCaloriesRec}
          mostCaloriesDate={mostCaloriesDate}
        />

        {/* F. Deep Habit Breakdown Section (Preserves existing analytics!) */}
        {analyticsData?.categories && analyticsData.categories.length > 0 && (
          <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#A4AABC] uppercase tracking-wider">
              Habits by Category
            </h3>
            <div className="space-y-2">
              {analyticsData.categories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F5F7FC] font-semibold">{cat.name}</span>
                    <span className="text-[#70788D]">{cat.completions} completions ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#151A29] overflow-hidden">
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
    </DashboardLayout>
  );
}
