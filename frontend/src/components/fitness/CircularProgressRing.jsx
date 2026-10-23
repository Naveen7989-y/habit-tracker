import React from 'react';

/**
 * CircularProgressRing
 * Faithfully reproduces the circular metric rings from the reference design.
 * Features neon lime (#C8FF00), cyan (#25D9E6), and electric violet (#8B5CF6) rings.
 */
export default function CircularProgressRing({
  value = 0,
  target = 100,
  unit = '',
  label = '',
  subLabel = '',
  icon: Icon = null,
  color = '#C8FF00',
  trackColor = '#151A29',
  size = 96,
  strokeWidth = 7,
  formatValue = (v) => v.toLocaleString(),
}) {
  const percentage = target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center"
        >
          {/* Background Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Active Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}55)`,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
          {Icon && (
            <Icon
              className="w-3.5 h-3.5 mb-0.5 shrink-0"
              style={{ color }}
            />
          )}
          <span className="text-sm sm:text-base font-extrabold text-[#F5F7FC] tracking-tight leading-tight">
            {formatValue(value)}
          </span>
          {target > 0 && (
            <span className="text-[10px] sm:text-[11px] font-medium text-[#70788D] leading-tight">
              /{formatValue(target)}
            </span>
          )}
        </div>
      </div>

      {/* Metric Label & Sublabel */}
      <div className="mt-2 text-center">
        <p className="text-xs font-semibold text-[#F5F7FC] leading-tight">
          {label}
        </p>
        {subLabel && (
          <p className="text-[10px] text-[#70788D] mt-0.5 leading-tight">
            {subLabel}
          </p>
        )}
      </div>
    </div>
  );
}
