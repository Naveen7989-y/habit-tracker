import React, { useState } from 'react';
import { Award, Flame, Zap, Trophy, X, Check, Lock } from 'lucide-react';

/**
 * AchievementsSection
 * Faithfully reproduces the hexagonal badge achievements from Screen 3 of the reference image:
 * - Badge 1: Neon Lime glowing crest with "7" (Streak 7 Days)
 * - Badge 2: Electric Violet glowing crest with "10K" (Burn 10k Calories)
 */
export default function AchievementsSection({
  currentStreak = 7,
  totalCaloriesBurned = 10450,
}) {
  const [modalOpen, setModalOpen] = useState(false);

  // Determine unlock status based on real user data
  const isStreak7Unlocked = currentStreak >= 7;
  const isBurn10kUnlocked = totalCaloriesBurned >= 10000;

  const ALL_ACHIEVEMENTS = [
    {
      id: 'streak-7',
      title: 'Streak 7 Days',
      description: 'Great job! Keep the streak going.',
      badgeText: '7',
      color: '#C8FF00',
      unlocked: isStreak7Unlocked,
      progress: Math.min(7, currentStreak),
      max: 7,
      unit: 'days',
    },
    {
      id: 'burn-10k',
      title: 'Burn 10k Calories',
      description: "You've burned 10,000 calories. Amazing!",
      badgeText: '10K',
      color: '#8B5CF6',
      unlocked: isBurn10kUnlocked,
      progress: Math.min(10000, totalCaloriesBurned),
      max: 10000,
      unit: 'kcal',
    },
    {
      id: 'streak-30',
      title: 'Consistency King',
      description: 'Maintain a 30-day continuous habit streak.',
      badgeText: '30D',
      color: '#25D9E6',
      unlocked: currentStreak >= 30,
      progress: Math.min(30, currentStreak),
      max: 30,
      unit: 'days',
    },
    {
      id: 'marathon',
      title: 'Half Marathon Pioneer',
      description: 'Complete 21.1 km cumulative outdoor distance.',
      badgeText: '21K',
      color: '#FFBF47',
      unlocked: true,
      progress: 21.1,
      max: 21.1,
      unit: 'km',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-[#F5F7FC] tracking-tight">
          Achievements
        </h3>
        <button
          onClick={() => setModalOpen(true)}
          className="text-xs font-semibold text-[#70788D] hover:text-[#C8FF00] transition-colors"
        >
          View All
        </button>
      </div>

      {/* 2 Hexagonal Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Streak 7 Days (Lime) */}
        <div
          onClick={() => setModalOpen(true)}
          className="cursor-pointer bg-[#111522] border border-[#242A3A] hover:border-[#C8FF00]/40 rounded-[20px] p-3.5 sm:p-4 flex flex-col items-center text-center transition-all duration-200 group"
        >
          {/* Hexagonal Lime Badge Crest */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-2.5">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_0_12px_rgba(200,255,0,0.35)]"
            >
              <polygon
                points="50,5 90,25 90,75 50,95 10,75 10,25"
                fill="#151A29"
                stroke="#C8FF00"
                strokeWidth="4"
              />
              <polygon
                points="50,14 82,30 82,70 50,86 18,70 18,30"
                fill="#C8FF00"
                fillOpacity="0.12"
                stroke="#C8FF00"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl font-black text-[#C8FF00] tracking-tight leading-none">
                7
              </span>
              <span className="text-[9px] text-[#C8FF00]/80 tracking-widest font-bold">
                DAYS
              </span>
            </div>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-[#F5F7FC] tracking-tight">
            Streak 7 Days
          </h4>
          <p className="text-[11px] text-[#70788D] mt-1 leading-snug line-clamp-2">
            Great job! Keep the streak going.
          </p>
        </div>

        {/* Card 2: Burn 10k Calories (Violet) */}
        <div
          onClick={() => setModalOpen(true)}
          className="cursor-pointer bg-[#111522] border border-[#242A3A] hover:border-[#8B5CF6]/40 rounded-[20px] p-3.5 sm:p-4 flex flex-col items-center text-center transition-all duration-200 group"
        >
          {/* Hexagonal Violet Badge Crest */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-2.5">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]"
            >
              <polygon
                points="50,5 90,25 90,75 50,95 10,75 10,25"
                fill="#151A29"
                stroke="#8B5CF6"
                strokeWidth="4"
              />
              <polygon
                points="50,14 82,30 82,70 50,86 18,70 18,30"
                fill="#8B5CF6"
                fillOpacity="0.12"
                stroke="#8B5CF6"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg sm:text-xl font-black text-[#8B5CF6] tracking-tight leading-none">
                10K
              </span>
              <span className="text-[9px] text-[#8B5CF6]/80 tracking-widest font-bold">
                KCAL
              </span>
            </div>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-[#F5F7FC] tracking-tight">
            Burn 10k Calories
          </h4>
          <p className="text-[11px] text-[#70788D] mt-1 leading-snug line-clamp-2">
            You've burned 10,000 calories. Amazing!
          </p>
        </div>
      </div>

      {/* Modal: View All Achievements */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D101B] border border-[#242A3A] w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1D2332] mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#C8FF00]" />
                <h3 className="text-base font-bold text-[#F5F7FC]">
                  All Milestones & Badges
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-[#70788D] hover:text-white hover:bg-[#151A29]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {ALL_ACHIEVEMENTS.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                    ach.unlocked
                      ? 'bg-[#111522] border-[#242A3A]'
                      : 'bg-[#080A12] border-[#1D2332] opacity-60'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                    style={{
                      backgroundColor: `${ach.color}15`,
                      border: `1.5px solid ${ach.color}50`,
                      color: ach.color,
                    }}
                  >
                    {ach.badgeText}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                        {ach.title}
                      </h4>
                      {ach.unlocked ? (
                        <span className="text-[10px] font-bold text-[#39E58C] flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#70788D] flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#70788D] mt-0.5">
                      {ach.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
