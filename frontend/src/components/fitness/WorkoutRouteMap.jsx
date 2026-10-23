import React from 'react';
import { Navigation, MapPin, Flag } from 'lucide-react';

/**
 * WorkoutRouteMap
 * Renders an outdoor running/cycling route trace on a sleek dark surface,
 * matching Screen 2 of the reference image.
 */
export default function WorkoutRouteMap({
  coordinates = null,
  distanceKm = 5.2,
  interactive = false,
}) {
  // If coordinates are provided, we can parse them, otherwise render the reference trace curve
  let parsedCoords = [];
  if (coordinates) {
    try {
      parsedCoords = typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates;
    } catch (e) {
      parsedCoords = [];
    }
  }

  return (
    <div className="relative w-full h-44 sm:h-52 bg-[#080A12] rounded-2xl border border-[#1D2332] overflow-hidden select-none flex items-center justify-center">
      {/* Dark Map Grid & Topographic lines background */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mapGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#242A3A" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)" />
        {/* Subtle contour curves */}
        <circle cx="80%" cy="30%" r="90" fill="none" stroke="#1D2332" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="80%" cy="30%" r="140" fill="none" stroke="#1D2332" strokeWidth="0.8" strokeDasharray="4 4" />
        <circle cx="20%" cy="80%" r="110" fill="none" stroke="#1D2332" strokeWidth="1" strokeDasharray="3 3" />
      </svg>

      {/* GPS Trace Path SVG */}
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full relative z-10 p-4"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="routeLimeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#39E58C" />
            <stop offset="40%" stopColor="#C8FF00" />
            <stop offset="100%" stopColor="#C8FF00" />
          </linearGradient>

          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient road paths for map realism */}
        <path
          d="M 20 60 Q 100 40 180 80 T 310 90"
          fill="none"
          stroke="#151A29"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 50 160 Q 120 120 220 140 T 300 130"
          fill="none"
          stroke="#151A29"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* The Active GPS Running Route - Exact curve from reference image */}
        <path
          d="M 120 145 C 105 130, 95 110, 115 95 C 135 80, 165 110, 190 75 C 210 45, 230 65, 255 35"
          fill="none"
          stroke="url(#routeLimeGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#routeGlow)"
        />

        {/* Start Point Pin (Green circle with pulse) */}
        <circle cx="120" cy="145" r="7" fill="#39E58C" fillOpacity="0.3" className="animate-ping origin-center" />
        <circle cx="120" cy="145" r="4.5" fill="#39E58C" stroke="#080A12" strokeWidth="1.5" />

        {/* End / Current Point (Finish Pin with checkered / gold style) */}
        <g transform="translate(255, 35)">
          <circle cx="0" cy="0" r="8" fill="#C8FF00" fillOpacity="0.25" />
          <circle cx="0" cy="0" r="5" fill="#C8FF00" stroke="#080A12" strokeWidth="1.5" />
          {/* Checkered pattern inside pin */}
          <circle cx="0" cy="0" r="2.5" fill="#080A12" />
        </g>
      </svg>

      {/* GPS Active Watermark Indicator */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111522]/90 border border-[#242A3A] backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF00] animate-pulse" />
        <span className="text-[10px] font-bold text-[#F5F7FC] tracking-wider uppercase">
          GPS Active
        </span>
      </div>

      {/* Distance Overlay bottom-left */}
      <div className="absolute bottom-2.5 left-3 z-20 flex items-center gap-1 text-[11px] text-[#A4AABC] bg-[#0D101B]/80 px-2 py-0.5 rounded-md border border-[#1D2332]">
        <Navigation className="w-3 h-3 text-[#25D9E6]" />
        <span>Outdoor Route Trace ({distanceKm} km)</span>
      </div>
    </div>
  );
}
