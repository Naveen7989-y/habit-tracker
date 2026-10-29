import React, { useRef } from 'react';
import { Droplets, Plus, Minus, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Interactive Water Hydration Station with animated cup visualizer & Web Audio sound
 */
export default function WaterTrackerCard({
  waterData = { totalMl: 0, targetMl: 2500, percentage: 0, glassesCount: 0 },
  onLogWater,
}) {
  const { isDark } = useTheme();
  const audioCtxRef = useRef(null);

  const totalMl = waterData?.totalMl || 0;
  const targetMl = waterData?.targetMl || 2500;
  const percentage = Math.min(100, Math.round((totalMl / targetMl) * 100));

  // 1 glass = 250ml
  const glassVolume = 250;
  const totalGlassesTarget = Math.ceil(targetMl / glassVolume);
  const glassesConsumed = Math.floor(totalMl / glassVolume);

  // Play a gentle water droplet sound
  const playWaterChime = (frequency = 600) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  const handleAdd = (amount) => {
    playWaterChime(amount > 0 ? 650 : 400);
    if (onLogWater) {
      onLogWater(amount);
    }
  };

  // Status message
  let statusMessage = 'Stay hydrated throughout the day';
  if (percentage >= 100) {
    statusMessage = '🎉 Daily hydration goal achieved! Excellent work.';
  } else if (percentage >= 75) {
    statusMessage = '💧 Nearly there! Just a couple more glasses.';
  } else if (percentage >= 50) {
    statusMessage = '👍 Halfway to optimal cellular hydration.';
  } else if (percentage >= 25) {
    statusMessage = '🌊 Good start, keep sipping regularly.';
  }

  // Circular ring calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <div
      className={`rounded-[26px] p-5 sm:p-6 border transition-all shadow-xl relative overflow-hidden ${
        isDark
          ? 'bg-[#111522]/90 backdrop-blur-xl border-[#242A3A]'
          : 'bg-white border-[#E2E8F0]'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#25D9E6]/15 border border-[#25D9E6]/30 flex items-center justify-center text-[#25D9E6] shadow-[0_0_12px_rgba(37,217,230,0.2)]">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                Hydration Station
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#25D9E6]/15 text-[#25D9E6] border border-[#25D9E6]/30">
                {percentage}% Goal
              </span>
            </div>
            <p className={`text-xs ${isDark ? 'text-[#A4AABC]' : 'text-slate-500'}`}>
              {statusMessage}
            </p>
          </div>
        </div>

        {/* Quick Volume Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAdd(250)}
            className="px-3 py-1.5 rounded-xl bg-[#25D9E6]/15 hover:bg-[#25D9E6]/25 text-[#25D9E6] border border-[#25D9E6]/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Log 1 Cup (250ml)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>250ml</span>
          </button>

          <button
            type="button"
            onClick={() => handleAdd(500)}
            className="px-3 py-1.5 rounded-xl bg-[#25D9E6] hover:bg-[#1fbecc] text-[#080A12] text-xs font-black shadow-md shadow-[#25D9E6]/20 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Log 1 Bottle (500ml)"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>500ml Bottle</span>
          </button>

          <button
            type="button"
            onClick={() => handleAdd(750)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-[#151A29] border-[#242A3A] text-[#A4AABC] hover:text-[#25D9E6]'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-cyan-700 hover:bg-slate-100'
            }`}
            title="Log Flask (750ml)"
          >
            +750ml
          </button>

          {totalMl > 0 && (
            <button
              type="button"
              onClick={() => handleAdd(-250)}
              className={`p-1.5 rounded-xl border text-xs transition-all active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-[#151A29] border-[#242A3A] text-[#70788D] hover:text-rose-400'
                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-600'
              }`}
              title="Undo last 250ml"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Hydration Progress Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Left: Circular Progress Ring & Numbers */}
        <div className="md:col-span-5 flex items-center justify-around p-3.5 rounded-2xl border bg-gradient-to-r from-[#25D9E6]/5 to-transparent border-[#25D9E6]/20">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r={radius}
                className={isDark ? 'stroke-[#1D2332]' : 'stroke-slate-200'}
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="45"
                cy="45"
                r={radius}
                stroke="#25D9E6"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-[#25D9E6] leading-none">
                {percentage}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#70788D] mt-0.5">
                Daily Goal
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#70788D]">Intake Target</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                {totalMl.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#70788D]">/ {targetMl.toLocaleString()} ml</span>
            </div>
            <p className="text-[11px] text-[#25D9E6] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>{glassesConsumed} of {totalGlassesTarget} glasses logged</span>
            </p>
          </div>
        </div>

        {/* Right: Interactive 10-Glass Matrix */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
              Intake Breakdown (1 Cup = 250ml)
            </span>
            <span className="text-[11px] font-semibold text-[#70788D]">
              Remaining: {Math.max(0, targetMl - totalMl)} ml
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isFilled = idx < glassesConsumed;
              const isNext = idx === glassesConsumed;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAdd(isFilled ? -250 : 250)}
                  className={`h-14 rounded-xl border flex flex-col items-center justify-between p-1.5 transition-all cursor-pointer relative group ${
                    isFilled
                      ? 'bg-[#25D9E6]/20 border-[#25D9E6] text-[#25D9E6] shadow-[0_0_8px_rgba(37,217,230,0.25)]'
                      : isNext
                      ? isDark
                        ? 'bg-[#151A29] border-[#25D9E6]/50 text-[#25D9E6] hover:bg-[#25D9E6]/10'
                        : 'bg-cyan-50/60 border-cyan-300 text-cyan-600 hover:bg-cyan-100'
                      : isDark
                      ? 'bg-[#0D101B] border-[#1D2332] text-[#70788D] hover:border-[#242A3A]'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                  }`}
                  title={isFilled ? `Cup ${idx + 1} logged (Click to undo)` : `Click to log Cup ${idx + 1} (250ml)`}
                >
                  <span className="text-[9px] font-bold opacity-75">#{idx + 1}</span>
                  <Droplets
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isFilled ? 'fill-current' : ''
                    }`}
                  />
                  <span className="text-[8px] font-black">{isFilled ? 'Done' : '250ml'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
