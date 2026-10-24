import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Logo({ className = "h-10 sm:h-12 w-auto object-contain transition-all", alt = "HAbyTAT", variant }) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = variant ? variant === 'dark' : themeIsDark;

  return (
    <img
      src={isDark ? "/logo-dark.png" : "/logo.png"}
      alt={alt}
      className={className}
    />
  );
}
