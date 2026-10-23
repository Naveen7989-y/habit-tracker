import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Dumbbell,
  BarChart2,
  User,
} from 'lucide-react';

/**
 * MobileBottomNav
 * 4-Item Fixed Bottom Navigation Bar inspired by the reference design:
 * 1. Dashboard (Home)
 * 2. Workouts (Dumbbell)
 * 3. Analytics (BarChart)
 * 4. Profile (User)
 */
export default function MobileBottomNav() {
  const location = useLocation();

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
      {/* 4-Item Fixed Bottom Bar matching Reference Screens */}

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
