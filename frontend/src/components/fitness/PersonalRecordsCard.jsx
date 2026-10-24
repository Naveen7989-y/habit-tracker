import React from 'react';
import { Trophy, Footprints, Navigation, Flame } from 'lucide-react';

/**
 * PersonalRecordsCard
 * Faithfully reproduces the Personal Records section from Screen 3 of reference image:
 * - Most Steps (e.g. 12,842 / May 20, 2024)
 * - Longest Run (e.g. 7.8 km / May 19, 2024)
 * - Most Calories (e.g. 845 Kcal / May 22, 2024)
 */
export default function PersonalRecordsCard({
  mostSteps = '0',
  mostStepsDate = '--',
  longestRun = '0 km',
  longestRunDate = '--',
  mostCalories = '0 Kcal',
  mostCaloriesDate = '--',
}) {
  const records = [
    {
      label: 'Most Steps',
      value: mostSteps,
      date: mostStepsDate,
      icon: Footprints,
      color: '#C8FF00',
    },
    {
      label: 'Longest Run',
      value: longestRun,
      date: longestRunDate,
      icon: Navigation,
      color: '#25D9E6',
    },
    {
      label: 'Most Calories',
      value: mostCalories,
      date: mostCaloriesDate,
      icon: Flame,
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-[#FFBF47]" />
        <h3 className="text-sm sm:text-base font-bold text-[#F5F7FC] tracking-tight">
          Personal Records
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {records.map((rec, idx) => {
          const Icon = rec.icon;
          return (
            <div
              key={idx}
              className="bg-[#111522] border border-[#242A3A] rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between text-left transition-all hover:border-[#242A3A]/80"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-[11px] font-medium text-[#70788D] truncate">
                  {rec.label}
                </span>
                <Icon className="w-3 h-3 shrink-0" style={{ color: rec.color }} />
              </div>
              <span className="text-sm sm:text-base font-black text-[#F5F7FC] tracking-tight truncate">
                {rec.value}
              </span>
              <span className="text-[9px] sm:text-[10px] text-[#70788D] mt-1 truncate">
                {rec.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
