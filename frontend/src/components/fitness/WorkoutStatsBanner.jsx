import React from 'react';
import {
  Activity,
  Flame,
  Clock,
  Trophy,
  Plus,
  Timer,
  Zap,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function WorkoutStatsBanner({
  stats,
  recentWorkouts = [],
  onOpenManualModal,
  onOpenRestTimer,
}) {
  const { isDark } = useTheme();

  // Safely extract stats
  const totalWorkouts = stats?.totalWorkouts ?? recentWorkouts.length ?? 0;
  const totalDurationSeconds = stats?.totalDurationSeconds ?? recentWorkouts.reduce((acc, w) => acc + (w.durationSeconds || 0), 0);
  const totalCalories = stats?.totalCaloriesBurned ?? recentWorkouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
  const longestRunKm = stats?.longestRunKm ?? recentWorkouts.reduce((max, w) => Math.max(max, w.distanceKm || 0), 0);

  const hours = Math.floor(totalDurationSeconds / 3600);
  const mins = Math.floor((totalDurationSeconds % 3600) / 60);

  // Weekly breakdown from stats or fallback
  const weeklySeries = stats?.weeklySeries || [
    { day: 'Mon', calories: 0, hasWorkout: false },
    { day: 'Tue', calories: 0, hasWorkout: false },
    { day: 'Wed', calories: 0, hasWorkout: false },
    { day: 'Thu', calories: 0, hasWorkout: false },
    { day: 'Fri', calories: 0, hasWorkout: false },
    { day: 'Sat', calories: 0, hasWorkout: false },
    { day: 'Sun', calories: 0, hasWorkout: false },
  ];

  // Identify today's index in Mon-Sun
  const todayIdx = (new Date().getDay() + 6) % 7; // 0 for Mon, 6 for Sun
  const maxCal = Math.max(300, ...weeklySeries.map((d) => d.calories || 0));

  return (
    <div
      className={`rounded-[26px] p-5 sm:p-6 border transition-all shadow-xl relative overflow-hidden space-y-4 ${
        isDark
          ? 'bg-[#111522]/95 backdrop-blur-xl border-[#242A3A]'
          : 'bg-white border-[#E2E8F0]'
      }`}
    >
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C8FF00]/20 to-[#39E58C]/20 border border-[#C8FF00]/40 flex items-center justify-center text-[#C8FF00] shadow-[0_0_16px_rgba(200,255,0,0.2)] shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                Training Momentum & Weekly Volume
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#39E58C]/15 border border-[#39E58C]/30 text-[#39E58C]">
                Active Cycle
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-[#64748B]'}`}>
              Aggregate biological exertion, energy burn, and weekly consistency
            </p>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={onOpenRestTimer}
            className={`h-9 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-[#151A29] border-[#242A3A] text-[#C8FF00] hover:bg-[#1D2332]'
                : 'bg-slate-50 border-slate-200 text-emerald-700 hover:bg-slate-100'
            }`}
            title="Open precision rest & interval timer"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Rest Timer</span>
          </button>

          <button
            type="button"
            onClick={onOpenManualModal}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#C8FF00] to-[#39E58C] hover:brightness-110 text-[#080A12] text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Log Workout</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Stats + 7-Day Mini Bar Sparkline */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
        {/* 4 Stats Grid (8 cols on desktop) */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Total Sessions */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider">
                Sessions
              </span>
              <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" />
            </div>
            <p className={`text-xl sm:text-2xl font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
              {totalWorkouts}
            </p>
            <p className="text-[10px] text-[#70788D] mt-0.5">Total Completed</p>
          </div>

          {/* Active Duration */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider">
                Active Time
              </span>
              <Clock className="w-3.5 h-3.5 text-[#25D9E6]" />
            </div>
            <p className={`text-xl sm:text-2xl font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
              {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
            </p>
            <p className="text-[10px] text-[#70788D] mt-0.5">Under Tension</p>
          </div>

          {/* Metabolic Burn */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider">
                Energy Burn
              </span>
              <Flame className="w-3.5 h-3.5 text-[#FF5C67]" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-[#C8FF00]">
              {Math.round(totalCalories).toLocaleString()}
            </p>
            <p className="text-[10px] text-[#70788D] mt-0.5">Total Kilocalories</p>
          </div>

          {/* Longest Run / PR */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider">
                Max Distance
              </span>
              <Trophy className="w-3.5 h-3.5 text-[#FFB020]" />
            </div>
            <p className={`text-xl sm:text-2xl font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
              {longestRunKm > 0 ? `${longestRunKm} km` : '--'}
            </p>
            <p className="text-[10px] text-[#70788D] mt-0.5">Single Longest Run</p>
          </div>
        </div>

        {/* 7-Day Weekly Spark-Bars (4 cols on desktop) */}
        <div
          className={`md:col-span-4 p-3.5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#C8FF00]" />
              <span>Weekly Cadence</span>
            </span>
            <span className="text-[10px] text-[#39E58C] font-extrabold">Current Week</span>
          </div>

          <div className="flex items-end justify-between gap-1.5 h-16 pt-2 px-1">
            {weeklySeries.map((d, idx) => {
              const isToday = idx === todayIdx;
              const cal = d.calories || 0;
              const heightPct = Math.min(100, Math.max(15, Math.round((cal / maxCal) * 100)));

              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center h-10">
                    <div
                      className={`w-full max-w-[18px] rounded-t-md transition-all duration-500 ${
                        isToday
                          ? 'bg-[#C8FF00] shadow-[0_0_8px_rgba(200,255,0,0.4)]'
                          : cal > 0
                          ? 'bg-[#39E58C]'
                          : isDark
                          ? 'bg-[#1D2332]'
                          : 'bg-slate-200'
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${d.day}: ${cal} kcal`}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-bold ${
                      isToday
                        ? 'text-[#C8FF00] font-black'
                        : isDark
                        ? 'text-[#70788D]'
                        : 'text-slate-500'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
