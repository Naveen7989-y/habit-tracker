import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Volume2, VolumeX, X, Plus, Minus, BellRing } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * High-precision Rest Timer with Web Audio synthesizer chimes & SVG progress ring
 */
export default function RestTimerHUD({
  isOpen = false,
  onClose,
  initialSeconds = 60,
  exerciseName = '',
  autoStart = false,
}) {
  const { isDark } = useTheme();
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Initialize or reset when initialSeconds changes
  useEffect(() => {
    setTotalSeconds(initialSeconds);
    setRemainingSeconds(initialSeconds);
    if (autoStart) {
      setIsRunning(true);
    }
  }, [initialSeconds, autoStart]);

  // Audio synthesizer via Web Audio API
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq, duration, type = 'sine', gainVal = 0.15) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContext might be blocked until user interaction
    }
  };

  const playCountdownBeep = () => {
    playTone(520, 0.12, 'sine', 0.18);
  };

  const playFinishChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      // 3-tone ascending chord: E5, G#5, B5 (approx 659, 830, 987 Hz)
      [659.25, 830.61, 987.77].forEach((freq, index) => {
        setTimeout(() => {
          playTone(freq, 0.45, 'triangle', 0.22);
        }, index * 120);
      });
    } catch (e) {}
  };

  // Timer Tick Interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playFinishChime();
            return 0;
          }

          // Sound warning on 3, 2, 1 seconds
          if (prev <= 4 && prev > 1) {
            playCountdownBeep();
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  if (!isOpen) return null;

  const progressFraction = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  const formatMinSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePresetSelect = (sec) => {
    setTotalSeconds(sec);
    setRemainingSeconds(sec);
    setIsRunning(true);
  };

  const handleAdjustTime = (delta) => {
    setRemainingSeconds((prev) => {
      const next = Math.max(5, prev + delta);
      setTotalSeconds((tot) => Math.max(next, tot));
      return next;
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const presets = [30, 45, 60, 90, 120, 180];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 border relative transition-all ${
          isDark
            ? 'bg-[#111522] border-[#242A3A] text-[#F5F7FC]'
            : 'bg-white border-[#E2E8F0] text-[#0F172A]'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.2)]">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Rest & Recovery Timer</h3>
              <p className={`text-[10px] ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                {exerciseName ? `Set recovery for: ${exerciseName}` : 'Optimal intra-set muscle ATP resynthesis'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                soundEnabled
                  ? isDark ? 'bg-[#151A29] border-[#242A3A] text-[#C8FF00]' : 'bg-slate-100 border-slate-200 text-emerald-700'
                  : isDark ? 'bg-[#151A29] border-[#242A3A] text-[#70788D]' : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                isDark ? 'bg-[#151A29] border-[#242A3A] text-[#70788D] hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Circular Countdown Ring */}
        <div className="flex flex-col items-center justify-center py-2 relative">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
              {/* Background Ring */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className={isDark ? 'stroke-[#1D2332]' : 'stroke-slate-200'}
                strokeWidth="8"
                fill="none"
              />
              {/* Foreground Animated Ring */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={remainingSeconds === 0 ? '#39E58C' : '#C8FF00'}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{
                  transition: 'stroke-dashoffset 0.85s linear, stroke 0.3s ease',
                }}
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className={`text-4xl font-black tracking-tight leading-none ${
                  remainingSeconds === 0 ? 'text-[#39E58C] animate-bounce' : 'text-[#C8FF00]'
                }`}
              >
                {formatMinSec(remainingSeconds)}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full ${
                  remainingSeconds === 0
                    ? 'bg-[#39E58C]/20 text-[#39E58C]'
                    : isRunning
                    ? 'text-[#C8FF00] bg-[#C8FF00]/10'
                    : isDark ? 'text-[#70788D]' : 'text-slate-500'
                }`}
              >
                {remainingSeconds === 0 ? 'Ready to Lift!' : isRunning ? 'Resting...' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Quick +/- 15s adjuster */}
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => handleAdjustTime(-15)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#0D101B] border-[#1D2332] text-[#A4AABC] hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Minus className="w-3 h-3" />
              <span>15s</span>
            </button>
            <button
              type="button"
              onClick={() => handleAdjustTime(15)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#0D101B] border-[#1D2332] text-[#A4AABC] hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>15s</span>
            </button>
          </div>
        </div>

        {/* Preset Duration Buttons */}
        <div className="space-y-1.5">
          <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
            Quick Presets
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {presets.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handlePresetSelect(sec)}
                className={`py-1.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  totalSeconds === sec
                    ? 'bg-[#C8FF00] text-[#080A12] border-[#C8FF00] shadow-sm font-black'
                    : isDark
                    ? 'bg-[#0D101B] border-[#1D2332] text-[#A4AABC] hover:border-[#242A3A] hover:text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {sec < 60 ? `${sec}s` : `${sec / 60}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-[#1D2332]">
          <button
            type="button"
            onClick={handleReset}
            className={`py-3 px-3 rounded-2xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-[#151A29] border-[#242A3A] text-[#A4AABC] hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="py-3 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 bg-[#C8FF00] hover:bg-[#b8eb00] text-[#080A12] shadow-lg shadow-[#C8FF00]/20 active:scale-95 transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-[#080A12]" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-[#080A12]" />
                <span>{remainingSeconds === 0 ? 'Restart' : 'Resume'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
