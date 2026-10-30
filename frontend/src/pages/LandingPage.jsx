import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import { adminService } from '../services/admin.service';
import {
  Flame,
  Zap,
  Dumbbell,
  UtensilsCrossed,
  Activity,
  Footprints,
  Clock,
  Sparkles,
  Bot,
  Heart,
  CheckCircle2,
  Circle,
  ArrowRight,
  Shield,
  TrendingUp,
  Calendar,
  Layers,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  User,
  Megaphone,
  X,
  Target,
  BarChart3,
  Award,
  Play,
  RotateCcw,
  Bike,
} from 'lucide-react';

// Real Athletic Disciplines supported inside the HAbyTAT studio
const DISCIPLINES = [
  {
    id: 'Running',
    name: 'Road & Track Running',
    category: 'Cardio',
    image: '/workouts/running.jpg',
    badge: 'VO2 Max Pacing',
    color: '#C8FF00',
    zone: 'Zone 3-4 (Aerobic)',
    burnRate: '11 - 16 kcal/min',
    muscles: 'Quads, Calves, Glutes',
  },
  {
    id: 'Strength',
    name: 'Strength & Hypertrophy',
    category: 'Strength',
    image: '/workouts/strength.jpg',
    badge: 'Mechanical Tension',
    color: '#8B5CF6',
    zone: 'Anaerobic Strength',
    burnRate: '7 - 11 kcal/min',
    muscles: 'Chest, Lats, Quads, Delts',
  },
  {
    id: 'HIIT',
    name: 'HIIT & Tabata Intervals',
    category: 'Intervals',
    image: '/workouts/hiit.jpg',
    badge: 'EPOC Afterburn',
    color: '#25D9E6',
    zone: 'Zone 4-5 (Peak Anaerobic)',
    burnRate: '14 - 19 kcal/min',
    muscles: 'Full Kinetic Chain',
  },
  {
    id: 'Calisthenics',
    name: 'Gymnastic Calisthenics',
    category: 'Bodyweight',
    image: '/workouts/calisthenics.jpg',
    badge: 'Relative Strength',
    color: '#39E58C',
    zone: 'Neuromuscular Power',
    burnRate: '8 - 12 kcal/min',
    muscles: 'Upper Body & Core',
  },
  {
    id: 'Boxing',
    name: 'Boxing & Strike Conditioning',
    category: 'Combat',
    image: '/workouts/boxing.jpg',
    badge: 'Rotational Power',
    color: '#FF5C67',
    zone: 'Zone 4 (Threshold)',
    burnRate: '12 - 17 kcal/min',
    muscles: 'Core, Delts, Kinetic Chain',
  },
  {
    id: 'Cycling',
    name: 'Road & Spin Cycling',
    category: 'Cardio',
    image: '/workouts/cycling.jpg',
    badge: 'Lactate Clearance',
    color: '#25D9E6',
    zone: 'Zone 3 (Aerobic Power)',
    burnRate: '10 - 15 kcal/min',
    muscles: 'Quads, Hamstrings, Calves',
  },
  {
    id: 'Yoga',
    name: 'Vinyasa Yoga & Mobility',
    category: 'Mobility',
    image: '/workouts/yoga.jpg',
    badge: 'Parasympathetic Recovery',
    color: '#A78BFA',
    zone: 'Zone 1-2 (Active Recovery)',
    burnRate: '4 - 7 kcal/min',
    muscles: 'Spinal Erectors, Glutes',
  },
  {
    id: 'Walking',
    name: 'Brisk Walking & Rucking',
    category: 'Low-Impact',
    image: '/workouts/walking.jpg',
    badge: 'Zone 2 Fat Oxidation',
    color: '#39E58C',
    zone: 'Zone 2 (Fat Burn)',
    burnRate: '5 - 8 kcal/min',
    muscles: 'Hips, Core, Posterior Chain',
  },
];

// Curated Exercises with realistic demonstration photography from the app
const FEATURED_EXERCISES = [
  {
    name: 'Barbell Conventional Deadlift',
    category: 'Posterior Chain',
    protocol: '4 sets × 6-8 reps • 120s rest',
    image: '/exercises/deadlift.jpg',
    target: 'Hamstrings, Glutes, Lats, Spinal Erectors',
    badge: 'Compound King',
  },
  {
    name: 'Barbell High-Bar Back Squat',
    category: 'Knee Dominant',
    protocol: '4 sets × 8-10 reps • 90s rest',
    image: '/exercises/squat.jpg',
    target: 'Quads, Adductors, Glutes, Core',
    badge: 'Leg Hypertrophy',
  },
  {
    name: 'Flat Barbell Bench Press',
    category: 'Horizontal Push',
    protocol: '3 sets × 8-12 reps • 90s rest',
    image: '/exercises/bench.jpg',
    target: 'Pectoralis Major, Anterior Delts, Triceps',
    badge: 'Upper Power',
  },
  {
    name: 'Wide-Grip Strict Pull-ups',
    category: 'Vertical Pull',
    protocol: '4 sets × Max Reps • 60s rest',
    image: '/exercises/pullups.jpg',
    target: 'Latissimus Dorsi, Biceps, Rhomboids',
    badge: 'Bodyweight Mastery',
  },
  {
    name: 'Heavy Battle Rope Waves',
    category: 'Conditioning',
    protocol: '6 rounds × 30s work / 30s rest',
    image: '/exercises/battle_ropes.jpg',
    target: 'Shoulders, Core, Cardiovascular Capacity',
    badge: 'Metabolic Finisher',
  },
];

