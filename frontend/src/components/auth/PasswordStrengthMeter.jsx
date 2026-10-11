import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

export default function PasswordStrengthMeter({ password = '' }) {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasLength, hasUpperLower, hasNumber, hasSpecial].filter(Boolean).length;

  const strengthLabels = ['Too weak', 'Weak', 'Moderate', 'Strong', 'Bulletproof'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-400',
    'bg-indigo-400',
    'bg-emerald-400',
  ];
  const textColor = [
    'text-red-400',
    'text-orange-400',
    'text-amber-400',
    'text-indigo-400',
    'text-emerald-400',
  ][score];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-2 pt-1"
      style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}
    >
      {/* Bars */}
      <div className="flex items-center justify-between gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden relative"
          >
            <motion.div
              initial={false}
              animate={{
                width: index < score ? '100%' : '0%',
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`h-full rounded-full ${strengthColors[score] || 'bg-slate-700'}`}
            />
          </div>
        ))}
      </div>

      {/* Label and tips */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Password Strength:</span>
        <span className={`font-semibold transition-colors ${textColor}`}>
          {strengthLabels[score]}
        </span>
      </div>

      {/* Checklist items in a compact grid */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 pt-0.5">
        <div className={`flex items-center gap-1 ${hasLength ? 'text-emerald-400' : 'text-slate-500'}`}>
          {hasLength ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
          <span>8+ characters</span>
        </div>
        <div className={`flex items-center gap-1 ${hasUpperLower ? 'text-emerald-400' : 'text-slate-500'}`}>
          {hasUpperLower ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
          <span>Mixed case</span>
        </div>
        <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
          {hasNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
          <span>Number</span>
        </div>
        <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
          {hasSpecial ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
          <span>Special symbol</span>
        </div>
      </div>
    </motion.div>
  );
}
