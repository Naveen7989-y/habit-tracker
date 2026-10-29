import React from 'react';
import { ShieldCheck, CheckCircle2, ChefHat, Sparkles, User, AlertCircle } from 'lucide-react';

/**
 * Stage 3 Data Quality Badge
 * Visual indicator for provenance and calculation reliability
 */
export const QUALITY_CONFIG = {
  SOURCE_VERIFIED: {
    label: 'Verified Lab Source',
    shortLabel: 'ICMR / USDA',
    description: 'Directly sourced from published clinical food composition tables (ICMR-NIN IFCT 2017 or USDA FoodData Central).',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: ShieldCheck,
  },
  CALCULATION_VALIDATED: {
    label: 'Formula Validated',
    shortLabel: 'Validated',
    description: 'Mathematically scaled with verified proportional equations from an authoritative standard.',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    icon: CheckCircle2,
  },
  RECIPE_ESTIMATED: {
    label: 'Recipe Cooked Yield',
    shortLabel: 'Cooked Yield',
    description: 'Calculated from composite raw ingredients with cooked weight yield and water absorption modeling.',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: ChefHat,
  },
  AI_ESTIMATED: {
    label: 'AI Photo Estimated',
    shortLabel: 'AI Estimated',
    description: 'Identified via visual model. Portion gram weight carries 2D volumetric uncertainty and requires user confirmation.',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    icon: Sparkles,
  },
  USER_PROVIDED: {
    label: 'User Custom',
    shortLabel: 'Custom',
    description: 'Custom food item entered by the user.',
    bg: 'bg-slate-500/15',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
    icon: User,
  },
  NEEDS_REVIEW: {
    label: 'Needs Review',
    shortLabel: 'Review',
    description: 'Nutritional data is preliminary and requires verification.',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    icon: AlertCircle,
  },
};

export default function DataQualityBadge({ quality = 'SOURCE_VERIFIED', compact = false, showTooltip = false }) {
  const config = QUALITY_CONFIG[quality] || QUALITY_CONFIG.CALCULATION_VALIDATED;
  const Icon = config.icon;

  return (
    <span
      title={showTooltip ? config.description : undefined}
      className={`inline-flex items-center gap-1 font-semibold rounded-full border transition-colors ${
        config.bg
      } ${config.text} ${config.border} ${
        compact ? 'px-1.5 py-0.2 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
    >
      <Icon className={compact ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0'} />
      <span>{compact ? config.shortLabel : config.label}</span>
    </span>
  );
}