export default function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const [siteContent, setSiteContent] = useState(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState('telemetry');
  const [selectedDiscipline, setSelectedDiscipline] = useState(DISCIPLINES[0]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const modalVideoRef = React.useRef(null);
  const bgVideoRef = React.useRef(null);

  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.defaultMuted = true;
      bgVideoRef.current.muted = true;
      bgVideoRef.current.play().catch((err) => {
        console.warn('Hero background video autoplay prevented:', err);
      });
    }
  }, []);

  const jumpToVideoChapter = (timeInSeconds) => {
    if (modalVideoRef.current) {
      modalVideoRef.current.currentTime = timeInSeconds;
      modalVideoRef.current.play();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsVideoModalOpen(false);
    };
    if (isVideoModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVideoModalOpen]);

  // Interactive sample habits in Hero preview
  const [sampleHabits, setSampleHabits] = useState([
    { id: 1, title: '5km Morning Aerobic Run', category: 'Cardio', streak: 14, done: true },
    { id: 2, title: '2.5L Hydration Protocol', category: 'Health', streak: 21, done: true },
    { id: 3, title: '180g Protein Target Hit', category: 'Nutrition', streak: 9, done: false },
  ]);

  useEffect(() => {
    adminService
      .getPublicContent()
      .then((data) => {
        if (data) setSiteContent(data);
      })
      .catch((err) => console.warn('Using default content:', err.message));
  }, []);

  const toggleSampleHabit = (id) => {
    setSampleHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextDone = !h.done;
          if (nextDone) {
            confetti({
              particleCount: 35,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#C8FF00', '#25D9E6', '#39E58C'],
            });
          }
          return { ...h, done: nextDone, streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1) };
        }
        return h;
      })
    );
  };

  const announcementText = siteContent?.announcementText;
  const isAnnouncementActive = siteContent?.announcementActive && !announcementDismissed && announcementText;

  return (
    <div
      className={`min-h-screen w-full relative transition-colors duration-300 ${
        isDark ? 'bg-[#080A12] text-[#F5F7FC]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* 1. Global Dynamic Announcement Bar */}
      {isAnnouncementActive && (
        <div
          className={`relative z-30 w-full px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md ${
            isDark ? 'bg-[#C8FF00] text-[#080A12]' : 'bg-teal-700 text-white'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{announcementText}</span>
          <button
            onClick={() => setAnnouncementDismissed(true)}
            className="ml-2 hover:opacity-75 p-0.5 cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Sticky Glass Navigation */}
      <header
        className={`sticky top-0 z-30 w-full border-b backdrop-blur-xl transition-colors ${
          isDark
            ? 'bg-[#080A12]/90 border-[#1D2332]'
            : 'bg-white/90 border-[#E2E8F0] shadow-xs'
        }`}
      >
        <div className="max-w-7xl 3xl:max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <Logo variant={isDark ? 'dark' : 'light'} className="h-8 sm:h-10 w-auto object-contain" />
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-semibold">
            <a href="#disciplines" className={`transition-colors ${isDark ? 'text-[#A4AABC] hover:text-[#C8FF00]' : 'text-slate-600 hover:text-teal-700'}`}>
              Workout Disciplines
            </a>
            <a href="#exercises" className={`transition-colors ${isDark ? 'text-[#A4AABC] hover:text-[#C8FF00]' : 'text-slate-600 hover:text-teal-700'}`}>
              Exercise Studio
            </a>
            <a href="#features" className={`transition-colors ${isDark ? 'text-[#A4AABC] hover:text-[#C8FF00]' : 'text-slate-600 hover:text-teal-700'}`}>
              Habits & Macros
            </a>
            <a href="#ai-coach" className={`transition-colors ${isDark ? 'text-[#A4AABC] hover:text-[#C8FF00]' : 'text-slate-600 hover:text-teal-700'}`}>
              Synapse AI
            </a>
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              type="button"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#111522] border-[#242A3A] text-[#C8FF00] hover:bg-[#151A29]'
                  : 'bg-slate-100 border-slate-200 text-teal-700 hover:bg-slate-200'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#C8FF00] text-[#080A12] shadow-md shadow-[#C8FF00]/20 hover:brightness-110'
                      : 'bg-teal-700 text-white shadow-md hover:bg-teal-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{user?.name || 'Dashboard'}</span>
                </Link>
                <button
                  onClick={logout}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isDark
                      ? 'border-[#242A3A] text-[#70788D] hover:text-[#FF5C67] hover:bg-[#151A29]'
                      : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                  }`}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className={`px-3 py-2 text-xs sm:text-sm font-bold transition-colors ${
                    isDark ? 'text-[#A4AABC] hover:text-[#F5F7FC]' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#C8FF00] text-[#080A12] shadow-lg shadow-[#C8FF00]/25 hover:brightness-110'
                      : 'bg-teal-700 text-white shadow-md hover:bg-teal-800'
                  }`}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em' }}
                >
                  <span>Start Journey</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (With Video Background representing the app) */}
      <section className="relative min-h-[min(90vh,920px)] flex flex-col justify-center items-center overflow-hidden px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <video
            ref={bgVideoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/hero-poster.jpg"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              isDark ? 'opacity-90' : 'opacity-45'
            }`}
          >
            <source src="/hero-background.mp4" type="video/mp4" />
            <source src="/hero-background.webm" type="video/webm" />
          </video>
          {/* Obsidian Gradient Vignette */}
          <div
            className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
              isDark
                ? 'bg-gradient-to-b from-[#080A12]/40 via-transparent to-[#080A12]'
                : 'bg-gradient-to-b from-[#F8FAFC]/50 via-transparent to-[#F8FAFC]'
            }`}
          />
        </div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-6xl 3xl:max-w-7xl mx-auto w-full text-center flex flex-col items-center">
          {/* Athletic Pill Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-6 border shadow-sm ${
              isDark
                ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30 text-[#C8FF00]'
                : 'bg-teal-50 border-teal-200 text-teal-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Intelligent Athletic Engine • Habits & Bio-Telemetry</span>
          </div>

          {/* Hero Headline */}
          <h1
            className={`text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.98] uppercase max-w-5xl ${
              isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'
            }`}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Engineering Peak{' '}
            <span className={isDark ? 'text-[#C8FF00] drop-shadow-[0_0_25px_rgba(200,255,0,0.3)]' : 'text-teal-700'}>
              Human Vitality
            </span>
          </h1>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className={`px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-black tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xl ${
                isDark
                  ? 'bg-[#C8FF00] text-[#080A12] shadow-[#C8FF00]/25 hover:brightness-110 hover:shadow-[#C8FF00]/40'
                  : 'bg-teal-700 text-white shadow-teal-900/20 hover:bg-teal-800'
              }`}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <span>{isAuthenticated ? 'Enter Command Center' : 'Start Free Journey'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setIsVideoModalOpen(true)}
              className={`px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2 border transition-all cursor-pointer group ${
                isDark
                  ? 'bg-[#111522]/90 hover:bg-[#151A29] border-[#C8FF00]/40 text-[#F5F7FC] shadow-lg shadow-[#C8FF00]/10 hover:border-[#C8FF00]'
                  : 'bg-white hover:bg-slate-50 border-teal-300 text-slate-800 shadow-sm hover:border-teal-500'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#C8FF00]/15 flex items-center justify-center text-[#C8FF00] group-hover:scale-110 transition-transform">
                <Play className="w-3.5 h-3.5 fill-current" />
              </div>
              <span>Watch System Tour</span>
            </button>

            <a
              href="#disciplines"
              className={`px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#111522]/80 hover:bg-[#151A29] border-[#242A3A] text-[#F5F7FC]'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
              }`}
            >
              <span>Explore Disciplines</span>
              <ChevronRight className="w-4 h-4 text-[#25D9E6]" />
            </a>
          </div>

          {/* Live Interactive Hero Preview Card (Directly Representing the App) */}
          <div className="mt-12 sm:mt-16 w-full max-w-4xl mx-auto">
            <div
              className={`rounded-[28px] border p-5 sm:p-7 backdrop-blur-2xl shadow-2xl transition-all text-left relative overflow-hidden ${
                isDark
                  ? 'bg-[#111522]/90 border-[#242A3A] shadow-black/80'
                  : 'bg-white/95 border-slate-200 shadow-slate-300/50'
              }`}
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-current/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00]">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black uppercase tracking-wide">
                        Live Command Center Preview
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#39E58C]/15 text-[#39E58C] border border-[#39E58C]/30 animate-pulse">
                        Active Telemetry
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Real-time interactive snapshot of your daily athletic cadence
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold ${
                      isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#C8FF00] animate-ping" />
                    <span>Vitality: 94% Peak</span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-mono font-bold ${
                      isDark ? 'bg-[#0D101B] border-[#1D2332] text-[#FF5C67]' : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                    <span>74 BPM</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Metrics & Checkable Daily Routine */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-5">
                {/* Left: 3 Telemetry Metrics */}
                <div className="md:col-span-5 grid grid-cols-3 gap-2 text-center">
                  {/* Metric 1 */}
                  <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/15 mx-auto flex items-center justify-center text-[#C8FF00] mb-1">
                      <Flame className="w-4 h-4" />
                    </div>
                    <p className="text-base sm:text-lg font-black font-mono">680</p>
                    <p className={`text-[10px] font-semibold ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Kcal Burned
                    </p>
                  </div>

                  {/* Metric 2 */}
                  <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-8 h-8 rounded-xl bg-[#25D9E6]/15 mx-auto flex items-center justify-center text-[#25D9E6] mb-1">
                      <Footprints className="w-4 h-4" />
                    </div>
                    <p className="text-base sm:text-lg font-black font-mono">10.4k</p>
                    <p className={`text-[10px] font-semibold ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Steps Logged
                    </p>
                  </div>

                  {/* Metric 3 */}
                  <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 mx-auto flex items-center justify-center text-[#8B5CF6] mb-1">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-base sm:text-lg font-black font-mono">54m</p>
                    <p className={`text-[10px] font-semibold ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Active Time
                    </p>
                  </div>
                </div>

                {/* Right: Interactive Checkable Routine */}
                <div className="md:col-span-7 space-y-2">
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                    Interactive Habit Checklist (Click to Test)
                  </p>
                  <div className="space-y-1.5">
                    {sampleHabits.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => toggleSampleHabit(h.id)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                          h.done
                            ? isDark
                              ? 'bg-[#0D101B] border-[#C8FF00]/40 text-[#F5F7FC]'
                              : 'bg-teal-50/60 border-teal-300 text-slate-900'
                            : isDark
                            ? 'bg-[#0D101B]/50 border-[#1D2332] text-[#A4AABC] hover:border-[#242A3A]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {h.done ? (
                            <CheckCircle2 className="w-4 h-4 text-[#C8FF00] fill-[#C8FF00]/20 shrink-0" />
                          ) : (
                            <Circle className={`w-4 h-4 shrink-0 ${isDark ? 'text-[#70788D]' : 'text-slate-400'}`} />
                          )}
                          <span className={`text-xs font-semibold ${h.done ? 'line-through opacity-75' : ''}`}>
                            {h.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-current/10 text-[#C8FF00]">
                            {h.category}
                          </span>
                          <span className="text-xs font-mono font-bold flex items-center gap-1 text-[#FFB020]">
                            <Flame className="w-3 h-3 fill-current" />
                            {h.streak}d
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Studio & Biomechanics Snapshot (Direct Application Photography in Hero) */}
              <div className="mt-5 pt-4 border-t border-current/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Workout Snapshot */}
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative border border-current/10">
                    <img
                      src="/workouts/running.jpg"
                      alt="Road & Track Running"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#C8FF00] animate-ping" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#C8FF00]/15 text-[#C8FF00] font-mono">
                        Active Studio
                      </span>
                      <span className="text-[10px] text-[#25D9E6] font-semibold">Zone 4 (Aerobic)</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight truncate mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      5.2km Aerobic Road Run
                    </h4>
                    <p className={`text-[10px] font-mono ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Pace 4:48/km • 164 BPM
                    </p>
                  </div>
                </div>

                {/* Exercise Snapshot */}
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative border border-current/10">
                    <img
                      src="/exercises/deadlift.jpg"
                      alt="Barbell Deadlift"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#39E58C]/15 text-[#39E58C] font-mono">
                        Biomechanics
                      </span>
                      <span className="text-[10px] text-[#39E58C] font-semibold">Form Verified</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight truncate mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Conventional Deadlift
                    </h4>
                    <p className={`text-[10px] font-mono ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      4 sets × 8 reps • 140 kg PR
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORKOUT DISCIPLINES GALLERY (FEATURING REAL PHOTOGRAPHY FROM THE APP) */}
      <section id="disciplines" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl 3xl:max-w-[1780px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span
              className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                isDark ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30 text-[#C8FF00]' : 'bg-teal-50 border-teal-200 text-teal-800'
              }`}
            >
              Curated Training Disciplines
            </span>
            <h2
              className="text-3xl sm:text-5xl font-black uppercase tracking-tight mt-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              8 Athletic Styles with Real Execution
            </h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-xl ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
              High-definition visual form guides, live pace modeling, and target heart rate pacing built into every discipline studio.
            </p>
          </div>

          <Link
            to="/workouts"
            className="text-xs font-bold text-[#C8FF00] hover:underline flex items-center gap-1 group self-start md:self-end"
          >
            <span>Open Exercise Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 8 Disciplines Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {DISCIPLINES.map((discipline) => (
            <div
              key={discipline.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-300 group hover:-translate-y-1 relative flex flex-col justify-between ${
                isDark
                  ? 'bg-[#111522] border-[#242A3A] hover:border-[#C8FF00]/50 shadow-lg shadow-black/40'
                  : 'bg-white border-slate-200 hover:border-teal-500 shadow-md'
              }`}
            >
              {/* Photo Header */}
              <div className="relative h-44 sm:h-48 w-full overflow-hidden">
                <img
                  src={discipline.image}
                  alt={discipline.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 pointer-events-none image-overlay"
                  style={{
                    background: isDark
                      ? 'linear-gradient(to top, rgba(17, 21, 34, 0.95) 0%, rgba(17, 21, 34, 0.25) 45%, transparent 100%)'
                      : 'linear-gradient(to top, rgba(15, 23, 42, 0.45) 0%, transparent 45%)',
                  }}
                />

                {/* Badge Tag */}
                <span
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border shadow-md"
                  style={{
                    backgroundColor: 'rgba(8, 10, 18, 0.75)',
                    borderColor: `${discipline.color}40`,
                    color: discipline.color,
                  }}
                >
                  {discipline.badge}
                </span>

                <span className="absolute bottom-3 right-3 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-black/75 text-white backdrop-blur-sm border border-white/10">
                  {discipline.burnRate}
                </span>
              </div>

              {/* Content Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {discipline.name}
                  </h3>
                  <p className="text-[11px] text-[#25D9E6] font-semibold mt-0.5">
                    {discipline.zone}
                  </p>
                </div>

                <div className="pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                  <span className={isDark ? 'text-[#70788D]' : 'text-slate-500'}>
                    Muscles:
                  </span>
                  <span className={`font-semibold truncate max-w-[170px] ${isDark ? 'text-[#F5F7FC]' : 'text-slate-800'}`}>
                    {discipline.muscles}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CURATED EXERCISE STUDIO (PHOTOREALISTIC DEMONSTRATION CARDS) */}
      <section id="exercises" className={`py-20 sm:py-28 border-t transition-colors ${
        isDark ? 'border-[#1D2332] bg-[#0A0D17]' : 'border-[#E2E8F0] bg-slate-50/70'
      }`}>
        <div className="max-w-7xl 3xl:max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span
              className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                isDark ? 'bg-[#39E58C]/10 border-[#39E58C]/30 text-[#39E58C]' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              Biomechanical Movement Mastery
            </span>
            <h2
              className="text-3xl sm:text-5xl font-black uppercase tracking-tight mt-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Curated Exercise Execution & Form Checks
            </h2>
            <p className={`text-xs sm:text-sm mt-2 ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
              Every movement inside HAbyTAT provides volume protocols, target muscle engagement, and biomechanical cues.
            </p>
          </div>

          {/* Exercise Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {FEATURED_EXERCISES.map((ex) => (
              <div
                key={ex.name}
                className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 ${
                  isDark
                    ? 'bg-[#111522] border-[#242A3A] hover:border-[#39E58C]/50 shadow-lg'
                    : 'bg-white border-slate-200 hover:border-emerald-500 shadow-md'
                }`}
              >
                {/* Exercise Photo */}
                <div className="relative h-40 w-full overflow-hidden">
                  <img
                    src={ex.image}
                    alt={ex.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none image-overlay"
                    style={{
                      background: isDark
                        ? 'linear-gradient(to top, rgba(17, 21, 34, 0.95) 0%, rgba(17, 21, 34, 0.25) 45%, transparent 100%)'
                        : 'linear-gradient(to top, rgba(15, 23, 42, 0.45) 0%, transparent 45%)',
                    }}
                  />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black/80 text-[#39E58C] border border-[#39E58C]/30 backdrop-blur-md">
                    {ex.badge}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight leading-snug line-clamp-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {ex.name}
                    </h4>
                    <p className="text-[10px] text-[#25D9E6] font-mono mt-1 font-semibold">
                      {ex.protocol}
                    </p>
                  </div>

                  <p className={`text-[10px] line-clamp-2 ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                    Target: {ex.target}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. THE 4 PILLARS (BENTO GRID SHOWCASING THE ACTUAL APP MODULES) */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl 3xl:max-w-[1780px] mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span
            className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
              isDark ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30 text-[#C8FF00]' : 'bg-teal-50 border-teal-200 text-teal-800'
            }`}
          >
            The Four Core Systems
          </span>
          <h2
            className="text-3xl sm:text-5xl font-black uppercase tracking-tight mt-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Everything You Need To Master Your Discipline
          </h2>
          <p className={`text-sm sm:text-base mt-3 ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
            Built from first principles for athletes and high performers. No ads, no bloatware, pure execution.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Tile 1: Workout Styles & Exercise Studio (Large 7 cols) with Real Studio Imagery */}
          <div
            className={`lg:col-span-7 rounded-[28px] border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
              isDark
                ? 'bg-[#111522] border-[#242A3A] hover:border-[#C8FF00]/50'
                : 'bg-white border-slate-200 hover:border-teal-500 shadow-md'
            }`}
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00] mb-5">
                <Dumbbell className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#C8FF00]">
                Discipline Studio
              </span>
              <h3
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                8 Athletic Disciplines & Volume Tracker
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed max-w-xl ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                From Road & Track Running to Hypertrophy Lifting, Calisthenics, HIIT Tabata, and Boxing. Execute structured protocols with photorealistic form imagery, interactive checklists, real-time pace calculators, and stopwatch HUDs.
              </p>
            </div>

            {/* Thumbnail preview of workouts inside */}
            <div className="relative z-10 grid grid-cols-4 gap-2 mt-6 pt-5 border-t border-current/10">
              {['/workouts/running.jpg', '/workouts/strength.jpg', '/workouts/hiit.jpg', '/workouts/boxing.jpg'].map((img, i) => (
                <div key={i} className="h-16 rounded-xl overflow-hidden border border-white/10 relative">
                  <img src={img} alt="Workout discipline" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Tile 2: Habit Discipline Engineering (5 cols) */}
          <div
            className={`lg:col-span-5 rounded-[28px] border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
              isDark
                ? 'bg-[#111522] border-[#242A3A] hover:border-[#FFB020]/50'
                : 'bg-white border-slate-200 hover:border-amber-500 shadow-md'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFB020]/15 border border-[#FFB020]/30 flex items-center justify-center text-[#FFB020] mb-5">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FFB020]">
                Habit Engineering
              </span>
              <h3
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Streak Matrix & Consistency Chains
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                Build unshakeable momentum. Track recurring daily habits, monitor current and longest streaks, and visualize your discipline across longitudinal calendar matrices.
              </p>
            </div>

            <div className={`p-3.5 rounded-2xl border mt-6 flex items-center justify-between ${
              isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#FFB020] fill-current" />
                <span className="text-xs font-bold">Cold Shower Streak</span>
              </div>
              <span className="text-xs font-mono font-black text-[#FFB020]">42 Days Strong</span>
            </div>
          </div>

          {/* Tile 3: Metabolic Nutrition & Calorie Diary (5 cols) */}
          <div
            className={`lg:col-span-5 rounded-[28px] border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
              isDark
                ? 'bg-[#111522] border-[#242A3A] hover:border-[#39E58C]/50'
                : 'bg-white border-slate-200 hover:border-emerald-500 shadow-md'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#39E58C]/15 border border-[#39E58C]/30 flex items-center justify-center text-[#39E58C] mb-5">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#39E58C]">
                Metabolic Nutrition
              </span>
              <h3
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Fuel vs. Burn Macro Tracking
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                Dynamically correlate dietary energy intake with active calorie burn. Log meals with instant macronutrient breakdown (Protein, Carbs, Fats) and log hydration with +/- quick withdrawal controls.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6">
              <div className={`p-2.5 rounded-xl border text-center ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-xs font-mono font-black text-[#39E58C]">165g</p>
                <p className="text-[10px] text-[#70788D]">Protein</p>
              </div>
              <div className={`p-2.5 rounded-xl border text-center ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-xs font-mono font-black text-[#25D9E6]">220g</p>
                <p className="text-[10px] text-[#70788D]">Carbs</p>
              </div>
              <div className={`p-2.5 rounded-xl border text-center ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-xs font-mono font-black text-[#FFBF47]">55g</p>
                <p className="text-[10px] text-[#70788D]">Fats</p>
              </div>
            </div>
          </div>

          {/* Tile 4: Habytat Synapse AI Coach (Large 7 cols) */}
          <div
            id="ai-coach"
            className={`lg:col-span-7 rounded-[28px] border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group ${
              isDark
                ? 'bg-[#111522] border-[#242A3A] hover:border-[#8B5CF6]/50'
                : 'bg-white border-slate-200 hover:border-violet-500 shadow-md'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] mb-5">
                <Bot className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#8B5CF6]">
                Synapse AI Intelligence
              </span>
              <h3
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight mt-1 mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                24/7 Athletic Coach & Smart Diary Scanner
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                Powered by domain-guarded intelligence. Type or speak what you ate (*"grilled chicken breast with quinoa and avocado"*) and Synapse instantly parses the nutritional profile and syncs your diary. Receive real-time bio-readiness pacing and recovery assessments.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border mt-6 flex items-start gap-3 ${
              isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
            }`}>
              <Sparkles className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
              <p className={`text-xs leading-relaxed italic ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                "Your heart rate variability indicates optimal recovery today. I suggest pushing Zone 4 threshold intervals during today's 5km run."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE LIVE SCREEN SHOWCASE ("Show, Don't Tell") */}
      <section id="preview" className={`py-20 sm:py-28 border-t transition-colors ${
        isDark ? 'border-[#1D2332] bg-[#0A0D17]' : 'border-[#E2E8F0] bg-slate-50/60'
      }`}>
        <div className="max-w-6xl 3xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span
              className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                isDark ? 'bg-[#25D9E6]/10 border-[#25D9E6]/30 text-[#25D9E6]' : 'bg-sky-50 border-sky-200 text-sky-800'
              }`}
            >
              Interactive Product Walkthrough
            </span>
            <h2
              className="text-3xl sm:text-5xl font-black uppercase tracking-tight mt-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Inside The HAbyTAT Operating System
            </h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {[
              { id: 'telemetry', label: 'Activity Telemetry', icon: Zap },
              { id: 'studio', label: 'Workout Studio', icon: Dumbbell },
              { id: 'streaks', label: 'Habit Engineering', icon: Flame },
              { id: 'coach', label: 'Synapse AI Assistant', icon: Bot },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-[#C8FF00] text-[#080A12] shadow-lg shadow-[#C8FF00]/25'
                        : 'bg-teal-700 text-white shadow-md'
                      : isDark
                      ? 'bg-[#111522] border border-[#242A3A] text-[#A4AABC] hover:text-[#F5F7FC]'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Display */}
          <div
            className={`rounded-[32px] border p-6 sm:p-10 shadow-2xl transition-all ${
              isDark ? 'bg-[#111522] border-[#242A3A]' : 'bg-white border-slate-200 shadow-slate-200'
            }`}
          >
            {activeTab === 'telemetry' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-current/10">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Live Daily Activity Rings & Cadence Pedometer
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Dynamic dual mode: Toggle effortlessly between Active Metabolic Burn and Dietary Fuel intake.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#39E58C]/15 text-[#39E58C] border border-[#39E58C]/30 w-fit">
                    Bio-Sensors Online
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs text-[#70788D] uppercase font-bold">Active Burn</p>
                    <p className="text-2xl font-black font-mono text-[#C8FF00] mt-1">740 Kcal</p>
                    <p className="text-[11px] text-[#39E58C] mt-1">112% of daily target</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs text-[#70788D] uppercase font-bold">Step Cadence</p>
                    <p className="text-2xl font-black font-mono text-[#25D9E6] mt-1">11,280</p>
                    <p className="text-[11px] text-[#25D9E6] mt-1">8.4 km total distance</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-xs text-[#70788D] uppercase font-bold">Hydration</p>
                    <p className="text-2xl font-black font-mono text-[#39E58C] mt-1">2,750 ml</p>
                    <p className="text-[11px] text-[#39E58C] mt-1">Target achieved</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'studio' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-current/10">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Curated Exercise Studio & Kinetic Chain Protocols
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Access high-resolution movement photography, execution cues, and real-time interval timers.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30 w-fit">
                    8 Disciplines Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: 'Road Running', img: '/workouts/running.jpg', zone: 'Zone 3-4', cal: '14 kcal/min' },
                    { name: 'Strength & Lifting', img: '/workouts/strength.jpg', zone: 'Zone 2-3', cal: '9 kcal/min' },
                    { name: 'HIIT Tabata', img: '/workouts/hiit.jpg', zone: 'Zone 4-5', cal: '18 kcal/min' },
                  ].map((d) => (
                    <div key={d.name} className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="h-28 overflow-hidden relative">
                        <img src={d.img} alt={d.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40" />
                        <span className="absolute bottom-2 left-2 text-xs font-bold text-white">{d.name}</span>
                      </div>
                      <div className="p-3 flex items-center justify-between text-xs">
                        <span className="text-[#C8FF00] font-mono">{d.zone}</span>
                        <span className="text-[#70788D]">{d.cal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'streaks' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-current/10">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Habit Engineering & Consistency Matrix
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Category filtering across Health, Fitness, Mindfulness, and Productivity with instant streak math.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30 w-fit">
                    Streak Engine
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { title: 'Morning Mobility & Core Circuit', category: 'Fitness', streak: 28 },
                    { title: 'Read 20 Pages Biomechanics', category: 'Study', streak: 16 },
                    { title: 'Zero Refined Sugar Protocol', category: 'Nutrition', streak: 35 },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#39E58C]" />
                        <span className="text-xs font-semibold">{item.title}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#FFB020] flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {item.streak} Days
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'coach' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-current/10">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Habytat Synapse AI Athletic Assistant
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Domain-guarded intelligence designed to maximize biological adaptations and optimize recovery.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 w-fit">
                    Llama-3 Intelligence
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8B5CF6]">
                    <Bot className="w-4 h-4" />
                    <span>Synapse Bio-Coach</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    "Based on your recent 12,000-step volume and elevated heart rate zone during yesterday's Tabata session, your central nervous system will benefit from a 20-minute active recovery walk today paired with 30g extra leucine-rich protein."
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 8. CONVERSION CALL TO ACTION BANNER */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center">
        <div
          className={`rounded-[36px] border p-8 sm:p-14 relative overflow-hidden shadow-2xl ${
            isDark
              ? 'bg-gradient-to-b from-[#111522] to-[#0D101B] border-[#242A3A]'
              : 'bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-slate-300'
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C8FF00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span
              className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                isDark ? 'bg-[#C8FF00]/15 border-[#C8FF00]/30 text-[#C8FF00]' : 'bg-teal-50 border-teal-200 text-teal-800'
              }`}
            >
              Start Today
            </span>

            <h2
              className="text-4xl sm:text-6xl font-black uppercase tracking-tight mt-4 mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Ready To Build Unbreakable Discipline?
            </h2>

            <p className={`text-sm sm:text-base leading-relaxed mb-8 ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
              Join athletes and disciplined individuals taking full control of their workouts, daily habits, and metabolic energy.
            </p>

            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className={`inline-flex items-center gap-2 px-9 py-4 rounded-2xl text-base font-black tracking-wider uppercase transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer ${
                isDark
                  ? 'bg-[#C8FF00] text-[#080A12] shadow-[#C8FF00]/25 hover:brightness-110'
                  : 'bg-teal-700 text-white shadow-teal-900/20 hover:bg-teal-800'
              }`}
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              <span>{isAuthenticated ? 'Enter Dashboard' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. MINIMAL ATHLETIC FOOTER */}
      <footer className={`border-t py-10 transition-colors ${
        isDark ? 'border-[#1D2332] bg-[#080A12]' : 'border-[#E2E8F0] bg-white'
      }`}>
        <div className="max-w-7xl 3xl:max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant={isDark ? 'dark' : 'light'} className="h-6 w-auto object-contain" />
            <span className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
              © 2026 HAbyTAT • Intelligent Fitness, Habit & Nutrition Platform
            </span>
          </div>

          <div className={`flex items-center gap-6 text-xs font-semibold ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
            <Link to="/login" className="hover:underline">Sign In</Link>
            <Link to="/register" className="hover:underline">Register</Link>
            <Link to="/workouts" className="hover:underline">Workouts</Link>
            <Link to="/habits" className="hover:underline">Habits</Link>
            <Link to="/nutrition" className="hover:underline">Nutrition</Link>
          </div>
        </div>
      </footer>

      {/* 10. SYSTEM DEFINITION VIDEO MODAL */}
      {isVideoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className={`relative w-full max-w-4xl rounded-3xl border overflow-hidden shadow-2xl transition-all ${
              isDark ? 'bg-[#111522] border-[#242A3A]' : 'bg-white border-slate-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-current/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/15 flex items-center justify-center text-[#C8FF00]">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    HAbyTAT Video Definition & Platform Overview
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                    10-second high-density overview of the 4 core athletic modules
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#242A3A] text-[#A4AABC] hover:text-white hover:bg-[#151A29]'
                    : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative aspect-video w-full bg-black overflow-hidden">
              <video
                ref={modalVideoRef}
                controls
                autoPlay
                playsInline
                poster="/hero-poster.jpg"
                className="w-full h-full object-contain"
              >
                <source src="/hero-background.mp4" type="video/mp4" />
                <source src="/hero-background.webm" type="video/webm" />
              </video>
            </div>

            {/* Interactive Chapter / Pillar Navigation Bar */}
            <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-2 border-t border-current/10 bg-current/5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#A4AABC]">
                Jump To Pillar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '01. Mission', time: 0, color: '#C8FF00' },
                  { label: '02. Workout Studio', time: 2.0, color: '#C8FF00' },
                  { label: '03. Habit Streaks', time: 4.0, color: '#FFB020' },
                  { label: '04. Metabolic Fuel', time: 6.0, color: '#39E58C' },
                  { label: '05. Synapse AI', time: 8.0, color: '#8B5CF6' },
                ].map((chap) => (
                  <button
                    key={chap.label}
                    type="button"
                    onClick={() => jumpToVideoChapter(chap.time)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isDark
                        ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC] hover:border-[#C8FF00]'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-teal-500'
                    }`}
                  >
                    <span style={{ color: chap.color }} className="mr-1">●</span>
                    <span>{chap.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
