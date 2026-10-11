import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getThemeVisual } from '../../utils/themeVisuals';

/**
 * 3D Floating Holographic Badges that hover around the Auth Card
 * in 3D coordinate space (translateZ + floating sine-wave keyframes),
 * dynamically themed for both dark and light accounts.
 */
export function FloatingStreakBadge({ className = '' }) {
  const { theme } = useTheme();
  const themeVisual = getThemeVisual(theme);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: [0, -8, 0],
        rotateZ: [-1, 1.5, -1],
      }}
      transition={{
        opacity: { duration: 0.6, delay: 0.3 },
        y: { repeat: Infinity, duration: 4.2, ease: 'easeInOut' },
        rotateZ: { repeat: Infinity, duration: 4.8, ease: 'easeInOut' },
      }}
      style={{
        transformStyle: 'preserve-3d',
        transform: 'translateZ(45px)',
      }}
      className={`hidden sm:flex items-center gap-3 px-3.5 py-2.5 rounded-2xl backdrop-blur-xl pointer-events-none select-none transition-all duration-500 border ${
        themeVisual.isDark
          ? 'bg-slate-900/85 border-amber-500/30 text-white shadow-[0_12px_30px_-5px_rgba(245,158,11,0.25)]'
          : 'bg-white/95 border-amber-300/80 text-slate-800 shadow-[0_12px_30px_-5px_rgba(245,158,11,0.18)]'
      } ${className}`}
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 shrink-0">
        <Flame className="w-4 h-4 fill-white" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold tracking-wide ${themeVisual.isDark ? 'text-white' : 'text-slate-900'}`}>
            14-Day Streak
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <p className={`text-[10px] font-medium ${themeVisual.isDark ? 'text-amber-200/80' : 'text-amber-700'}`}>
          Unstoppable momentum
        </p>
      </div>
    </motion.div>
  );
}

export function FloatingConsistencyBadge({ className = '' }) {
  const { theme } = useTheme();
  const themeVisual = getThemeVisual(theme);

  return (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: [0, 8, 0],
        rotateZ: [1, -1.5, 1],
      }}
      transition={{
        opacity: { duration: 0.6, delay: 0.5 },
        y: { repeat: Infinity, duration: 4.6, ease: 'easeInOut' },
        rotateZ: { repeat: Infinity, duration: 5.2, ease: 'easeInOut' },
      }}
      style={{
        transformStyle: 'preserve-3d',
        transform: 'translateZ(40px)',
      }}
      className={`hidden sm:flex items-center gap-3 px-3.5 py-2.5 rounded-2xl backdrop-blur-xl pointer-events-none select-none transition-all duration-500 border ${
        themeVisual.isDark
          ? 'bg-slate-900/85 text-white'
          : 'bg-white/95 text-slate-800 shadow-[0_12px_30px_-5px_rgba(0,0,0,0.08)]'
      } ${themeVisual.badgeGlow} ${className}`}
    >
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${themeVisual.badgeGradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
        <Sparkles className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-bold tracking-wide ${themeVisual.isDark ? 'text-white' : 'text-slate-900'}`}>
            99.4% Consistency
          </span>
        </div>
        <p className={`text-[10px] font-medium ${themeVisual.textAccentClass}`}>
          +350 XP Architecture
        </p>
      </div>
    </motion.div>
  );
}

export function FloatingSecureBadge({ className = '' }) {
  const { theme } = useTheme();
  const themeVisual = getThemeVisual(theme);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      style={{
        transformStyle: 'preserve-3d',
        transform: 'translateZ(30px)',
      }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] backdrop-blur-md transition-colors duration-500 border ${
        themeVisual.isDark
          ? 'bg-slate-800/70 border-slate-700/60 text-slate-400'
          : 'bg-slate-100/90 border-slate-200 text-slate-600'
      } ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
      <span>Encrypted & Private</span>
    </motion.div>
  );
}
