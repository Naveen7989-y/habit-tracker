import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dumbbell, UtensilsCrossed, Flame } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

/**
 * MobileModuleToggle
 * A sleek, high-density 3-way toggle button for mobile view.
 * Allows quick 1-tap switching between the three core pillars:
 * 1. Workout (/workouts)
 * 2. Nutrition (/nutrition)
 * 3. Habit (/habits)
 */
export default function MobileModuleToggle({ active, className = '' }) {
  const location = useLocation();
  const { isDark } = useTheme();

  // Auto-detect current active module if not explicitly provided
  const currentActive =
    active ||
    (location.pathname.startsWith('/workout')
      ? 'workout'
      : location.pathname.startsWith('/nutrition')
      ? 'nutrition'
      : location.pathname.startsWith('/habit')
      ? 'habit'
      : 'workout');

  const modules = [
    {
      id: 'workout',
      label: 'Workout',
      path: '/workouts',
      icon: Dumbbell,
    },
    {
      id: 'nutrition',
      label: 'Nutrition',
      path: '/nutrition',
      icon: UtensilsCrossed,
    },
    {
      id: 'habit',
      label: 'Habit',
      path: '/habits',
      icon: Flame,
    },
  ];

  return (
    <div
      className={`w-full max-w-sm mx-auto p-1 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-1 shadow-sm ${
        isDark
          ? 'bg-[#0D101B]/95 border-[#1D2332]'
          : 'bg-slate-100/90 border-slate-200'
      } ${className}`}
    >
      {modules.map((m) => {
        const Icon = m.icon;
        const isActive = currentActive === m.id;

        return (
          <Link
            key={m.id}
            to={m.path}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-200 select-none ${
              isActive
                ? isDark
                  ? 'bg-[#C8FF00] text-[#080A12] shadow-[0_0_12px_rgba(200,255,0,0.3)] scale-[1.02]'
                  : 'bg-teal-700 text-white shadow-sm shadow-teal-900/20 scale-[1.02]'
                : isDark
                ? 'text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29]/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="capitalize">{m.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

