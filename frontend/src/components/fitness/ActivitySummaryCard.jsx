import React from 'react';
import { Activity, Footprints, Flame, Moon, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * ActivitySummaryCard
 * Faithfully reproduces the 3-column Activity Summary card from Screen 1 of reference image:
 * - Distance (e.g. 2.4 km)
 * - Active Calories (e.g. 310)
 * - Sleep (e.g. 7 h 32 m)
 */
export default function ActivitySummaryCard({
  distanceKm = 0,
  activeCalories = 0,
  sleepHours = '7 h 32 m',
}) {
  return (
    <div className="bg-[#111522] border border-[#242A3A] rounded-[22px] p-4 sm:p-5 relative overflow-hidden transition-all duration-200 hover:border-[#242A3A]/80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F5F7FC] tracking-tight">
              Activity Summary
            </h3>
            <p className="text-[11px] text-[#70788D]">
              Today's Biomarkers
            </p>
          </div>
        </div>

        <Link
          to="/workouts"
          className="text-xs font-medium text-[#C8FF00] hover:underline flex items-center gap-1"
        >
          <span>Workouts</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3 Equal Columns */}
      <div className="grid grid-cols-3 divide-x divide-[#1D2332] bg-[#0D101B] border border-[#1D2332] rounded-2xl py-3 px-2 text-center">
        {/* Column 1: Distance */}
        <div className="px-2 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[#25D9E6] mb-1">
            <Footprints className="w-3.5 h-3.5" />
          </div>
          <span className="text-base sm:text-lg font-black text-[#F5F7FC] tracking-tight">
            {distanceKm > 0 ? `${distanceKm} km` : '0 km'}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-[#70788D] mt-0.5">
            Distance
          </span>
        </div>

        {/* Column 2: Active Calories */}
        <div className="px-2 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[#C8FF00] mb-1">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <span className="text-base sm:text-lg font-black text-[#F5F7FC] tracking-tight">
            {activeCalories > 0 ? activeCalories.toLocaleString() : '0'}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-[#70788D] mt-0.5">
            Active Calories
          </span>
        </div>

        {/* Column 3: Sleep */}
        <div className="px-2 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-[#8B5CF6] mb-1">
            <Moon className="w-3.5 h-3.5" />
          </div>
          <span className="text-base sm:text-lg font-black text-[#F5F7FC] tracking-tight">
            {sleepHours}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-[#70788D] mt-0.5">
            Sleep
          </span>
        </div>
      </div>
    </div>
  );
}
