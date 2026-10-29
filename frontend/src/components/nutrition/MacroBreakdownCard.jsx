import React from 'react';
import { Flame, PieChart, Activity, Zap, Info, ShieldCheck, Dumbbell, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function MacroBreakdownCard({
  totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  goals = { dailyCalories: 2000, proteinGrams: 125, carbsGrams: 225, fatGrams: 65, fiberGrams: 30 },
  percentage = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  workoutCaloriesBurned = 0,
}) {
  const { isDark } = useTheme();

  const dailyGoal = goals?.dailyCalories || 2000;
  const foodEaten = totals?.calories || 0;
  const exerciseBurn = workoutCaloriesBurned || 0;
  // Net energy equation: Remaining = Goal - Eaten + Burned
  const netRemaining = Math.max(0, dailyGoal - foodEaten + exerciseBurn);
  const caloriePercentClamped = Math.min(100, Math.round((foodEaten / dailyGoal) * 100));

  // Macro calorie contributions
  const proteinCals = Math.round((totals?.protein || 0) * 4);
  const carbsCals = Math.round((totals?.carbs || 0) * 4);
  const fatCals = Math.round((totals?.fat || 0) * 9);
  const totalMacroCals = proteinCals + carbsCals + fatCals || 1;

  const proteinRatio = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsRatio = Math.round((carbsCals / totalMacroCals) * 100);
  const fatRatio = Math.round((fatCals / totalMacroCals) * 100);

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(100, caloriePercentClamped)) / 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Left Card: Radial Energy Balance & Equation (5 cols) */}
      <div
        className={`lg:col-span-5 rounded-[26px] p-5 sm:p-6 border transition-all shadow-xl flex flex-col justify-between ${
          isDark
            ? 'bg-[#111522]/90 backdrop-blur-xl border-[#242A3A]'
            : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FFBF47]/15 text-[#FFBF47] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                Daily Energy Balance
              </h3>
            </div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30 uppercase tracking-wider">
              {caloriePercentClamped}% Target
            </span>
          </div>

          {/* Radial Calorie Gauge */}
          <div className="flex items-center justify-around py-2">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  className={isDark ? 'stroke-[#1D2332]' : 'stroke-slate-200'}
                  strokeWidth="9"
                  fill="none"
                />
                <circle
                  cx="65"
                  cy="65"
                  r={radius}
                  stroke="#C8FF00"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                  {foodEaten.toLocaleString()}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#70788D] mt-1">
                  Kcal Eaten
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#70788D] tracking-wider">Daily Budget</p>
                <p className={`text-base font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                  {dailyGoal.toLocaleString()} kcal
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-[#70788D] tracking-wider">Active Workout Burn</p>
                <p className="text-base font-black text-[#FF5C67] flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>+{exerciseBurn} kcal</span>
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-[#70788D] tracking-wider">Net Remaining</p>
                <p className="text-lg font-black text-[#C8FF00]">
                  {netRemaining.toLocaleString()} kcal
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Energy Equation Bar */}
        <div className={`mt-4 pt-3 border-t text-[11px] flex items-center justify-between font-bold ${
          isDark ? 'border-[#1D2332] text-[#A4AABC]' : 'border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-1">
            <span>Goal</span>
            <span className="text-xs text-[#F5F7FC] dark:text-white font-extrabold">{dailyGoal}</span>
          </div>
          <span>-</span>
          <div className="flex items-center gap-1">
            <span>Food</span>
            <span className="text-xs text-[#FFBF47] font-extrabold">{foodEaten}</span>
          </div>
          <span>+</span>
          <div className="flex items-center gap-1">
            <span>Burn</span>
            <span className="text-xs text-[#FF5C67] font-extrabold">{exerciseBurn}</span>
          </div>
          <span>=</span>
          <div className="flex items-center gap-1 text-[#C8FF00] font-black">
            <span>Rem.</span>
            <span className="text-xs">{netRemaining}</span>
          </div>
        </div>
      </div>

      {/* 2. Right Card: Detailed Macronutrients & Split (7 cols) */}
      <div
        className={`lg:col-span-7 rounded-[26px] p-5 sm:p-6 border transition-all shadow-xl flex flex-col justify-between space-y-4 ${
          isDark
            ? 'bg-[#111522]/90 backdrop-blur-xl border-[#242A3A]'
            : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#39E58C]/15 text-[#39E58C] flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                Macronutrient Target Split
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                Optimal anabolic protein synthesis & clean glycogen replenishment
              </p>
            </div>
          </div>

          {/* Ratio Split Badge */}
          <div className={`px-2.5 py-1 rounded-xl border text-[10px] font-extrabold flex items-center gap-1.5 ${
            isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[#39E58C]">{proteinRatio}% P</span>
            <span className="text-[#70788D]">•</span>
            <span className="text-[#FFBF47]">{carbsRatio}% C</span>
            <span className="text-[#70788D]">•</span>
            <span className="text-[#FF5C67]">{fatRatio}% F</span>
          </div>
        </div>

        {/* 4 Macro Bars */}
        <div className="space-y-3.5 my-auto">
          {/* Protein */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#39E58C] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#39E58C]" />
                <span>Protein</span>
                <span className="text-[10px] opacity-75 font-normal">({proteinCals} kcal)</span>
              </span>
              <span className={isDark ? 'text-[#A4AABC]' : 'text-slate-600'}>
                <strong className={isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}>{totals.protein}g</strong> / {goals.proteinGrams}g ({percentage.protein}%)
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-100 border-slate-200'}`}>
              <div
                className="bg-[#39E58C] h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(57,229,140,0.3)]"
                style={{ width: `${Math.min(100, percentage.protein)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#FFBF47] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF47]" />
                <span>Carbohydrates</span>
                <span className="text-[10px] opacity-75 font-normal">({carbsCals} kcal)</span>
              </span>
              <span className={isDark ? 'text-[#A4AABC]' : 'text-slate-600'}>
                <strong className={isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}>{totals.carbs}g</strong> / {goals.carbsGrams}g ({percentage.carbs}%)
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-100 border-slate-200'}`}>
              <div
                className="bg-[#FFBF47] h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(255,191,71,0.3)]"
                style={{ width: `${Math.min(100, percentage.carbs)}%` }}
              />
            </div>
          </div>

          {/* Fats */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#FF5C67] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5C67]" />
                <span>Healthy Fats</span>
                <span className="text-[10px] opacity-75 font-normal">({fatCals} kcal)</span>
              </span>
              <span className={isDark ? 'text-[#A4AABC]' : 'text-slate-600'}>
                <strong className={isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}>{totals.fat}g</strong> / {goals.fatGrams}g ({percentage.fat}%)
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-100 border-slate-200'}`}>
              <div
                className="bg-[#FF5C67] h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(255,92,103,0.3)]"
                style={{ width: `${Math.min(100, percentage.fat)}%` }}
              />
            </div>
          </div>

          {/* Dietary Fiber */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-[#25D9E6] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#25D9E6]" />
                <span>Dietary Fiber</span>
              </span>
              <span className={isDark ? 'text-[#A4AABC]' : 'text-slate-600'}>
                <strong className={isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}>{totals.fiber}g</strong> / {goals.fiberGrams}g ({percentage.fiber}%)
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-100 border-slate-200'}`}>
              <div
                className="bg-[#25D9E6] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, percentage.fiber)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Nutritional Quality Tags */}
        <div className={`pt-2 border-t flex flex-wrap items-center justify-between text-[11px] ${
          isDark ? 'border-[#1D2332] text-[#70788D]' : 'border-slate-200 text-slate-500'
        }`}>
          <span className="flex items-center gap-1 text-[#39E58C] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Mifflin-St Jeor Calibrated</span>
          </span>
          <span className="flex items-center gap-1 text-[#C8FF00] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ICMR-NIN Data Certified</span>
          </span>
        </div>
      </div>
    </div>
  );
}
