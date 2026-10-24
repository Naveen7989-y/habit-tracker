import React, { useMemo } from 'react';
import { Footprints, Plus, Minus, TrendingUp, Sparkles } from 'lucide-react';

/**
 * StepTrackerCard:
 * Real-time daily pedometer, cadence visualizer, and step telemetry card.
 * Balances the dashboard layout height while providing instant step logging and withdrawal.
 */
export default function StepTrackerCard({
  steps = 0,
  target = 10000,
  onAddSteps,
  onWithdrawSteps,
  isLoading = false,
}) {
  const percentage = Math.min(100, Math.round((steps / target) * 100));
  const distanceKm = ((steps * 0.00075) || 0).toFixed(2);
  const caloriesBurned = Math.round(steps * 0.04);

  // Cadence status descriptor
  const cadenceStatus = useMemo(() => {
    if (steps === 0) return { label: 'Standby', color: 'text-[#70788D]', bg: 'bg-[#70788D]/10' };
    if (steps < 3500) return { label: 'Gentle Walk', color: 'text-[#25D9E6]', bg: 'bg-[#25D9E6]/10' };
    if (steps < 7500) return { label: 'Brisk Pace', color: 'text-[#FFB020]', bg: 'bg-[#FFB020]/10' };
    return { label: 'Peak Cadence', color: 'text-[#39E58C]', bg: 'bg-[#39E58C]/10' };
  }, [steps]);

  // Hourly visualizer blocks: 08:00 to 18:00
  const hourlyCadence = useMemo(() => {
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    if (steps === 0) {
      return hours.map((hour) => ({ hour, heightPercent: 12, isCurrent: false }));
    }
    // Distribute actual steps across the timeline realistically
    return hours.map((hour, idx) => {
      const weight = [0.1, 0.25, 0.2, 0.15, 0.2, 0.1][idx];
      const barSteps = Math.round(steps * weight);
      const heightPercent = Math.min(100, Math.max(16, Math.round((barSteps / (target / 5)) * 100)));
      return {
        hour,
        barSteps,
        heightPercent,
        isCurrent: idx === 3,
      };
    });
  }, [steps, target]);

  return (
    <div className="bg-[#111522]/90 backdrop-blur-xl border border-[#242A3A] hover:border-[#25D9E6]/40 rounded-[26px] p-4 sm:p-5 flex flex-col justify-between space-y-3.5 shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#25D9E6]/15 border border-[#25D9E6]/30 flex items-center justify-center text-[#25D9E6] shadow-[0_0_12px_rgba(37,217,230,0.2)]">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#F5F7FC] flex items-center gap-1.5">
              <span>Step Counter & Cadence</span>
              {steps >= target && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#39E58C]/15 border border-[#39E58C]/30 text-[#39E58C] font-semibold">
                  Goal Met
                </span>
              )}
            </h3>
            <p className="text-[10px] text-[#70788D]">Daily walking telemetry</p>
          </div>
        </div>

        {/* Quick Step Buttons with Withdraw Option */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Withdraw Steps Button */}
          <button
            type="button"
            onClick={() => onWithdrawSteps && onWithdrawSteps(500)}
            disabled={isLoading || steps <= 0}
            className="px-2 py-1 rounded-lg bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] hover:bg-[#FF453A]/25 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
            title="Withdraw 500 Steps (Undo)"
          >
            <Minus className="w-3 h-3" />
            <span>500</span>
          </button>

          {/* Add 500 Steps */}
          <button
            type="button"
            onClick={() => onAddSteps && onAddSteps(500)}
            disabled={isLoading}
            className="px-2 py-1 rounded-lg bg-[#25D9E6]/15 border border-[#25D9E6]/30 text-[#25D9E6] hover:bg-[#25D9E6]/25 disabled:opacity-50 text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
            title="Log +500 Steps"
          >
            <Plus className="w-3 h-3" />
            <span>500</span>
          </button>

          {/* Add 1,000 Steps */}
          <button
            type="button"
            onClick={() => onAddSteps && onAddSteps(1000)}
            disabled={isLoading}
            className="px-2 py-1 rounded-lg bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-[#C8FF00] hover:bg-[#C8FF00]/25 disabled:opacity-50 text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer transition-all"
            title="Log +1,000 Steps"
          >
            <Plus className="w-3 h-3" />
            <span>1k</span>
          </button>
        </div>
      </div>

      {/* Main Value & Percentage Bar */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#F5F7FC] tracking-tight">
              {steps.toLocaleString()}
            </span>
            <span className="text-xs text-[#70788D]">
              / {target.toLocaleString()} steps
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border border-current/20 ${cadenceStatus.color} ${cadenceStatus.bg}`}>
              {percentage}% Goal
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#151A29] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#25D9E6] via-[#39E58C] to-[#C8FF00] rounded-full transition-all duration-500 shadow-[0_0_8px_#25D9E6]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Micro Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-0.5">
        <div className="bg-[#0D101B]/80 p-2 rounded-xl border border-[#1D2332]">
          <span className="text-[10px] text-[#A4AABC] font-medium block">Distance</span>
          <span className="text-xs font-bold text-[#F5F7FC]">{distanceKm} km</span>
        </div>

        <div className="bg-[#0D101B]/80 p-2 rounded-xl border border-[#1D2332]">
          <span className="text-[10px] text-[#A4AABC] font-medium block">Active Burn</span>
          <span className="text-xs font-bold text-[#39E58C]">{caloriesBurned} kcal</span>
        </div>

        <div className="bg-[#0D101B]/80 p-2 rounded-xl border border-[#1D2332]">
          <span className="text-[10px] text-[#A4AABC] font-medium block">Cadence</span>
          <span className={`text-xs font-bold ${cadenceStatus.color}`}>{cadenceStatus.label}</span>
        </div>
      </div>

      {/* Hourly Timeline Mini-Bars */}
      <div className="pt-1 border-t border-[#1D2332]/60">
        <div className="flex items-center justify-between text-[10px] text-[#70788D] mb-1.5 font-medium">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#25D9E6]" />
            <span>Hourly Activity Cadence</span>
          </span>
          <span>{steps > 0 ? 'Pedometer Sync Active' : 'Sensor Standby'}</span>
        </div>

        <div className="flex items-end justify-between gap-1.5 h-10 px-1 pt-1 bg-[#0D101B]/50 rounded-xl border border-[#1D2332]/50">
          {hourlyCadence.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              <div
                className={`w-full rounded-md transition-all duration-300 ${
                  steps === 0
                    ? 'bg-[#151A29]'
                    : 'bg-gradient-to-t from-[#25D9E6]/40 to-[#25D9E6] group-hover:from-[#25D9E6] group-hover:to-[#39E58C]'
                }`}
                style={{ height: `${h.heightPercent}%` }}
              />
              <span className="text-[8px] text-[#70788D] mt-0.5 font-medium scale-90">{h.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
