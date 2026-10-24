import React from 'react';

/**
 * CircularProgressRing
 * Premium cyber-fitness circular telemetry ring with neon gradients,
 * radial glow backdrop, and responsive percentage pills.
 */
export default function CircularProgressRing({
  value = 0,
  target = 100,
  unit = '',
  label = '',
  subLabel = '',
  icon: Icon = null,
  color = '#C8FF00',
  gradientTo = null,
  trackColor = '#151A29',
  size = 112,
  strokeWidth = 9,
  formatValue = (v) => v.toLocaleString(),
}) {
  const percentage = target > 0 ? Math.min(100, Math.max(0, Math.round((value / target) * 100))) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Unique gradient ID based on label to prevent clashes
  const gradId = `ring-grad-${label.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
  const endColor = gradientTo || color;

  return (
    <div className="flex flex-col items-center justify-center text-center select-none group transition-transform duration-300 hover:scale-[1.03]">
      <div
        className="relative flex items-center justify-center rounded-full p-2 transition-all duration-300"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
        }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center overflow-visible"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
            <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="opacity-70"
          />

          {/* Active Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            filter={percentage > 0 ? `url(#glow-${gradId})` : undefined}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center pointer-events-none">
          {Icon && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center mb-0.5 shadow-sm transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            </div>
          )}
          <span className="text-base sm:text-lg font-black text-[#F5F7FC] tracking-tight leading-none">
            {formatValue(value)}
          </span>
          {target > 0 && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-[#70788D] leading-tight mt-0.5">
              /{formatValue(target)}
            </span>
          )}
        </div>
      </div>

      {/* Metric Label & Percentage Pill */}
      <div className="mt-2 text-center space-y-0.5">
        <p className="text-xs sm:text-sm font-bold text-[#F5F7FC] leading-tight">
          {label}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <span
            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: `${color}15`,
              borderColor: `${color}35`,
              color: color,
            }}
          >
            {percentage}%
          </span>
          {subLabel && (
            <span className="text-[10px] text-[#70788D] font-medium hidden sm:inline">
              {subLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
