import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Logo({ className = "h-9 w-auto object-contain transition-all", alt = "HAbyTAT", variant }) {
  const { theme } = useTheme();
  const isDark = variant ? variant === 'dark' : theme === 'midnight-sea';

  return (
    <img
      src={isDark ? "/logo-dark.png" : "/logo.png"}
      alt={alt}
      className={className}
    />
  );
}
