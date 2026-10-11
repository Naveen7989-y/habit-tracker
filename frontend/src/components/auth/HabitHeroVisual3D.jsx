import React from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getThemeVisual } from '../../utils/themeVisuals';

/**
 * 3D Habit Showcase Component
 * Displayed on desktop views to showcase the app's visual depth,
 * interactive 3D streak rings, habit status cards, and social proof,
 * dynamically styled to match the active account theme.
 */
export default function HabitHeroVisual3D() {
  const { theme } = useTheme();
  const themeVisual = getThemeVisual(theme);

  const days = [
    { day: 'M', complete: true },
    { day: 'T', complete: true },
    { day: 'W', complete: true },
    { day: 'T', complete: true },
    { day: 'F', complete: true },
    { day: 'S', complete: true },
    { day: 'S', complete: true, active: true },
  ];

  return (
    <div className="hidden lg:flex flex-col justify-center items-start space-y-8 max-w-lg pr-6 relative select-none">
      {/* Brand & Hook */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <h1 
          className={`text-4xl xl:text-5xl font-normal leading-[1.1] tracking-tight transition-colors duration-500 ${
            themeVisual.isDark ? 'text-white' : themeVisual.textHeadingClass
          }`}
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Build unbreakable{' '}
          <em className={`not-italic font-serif transition-colors duration-500 ${themeVisual.textAccentClass}`}>
            streaks
          </em>
          .
        </h1>

        <p className={`text-sm leading-relaxed max-w-md transition-colors duration-500 ${
          themeVisual.isDark ? 'text-slate-400' : themeVisual.textMutedClass
        }`}>
          Transform daily routines into visual art. Track habits with micro-analytics, seamless momentum, and immersive visual design.
        </p>
      </motion.div>

      {/* 3D Showcase Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="w-full relative"
        style={{ perspective: 1000 }}
      >
        <div 
          className={`w-full rounded-3xl backdrop-blur-2xl p-6 space-y-5 relative overflow-hidden transition-all duration-500 border ${
            themeVisual.isDark
              ? 'bg-slate-900/60 border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]'
              : 'bg-white/95 border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)]'
          }`}
          style={{
            boxShadow: themeVisual.isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
              : '0 20px 45px -12px rgba(15, 23, 42, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
          }}
        >
          {/* Top highlight bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h4 className={`font-semibold text-sm transition-colors duration-500 ${
                  themeVisual.isDark ? 'text-white' : themeVisual.textHeadingClass
                }`}>
                  Momentum Velocity
                </h4>
                <p className={`text-xs transition-colors duration-500 ${
                  themeVisual.isDark ? 'text-slate-400' : themeVisual.textMutedClass
                }`}>
                  7-Day Perfect Streak
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              100% Rate
            </span>
          </div>

          {/* 7-Day Matrix */}
          <div className="grid grid-cols-7 gap-2 pt-1">
            {days.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                  item.active
                    ? themeVisual.isDark
                      ? 'bg-white/10 border-white/30 text-white shadow-md'
                      : 'bg-sky-50 border-sky-300 shadow-sm'
                    : themeVisual.isDark
                      ? 'bg-[#161616] border-[#2A2A2A] text-slate-200'
                      : 'bg-slate-50/80 border-slate-200/70 text-slate-800'
                }`}
                style={{
                  backgroundColor: themeVisual.isDark ? (item.active ? 'rgba(255, 255, 255, 0.1)' : '#161616') : undefined,
                  borderColor: themeVisual.isDark ? (item.active ? 'rgba(255, 255, 255, 0.3)' : '#2A2A2A') : undefined,
                }}
              >
                <span 
                  className={`text-[10px] font-bold ${
                    item.active
                      ? themeVisual.isDark
                        ? 'text-white'
                        : 'text-slate-900 font-extrabold'
                      : themeVisual.isDark
                        ? 'text-slate-200'
                        : 'text-slate-700'
                  }`}
                  style={{
                    color: themeVisual.isDark ? (item.active ? '#FFFFFF' : '#EEEEEE') : undefined,
                  }}
                >
                  {item.day}
                </span>
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500 text-white shadow-sm"
                  style={{
                    backgroundColor: item.complete ? themeVisual.accentColor : (themeVisual.isDark ? '#334155' : '#cbd5e1'),
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mini Habit Cards */}
          <div className="space-y-2.5 pt-2">
            <div 
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                themeVisual.isDark 
                  ? 'bg-[#161616] border-[#2A2A2A] hover:border-[#383838]' 
                  : 'bg-slate-50/90 border-slate-200/80 hover:border-slate-300'
              }`}
              style={{
                backgroundColor: themeVisual.isDark ? '#161616' : undefined,
                borderColor: themeVisual.isDark ? '#2A2A2A' : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ 
                    backgroundColor: themeVisual.accentColor,
                    boxShadow: `0 0 8px ${themeVisual.accentColor}`
                  }} 
                />
                <span 
                  className={`text-xs font-semibold ${
                    themeVisual.isDark ? 'text-white' : themeVisual.textHeadingClass
                  }`}
                  style={{
                    color: themeVisual.isDark ? '#FFFFFF' : undefined,
                  }}
                >
                  Deep Work & Focus
                </span>
              </div>
              <span 
                className={`text-xs font-medium ${
                  themeVisual.isDark ? 'text-slate-300' : themeVisual.textMutedClass
                }`}
                style={{
                  color: themeVisual.isDark ? '#BDBDBD' : undefined,
                }}
              >
                90m Done
              </span>
            </div>

            <div 
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                themeVisual.isDark 
                  ? 'bg-[#161616] border-[#2A2A2A] hover:border-[#383838]' 
                  : 'bg-slate-50/90 border-slate-200/80 hover:border-slate-300'
              }`}
              style={{
                backgroundColor: themeVisual.isDark ? '#161616' : undefined,
                borderColor: themeVisual.isDark ? '#2A2A2A' : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ 
                    backgroundColor: themeVisual.secondaryColor,
                    boxShadow: `0 0 8px ${themeVisual.secondaryColor}`
                  }} 
                />
                <span 
                  className={`text-xs font-semibold ${
                    themeVisual.isDark ? 'text-white' : themeVisual.textHeadingClass
                  }`}
                  style={{
                    color: themeVisual.isDark ? '#FFFFFF' : undefined,
                  }}
                >
                  Mindfulness Meditation
                </span>
              </div>
              <span 
                className={`text-xs font-medium ${
                  themeVisual.isDark ? 'text-slate-300' : themeVisual.textMutedClass
                }`}
                style={{
                  color: themeVisual.isDark ? '#BDBDBD' : undefined,
                }}
              >
                Completed
              </span>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Community proof & stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className={`flex items-center gap-4 text-xs pt-2 ${
          themeVisual.isDark ? 'text-slate-400' : themeVisual.textMutedClass
        }`}
      >
        <div className="flex -space-x-2">
          {['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80'
          ].map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Community member"
              className={`w-7 h-7 rounded-full border-2 object-cover ${
                themeVisual.isDark ? 'border-slate-900' : 'border-white shadow-xs'
              }`}
            />
          ))}
        </div>
        <div>
          <span className={`font-semibold ${
            themeVisual.isDark ? 'text-slate-200' : themeVisual.textHeadingClass
          }`}>
            12,800+ builders
          </span>{' '}
          cultivating daily clarity.
        </div>
      </motion.div>
    </div>
  );
}
