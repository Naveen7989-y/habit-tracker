import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Dumbbell,
  BarChart2,
  User,
  UtensilsCrossed,
  ListTodo,
  Calendar,
  Layers,
  X,
} from 'lucide-react';

/**
 * MobileBottomNav
 * 4-Item Fixed Bottom Navigation Bar inspired by the reference design:
 * 1. Dashboard (Home)
 * 2. Workouts (Dumbbell)
 * 3. Analytics (BarChart)
 * 4. Profile (User)
 *
 * Includes an accessible quick-drawer to reach Nutrition, Habits, and Calendar.
 */
export default function MobileBottomNav() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainTabs = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Workouts', path: '/workouts', icon: Dumbbell },
    { label: 'Analytics', path: '/statistics', altPath: '/analytics', icon: BarChart2 },
    { label: 'Profile', path: '/settings', altPath: '/profile', icon: User },
  ];

  const isTabActive = (tab) => {
    if (tab.altPath && location.pathname.startsWith(tab.altPath)) return true;
    return location.pathname === tab.path;
  };

  return (
    <>
      {/* Quick Drawer Overlay for Habits & Nutrition */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute bottom-20 left-4 right-4 bg-[#111522] border border-[#242A3A] rounded-3xl p-4 shadow-2xl space-y-2 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#1D2332] px-1">
              <span className="text-xs font-bold text-[#A4AABC] uppercase tracking-wider">
                More Features
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-full text-[#70788D] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <Link
                to="/nutrition"
                onClick={() => setDrawerOpen(false)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  location.pathname === '/nutrition'
                    ? 'bg-[#C8FF00]/15 border-[#C8FF00] text-[#C8FF00]'
                    : 'bg-[#0D101B] border-[#1D2332] text-[#A4AABC] hover:text-white'
                }`}
              >
                <UtensilsCrossed className="w-5 h-5 mb-1 text-[#C8FF00]" />
                <span className="text-[11px] font-semibold">Nutrition</span>
              </Link>

              <Link
                to="/habits"
                onClick={() => setDrawerOpen(false)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  location.pathname === '/habits'
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-[#8B5CF6]'
                    : 'bg-[#0D101B] border-[#1D2332] text-[#A4AABC] hover:text-white'
                }`}
              >
                <ListTodo className="w-5 h-5 mb-1 text-[#8B5CF6]" />
                <span className="text-[11px] font-semibold">All Habits</span>
              </Link>

              <Link
                to="/calendar"
                onClick={() => setDrawerOpen(false)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  location.pathname === '/calendar'
                    ? 'bg-[#25D9E6]/15 border-[#25D9E6] text-[#25D9E6]'
                    : 'bg-[#0D101B] border-[#1D2332] text-[#A4AABC] hover:text-white'
                }`}
              >
                <Calendar className="w-5 h-5 mb-1 text-[#25D9E6]" />
                <span className="text-[11px] font-semibold">Calendar</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating More Features Pill on Mobile (Corner helper) */}
      <div className="fixed bottom-20 right-4 z-30 md:hidden">
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="w-10 h-10 rounded-full bg-[#151A29]/95 border border-[#242A3A] text-[#C8FF00] shadow-[0_4px_16px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform active:scale-95"
          title="More HAByTAT tools"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* 4-Item Fixed Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[#080A12]/95 border-t border-[#1D2332] backdrop-blur-xl px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center justify-around">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(tab);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`relative flex flex-col items-center justify-center py-1 transition-all duration-200 ${
                  active ? 'text-[#C8FF00]' : 'text-[#70788D] hover:text-[#A4AABC]'
                }`}
              >
                {/* Active indicator dot or glow */}
                {active && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]" />
                )}
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active ? 'scale-110' : ''
                  }`}
                  style={active ? { filter: 'drop-shadow(0 0 6px rgba(200,255,0,0.4))' } : {}}
                />
                <span className="text-[10px] font-semibold tracking-tight mt-1">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
