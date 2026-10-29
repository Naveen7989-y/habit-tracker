import React from 'react';
import { Activity, Footprints, Flame, Moon, ArrowUpRight, Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * ActivitySummaryCard
 * Cyber-fitness biomarker strip with 4 interactive telemetry tiles.
 */
export default function ActivitySummaryCard({
  distanceKm = 0,
  activeCalories = 0,
  workoutCount = 0,
  sleepHours = '--',
}) {
  const tiles = [
    {
      label: 'Distance',
      sub: 'GPS Telemetry',
      value: distanceKm > 0 ? `${distanceKm} km` : '0 km',
      icon: Footprints,
      color: '#25D9E6',
    },
    {
      label: 'Active Burn',
      sub: 'Metabolic Energy',
      value: activeCalories > 0 ? `${activeCalories.toLocaleString()} Kcal` : '0 Kcal',
      icon: Flame,
      color: '#C8FF00',
    },
    {
      label: 'Sessions',
      sub: 'Workouts Today',
      value: workoutCount > 0 ? `${workoutCount} Done` : '0 Done',
      icon: Dumbbell,
      color: '#A855F7',
    },
    {
      label: 'Sleep Recovery',
      sub: 'Rest & Repair',
      value: sleepHours,
      icon: Moon,
      color: '#60A5FA',
    },
  ];

  return (
    <div className="bg-[#111522]/90 backdrop-blur-xl border border-[#242A3A] hover:border-[#8B5CF6]/40 rounded-[24px] p-4 sm:p-5 relative overflow-hidden transition-all duration-300 shadow-xl group">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center shrink-0 shadow-md">
            <Activity className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F7FC] tracking-tight">
              Biomarker Telemetry
            </h3>
            <p className="text-[11px] text-[#70788D]">
              Real-time daily activity & physiological output
            </p>
          </div>
        </div>

        <Link
          to="/workouts"
          className="text-xs font-bold text-[#C8FF00] hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Track Workout</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Equal Responsive Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {tiles.map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <div
              key={idx}
              className="bg-[#0D101B]/80 border border-[#1D2332] hover:border-[#242A3A] rounded-2xl p-3 flex flex-col justify-between transition-all hover:bg-[#151A29]/70 group/tile"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#A4AABC]">
                  {tile.label}
                </span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover/tile:scale-110"
                  style={{
                    backgroundColor: `${tile.color}15`,
                    color: tile.color,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <p className="text-base sm:text-lg font-black font-mono text-[#F5F7FC] tracking-tight leading-tight">
                  {tile.value}
                </p>
                <p className="text-[10px] text-[#70788D] mt-0.5 font-medium">
                  {tile.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
