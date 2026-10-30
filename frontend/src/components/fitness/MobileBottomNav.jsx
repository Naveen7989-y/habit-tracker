import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Dumbbell,
  UtensilsCrossed,
  Flame,
  BarChart2,
  User,
  ChevronUp,
} from 'lucide-react';
import useTheme from '../../hooks/useTheme';

/**
 * MobileBottomNav
 * 4-Item Fixed Bottom Navigation Bar for Mobile View.
 * In place of the static Workouts button, it features an interactive 3-way Module Toggle
 * that dynamically displays and switches between:
 * 1. Workout (/workouts)
 * 2. Nutrition (/nutrition)
 * 3. Habit (/habits)
 */
export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [isToggleOpen, setIsToggleOpen] = useState(false);

  // Close toggle menu on route change
  useEffect(() => {
    setIsToggleOpen(false);
  }, [location.pathname]);

  const isWorkoutActive = location.pathname.startsWith('/workout');
  const isNutritionActive = location.pathname.startsWith('/nutrition');
  const isHabitActive = location.pathname.startsWith('/habit');
  const isModuleActive = isWorkoutActive || isNutritionActive || isHabitActive;

  // Active module identity
  const currentModule = isNutritionActive
    ? { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed, path: '/nutrition' }
    : isHabitActive
    ? { id: 'habit', label: 'Habit', icon: Flame, path: '/habits' }
    : { id: 'workout', label: 'Workout', icon: Dumbbell, path: '/workouts' };

  // Three selectable modules
  const moduleOptions = [
    { id: 'workout', label: 'Workout', path: '/workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', path: '/nutrition', icon: UtensilsCrossed },
    { id: 'habit', label: 'Habit', path: '/habits', icon: Flame },
  ];

  const handleToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsToggleOpen((prev) => !prev);
  };

  const handleSelectModule = (path) => {
    setIsToggleOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop for Toggle Popover */}
      {isToggleOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsToggleOpen(false)}
        />
      )}

      {/* Floating 3-Way Module Toggle Popover displaying [Workout, Nutrition, Habit] */}
      {isToggleOpen && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-50 md:hidden w-[92%] max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`p-2 rounded-2xl border shadow-2xl backdrop-blur-xl ${
              isDark
                ? 'bg-[#111522]/95 border-[#242A3A] text-[#F5F7FC]'
                : 'bg-white/95 border-slate-200 text-[#0F172A]'
            }`}
          >
            <div className="flex items-center justify-between px-2 pb-1.5 border-b border-current/10 mb-1.5">
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  isDark ? 'text-[#70788D]' : 'text-slate-500'
                }`}
              >
                Select Active Module
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isDark ? 'bg-[#C8FF00]/10 text-[#C8FF00]' : 'bg-teal-50 text-teal-800'
                }`}
              >
                3 Available
              </span>
            </div>

            {/* Segmented Toggle Buttons: Workout, Nutrition, Habit */}
            <div className="grid grid-cols-3 gap-1.5">
              {moduleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected =
                  (opt.id === 'workout' && isWorkoutActive) ||
                  (opt.id === 'nutrition' && isNutritionActive) ||
                  (opt.id === 'habit' && isHabitActive);

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectModule(opt.path)}
                    type="button"
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-black tracking-tight transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#C8FF00] text-[#080A12] shadow-[0_0_12px_rgba(200,255,0,0.35)] scale-[1.02]'
                          : 'bg-teal-700 text-white shadow-md shadow-teal-900/20 scale-[1.02]'
                        : isDark
                        ? 'bg-[#151A29] text-[#A4AABC] hover:text-white hover:bg-[#1D2332]'
                        : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    <span className="text-[11px] font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pointer caret arrow pointing down to the toggle button */}
          <div className="flex justify-center -mt-1 pointer-events-none">
            <div
              className={`w-3 h-3 rotate-45 border-r border-b ${
                isDark
                  ? 'bg-[#111522] border-[#242A3A]'
                  : 'bg-white border-slate-200'
              }`}
            />
          </div>
        </div>
      )}

      {/* 4-Item Fixed Bottom Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-30 md:hidden border-t backdrop-blur-xl px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] transition-colors duration-200 ${
          isDark
            ? 'bg-[#080A12]/95 border-[#1D2332]'
            : 'bg-white/95 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
        }`}
      >
        <div className="max-w-md mx-auto grid grid-cols-4 items-center justify-around">
          {/* 1. Dashboard */}
          <Link
            to="/dashboard"
            className={`relative flex flex-col items-center justify-center py-1 transition-all duration-200 ${
              location.pathname === '/dashboard'
                ? isDark
                  ? 'text-[#C8FF00]'
                  : 'text-teal-700'
                : isDark
                ? 'text-[#70788D] hover:text-[#A4AABC]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {location.pathname === '/dashboard' && (
              <span
                className={`absolute -top-1 w-6 h-0.5 rounded-full ${
                  isDark
                    ? 'bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]'
                    : 'bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.4)]'
                }`}
              />
            )}
            <Home
              className={`w-5 h-5 transition-transform ${
                location.pathname === '/dashboard' ? 'scale-110' : ''
              }`}
            />
            <span className="text-[10px] font-semibold tracking-tight mt-1">Dashboard</span>
          </Link>

          {/* 2. TOGGLE BUTTON IN PLACE OF WORKOUT BUTTON (Displays Workout, Nutrition, Habit) */}
          <button
            type="button"
            onClick={handleToggleClick}
            className={`relative flex flex-col items-center justify-center py-1 transition-all duration-200 cursor-pointer ${
              isModuleActive || isToggleOpen
                ? isDark
                  ? 'text-[#C8FF00]'
                  : 'text-teal-700'
                : isDark
                ? 'text-[#70788D] hover:text-[#A4AABC]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Toggle between Workout, Nutrition, and Habit modules"
          >
            {/* Active indicator dot or glow */}
            {isModuleActive && (
              <span
                className={`absolute -top-1 w-6 h-0.5 rounded-full ${
                  isDark
                    ? 'bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]'
                    : 'bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.4)]'
                }`}
              />
            )}

            <div className="relative">
              <Compass
                className={`w-5 h-5 transition-transform ${
                  isModuleActive || isToggleOpen ? 'scale-110' : ''
                }`}
                style={
                  isModuleActive && isDark
                    ? { filter: 'drop-shadow(0 0 6px rgba(200,255,0,0.4))' }
                    : {}
                }
              />
              {/* Mini Toggle Pill Indicator */}
              <span
                className={`absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black border transition-transform ${
                  isToggleOpen ? 'rotate-180' : ''
                } ${
                  isDark
                    ? 'bg-[#151A29] border-[#242A3A] text-[#C8FF00]'
                    : 'bg-slate-100 border-slate-200 text-teal-700'
                }`}
              >
                <ChevronUp className="w-2.5 h-2.5" />
              </span>
            </div>

            <span className="text-[10px] font-semibold tracking-tight mt-1 flex items-center gap-0.5">
              Explore
            </span>
          </button>

          {/* 3. Analytics */}
          <Link
            to="/statistics"
            className={`relative flex flex-col items-center justify-center py-1 transition-all duration-200 ${
              location.pathname === '/statistics' || location.pathname.startsWith('/analytics')
                ? isDark
                  ? 'text-[#C8FF00]'
                  : 'text-teal-700'
                : isDark
                ? 'text-[#70788D] hover:text-[#A4AABC]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {(location.pathname === '/statistics' || location.pathname.startsWith('/analytics')) && (
              <span
                className={`absolute -top-1 w-6 h-0.5 rounded-full ${
                  isDark
                    ? 'bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]'
                    : 'bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.4)]'
                }`}
              />
            )}
            <BarChart2
              className={`w-5 h-5 transition-transform ${
                location.pathname === '/statistics' || location.pathname.startsWith('/analytics')
                  ? 'scale-110'
                  : ''
              }`}
            />
            <span className="text-[10px] font-semibold tracking-tight mt-1">Analytics</span>
          </Link>

          {/* 4. Profile */}
          <Link
            to="/settings"
            className={`relative flex flex-col items-center justify-center py-1 transition-all duration-200 ${
              location.pathname === '/settings' || location.pathname.startsWith('/profile')
                ? isDark
                  ? 'text-[#C8FF00]'
                  : 'text-teal-700'
                : isDark
                ? 'text-[#70788D] hover:text-[#A4AABC]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {(location.pathname === '/settings' || location.pathname.startsWith('/profile')) && (
              <span
                className={`absolute -top-1 w-6 h-0.5 rounded-full ${
                  isDark
                    ? 'bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]'
                    : 'bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.4)]'
                }`}
              />
            )}
            <User
              className={`w-5 h-5 transition-transform ${
                location.pathname === '/settings' || location.pathname.startsWith('/profile')
                  ? 'scale-110'
                  : ''
              }`}
            />
            <span className="text-[10px] font-semibold tracking-tight mt-1">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
