import React from 'react';
import { Link } from 'react-router-dom';
import { Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AuthLayout({ children, title, subtitle }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="p-2.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-600 hover:text-indigo-600 shadow-sm transition-all"
          title={`Switch theme (Current: ${theme === 'midnight-sea' ? 'Midnight Sea' : (theme === 'warm-horizon' ? 'Warm Horizon' : (theme === 'fresh-sky' ? 'Fresh Sky' : 'Soft Sunrise'))})`}
        >
          <Sun className={`w-4 h-4 ${
            theme === 'midnight-sea' ? 'text-[#068FFF]' : (theme === 'warm-horizon' ? 'text-[#F2765E]' : (theme === 'fresh-sky' ? 'text-sky-400' : 'text-amber-500'))
          }`} />
        </button>
      </div>

      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 py-12">
        {/* Header Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <img
              src="/logo.png"
              alt="HAbyTAT"
              className="h-14 sm:h-16 w-auto object-contain dark:bg-white/90 dark:px-3 dark:py-1.5 dark:rounded-2xl transition-all"
            />
          </Link>
          {title && <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>}
          {subtitle && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>

        {/* Content Card */}
        {children}
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
        HAbyTAT SaaS • Build habits. Build your habitat.
      </footer>
    </div>
  );
}
