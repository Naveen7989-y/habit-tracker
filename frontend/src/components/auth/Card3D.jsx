import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { getThemeVisual } from '../../utils/themeVisuals';

/**
 * 3D Interactive Tilt Card Container
 * Features:
 * - Real-time physics tilt on mouse movement with spring physics
 * - Dynamic specular light reflection sheen
 * - Preserve-3D coordinate space with z-depth layer projection
 * - Dynamic theme rim lighting & glow tailored to active account theme
 */
export default function Card3D({ children, className = '' }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();
  const themeVisual = getThemeVisual(theme);

  // Normalized mouse values (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for natural inertia
  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 22 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 22 });

  // 3D rotation angles
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['9deg', '-9deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-9deg', '9deg']);

  // Specular reflection position percentages
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full relative flex items-center justify-center"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? 1.015 : 1,
        }}
        transition={{
          scale: { duration: 0.25, ease: 'easeOut' },
        }}
        className={`relative w-full rounded-3xl backdrop-blur-2xl transition-all duration-500 ${
          themeVisual.isDark
            ? `bg-slate-900/80 border border-slate-700/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] ${
                isHovered ? 'shadow-[0_25px_70px_-10px_rgba(0,0,0,0.5)]' : ''
              }`
            : `bg-white/95 border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.1)] ${
                isHovered ? 'shadow-[0_30px_70px_-10px_rgba(15,23,42,0.16)]' : ''
              }`
        } ${className}`}
      >
        {/* Animated Gradient Rim Light dynamically matching active Theme */}
        <div 
          className="absolute -inset-[1px] rounded-3xl pointer-events-none transition-all duration-700"
          style={{
            background: themeVisual.borderRimGradient,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            padding: '1.2px',
            opacity: isHovered ? 0.95 : 0.6,
          }}
        />

        {/* Dynamic Specular Sheen Glare */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.6 : 0,
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(circle 320px at ${gx} ${gy}, ${
                  themeVisual.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.6)'
                }, transparent 70%)`
            ),
          }}
        />

        {/* Inner Content with Preserve-3D Container */}
        <div 
          className="relative z-10 w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
