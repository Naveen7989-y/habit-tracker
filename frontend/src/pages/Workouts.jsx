import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';
import DashboardLayout from '../layouts/DashboardLayout';
import WorkoutRouteMap from '../components/fitness/WorkoutRouteMap';
import { workoutService } from '../services/workout.service';
import {
  ChevronLeft,
  SlidersHorizontal,
  Footprints,
  Bike,
  Dumbbell,
  Sparkles,
  Play,
  Pause,
  Square,
  Flame,
  Heart,
  Navigation,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Zap,
  Compass,
  Target,
  Activity,
  Trophy,
  Shield,
  Info,
  X,
  ChevronRight,
  Layers,
  ArrowRight,
  Gauge,
  Check,
  RotateCcw,
  Timer,
  Award,
} from 'lucide-react';

// Comprehensive, scientifically backed workout styles and disciplines
const WORKOUT_STYLES = [
  {
    id: 'Running',
    name: 'Road & Track Running',
    category: 'Cardio',
    icon: Footprints,
    badge: 'VO2 Max Pacing',
    color: '#C8FF00',
    lightColor: '#059669',
    zone: 'Zone 3-4 (Aerobic & Threshold)',
    burnRate: '11 - 16 kcal/min',
    muscles: 'Quads, Calves, Glutes, Core',
    idealTime: '25 - 60 min',
    intensity: 'High',
    description: 'Continuous cardiovascular conditioning optimizing stroke volume, aerobic capacity, running economy, and lactate clearance threshold.',
    protocol: 'Maintain a 170-180 SPM cadence with a midfoot strike and upright forward-leaning posture.',
    benefits: ['Boosts mitochondrial density', 'Builds cardiovascular endurance', 'Burns maximum active calories'],
    speedMultiplier: 0.003, // km per sec (~10.8 km/h)
    calPerSec: 0.19,
    hasGps: true,
  },
  {
    id: 'Cycling',
    name: 'Power & Endurance Cycling',
    category: 'Cardio',
    icon: Bike,
    badge: 'Low-Impact Power',
    color: '#25D9E6',
    lightColor: '#0284C7',
    zone: 'Zone 2-3 (Aerobic Power)',
    burnRate: '9 - 14 kcal/min',
    muscles: 'Quadriceps, Hamstrings, Gluteus Maximus, Hip Flexors',
    idealTime: '30 - 90 min',
    intensity: 'Moderate-High',
    description: 'High-cadence, joint-friendly cardiovascular conditioning that develops aerobic endurance, functional threshold power (FTP), and lower body power.',
    protocol: 'Aim for a smooth cadence of 85-95 RPM in steady-state riding with balanced pelvic stability.',
    benefits: ['Zero joint impact on knees & ankles', 'Superior aerobic base development', 'Exceptional quad & glute stamina'],
    speedMultiplier: 0.006, // km per sec (~21.6 km/h)
    calPerSec: 0.16,
    hasGps: true,
  },
  {
    id: 'HIIT',
    name: 'HIIT & Tabata Intervals',
    category: 'High Intensity',
    icon: Zap,
    badge: 'EPOC Afterburn',
    color: '#FF5C67',
    lightColor: '#DC2626',
    zone: 'Zone 4-5 (Peak Anaerobic)',
    burnRate: '14 - 20 kcal/min',
    muscles: 'Full Body Functional Chain, Core, Heart',
    idealTime: '15 - 30 min',
    intensity: 'Maximum Effort',
    description: 'Alternates rapid max-effort anaerobic bursts with short recovery windows to spike EPOC (Excess Post-Exercise Oxygen Consumption) for up to 24 hours of elevated metabolism.',
    protocol: 'Standard 20s all-out sprint or power movement followed by 10s passive rest across 8 rounds (4 min block).',
    benefits: ['Accelerates fat oxidation via EPOC', 'Increases anaerobic power output', 'Time-efficient metabolic stimulation'],
    speedMultiplier: 0.0018,
    calPerSec: 0.26,
    hasGps: false,
  },
  {
    id: 'Weight Training',
    name: 'Strength & Hypertrophy',
    category: 'Strength',
    icon: Dumbbell,
    badge: 'Myofibrillar Growth',
    color: '#8B5CF6',
    lightColor: '#7C3AED',
    zone: 'Anaerobic Strength (Phosphagen System)',
    burnRate: '7 - 11 kcal/min',
    muscles: 'Target Muscle Groups (Pushes, Pulls, Squats, Hinges)',
    idealTime: '45 - 75 min',
    intensity: 'High Resistance',
    description: 'Progressive resistance training utilizing barbells, dumbbells, and cables to trigger mechanical tension, muscle protein synthesis, and bone mineral density.',
    protocol: 'Perform compound movements for 3-5 working sets of 6-12 reps with 90-120s rest between sets for maximum mechanical tension.',
    benefits: ['Builds lean muscle mass & basal metabolic rate', 'Strengthens tendon & bone density', 'Optimizes posture & physical strength'],
    speedMultiplier: 0.0005,
    calPerSec: 0.14,
    hasGps: false,
  },
  {
    id: 'Calisthenics',
    name: 'Calisthenics & Bodyweight',
    category: 'Strength',
    icon: Activity,
    badge: 'Relative Strength',
    color: '#39E58C',
    lightColor: '#059669',
    zone: 'Neuromuscular Tension',
    burnRate: '8 - 12 kcal/min',
    muscles: 'Lats, Core, Triceps, Scapular Stabilizers',
    idealTime: '30 - 60 min',
    intensity: 'Moderate-High',
    description: 'Gymnastic and bodyweight mastery emphasizing relative strength, core lever tension, scapular depression, and joint mobility across pull-ups, dips, and push-ups.',
    protocol: 'Strict form without momentum: 3s eccentric descent, 1s isometric hold at the bottom, and explosive concentric drive.',
    benefits: ['Exceptional core & relative strength', 'Superior shoulder & rotator cuff resilience', 'No gym equipment required'],
    speedMultiplier: 0.0006,
    calPerSec: 0.15,
    hasGps: false,
  },
  {
    id: 'Yoga',
    name: 'Vinyasa Flow & Mobility',
    category: 'Mobility',
    icon: Sparkles,
    badge: 'Parasympathetic Calm',
    color: '#06B6D4',
    lightColor: '#0891B2',
    zone: 'Zone 1 (Active Recovery & Mindfulness)',
    burnRate: '4 - 7 kcal/min',
    muscles: 'Spinal Erectors, Hip Rotators, Hamstrings, Transverse Core',
    idealTime: '30 - 60 min',
    intensity: 'Low-Impact / Restorative',
    description: 'Breath-synchronized movement connecting postures (asanas) with deep diaphragmatic respiration to enhance myofascial release, joint synovial fluid circulation, and nervous system calm.',
    protocol: 'Inhale on expansive upward postures; exhale on folding and grounding postures. Maintain smooth, unforced Ujjayi breathing.',
    benefits: ['Dramatically reduces cortisol stress hormones', 'Increases functional joint range of motion', 'Accelerates active recovery between hard workouts'],
    speedMultiplier: 0.0002,
    calPerSec: 0.08,
    hasGps: false,
  },
  {
    id: 'Walking',
    name: 'Brisk Walking & Rucking',
    category: 'Cardio',
    icon: Compass,
    badge: 'Zone 2 Fat Burn',
    color: '#FFB020',
    lightColor: '#D97706',
    zone: 'Zone 2 (Fat Oxidation Peak)',
    burnRate: '5 - 8 kcal/min',
    muscles: 'Calves, Glutes, Hamstrings, Postural Stabilizers',
    idealTime: '30 - 60 min',
    intensity: 'Low-to-Moderate',
    description: 'Steady low-stress aerobic movement in the Zone 2 sweet spot where muscle cells maximize fatty acid oxidation without generating systemic cortisol fatigue.',
    protocol: 'Maintain a brisk conversational pace (100-120 steps/minute) or add a 10-15kg rucking pack to increase caloric burn by 40%.',
    benefits: ['Optimal metabolic base conditioning', 'Enhances insulin sensitivity without joint wear', 'Perfect daily active recovery'],
    speedMultiplier: 0.0014, // ~5.0 km/h
    calPerSec: 0.09,
    hasGps: true,
  },
  {
    id: 'Boxing',
    name: 'Boxing & Combat Agility',
    category: 'High Intensity',
    icon: Target,
    badge: 'Rotational Power',
    color: '#F43F5E',
    lightColor: '#E11D48',
    zone: 'Zone 4-5 (Explosive Anaerobic)',
    burnRate: '12 - 18 kcal/min',
    muscles: 'Obliques, Shoulders, Calves, Rotational Core',
    idealTime: '20 - 45 min',
    intensity: 'High Effort',
    description: 'Fast-paced shadowboxing, heavy bag combinations, and agility footwork requiring kinetic chain rotation from the ground through the core to generate explosive force.',
    protocol: '3-minute active punching rounds followed by 1-minute active recovery bounce across 5-8 rounds.',
    benefits: ['Unrivaled core rotational power', 'Sharpened hand-eye coordination & reflexes', 'Massive caloric burn & stress release'],
    speedMultiplier: 0.0012,
    calPerSec: 0.22,
    hasGps: false,
  },
];

const DISCIPLINE_FILTERS = [
  'All Styles',
  'Cardio',
  'Strength',
  'High Intensity',
  'Mobility',
];

const WORKOUT_PRESETS = [
  {
    title: '5K Tempo Pace Run',
    styleId: 'Running',
    target: '5.0 km • Target Pace 4\'55" • 380 Kcal',
    type: 'Running',
    color: '#C8FF00',
    tag: 'Lactate Threshold',
  },
  {
    title: 'Tabata Cardio Hellfire',
    styleId: 'HIIT',
    target: '20 min • 8 Rounds • 280 Kcal',
    type: 'HIIT',
    color: '#FF5C67',
    tag: 'Max EPOC',
  },
  {
    title: 'Upper Hypertrophy Power',
    styleId: 'Weight Training',
    target: '45 min • 18 Sets • 320 Kcal',
    type: 'Weight Training',
    color: '#8B5CF6',
    tag: 'Mechanical Tension',
  },
  {
    title: 'Zone 2 Base Aerobic Ride',
    styleId: 'Cycling',
    target: '15.0 km • 45 min • 420 Kcal',
    type: 'Cycling',
    color: '#25D9E6',
    tag: 'Fat Oxidation',
  },
  {
    title: 'Spinal Flow & Mobility',
    styleId: 'Yoga',
    target: '30 min • Vinyasa • 140 Kcal',
    type: 'Yoga',
    color: '#06B6D4',
    tag: 'Cortisol Reset',
  },
  {
    title: 'Weighted Incline Ruck',
    styleId: 'Walking',
    target: '4.0 km • 12kg Load • 350 Kcal',
    type: 'Walking',
    color: '#FFB020',
    tag: 'Zone 2 Pacing',
  },
];

export default function Workouts() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [selectedStyleId, setSelectedStyleId] = useState('Running');
  const [activeFilter, setActiveFilter] = useState('All Styles');
  const [inspectingStyle, setInspectingStyle] = useState(null);

  const [workoutState, setWorkoutState] = useState('Ready'); // 'Ready' | 'Recording' | 'Paused' | 'Completed'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [avgHeartRate, setAvgHeartRate] = useState(0);
  const [avgPace, setAvgPace] = useState('--');

  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [confirmStopModal, setConfirmStopModal] = useState(false);

  const timerRef = useRef(null);

  // Active workout style object
  const selectedStyle = useMemo(() => {
    return WORKOUT_STYLES.find((s) => s.id === selectedStyleId) || WORKOUT_STYLES[0];
  }, [selectedStyleId]);

  // Filtered styles list
  const filteredStyles = useMemo(() => {
    if (activeFilter === 'All Styles') return WORKOUT_STYLES;
    return WORKOUT_STYLES.filter((s) => s.category === activeFilter);
  }, [activeFilter]);

  // Load existing workouts from backend
  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const res = await workoutService.getWorkouts({ limit: 12 });
      const list = res?.workouts || (Array.isArray(res) ? res : []);
      setRecentWorkouts(list);
    } catch (err) {
      console.warn('Could not load workouts from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Heart Rate Zone categorization
  const hrZoneInfo = useMemo(() => {
    if (!avgHeartRate || avgHeartRate <= 0) {
      return {
        label: 'Standby / Resting',
        zoneNum: 0,
        color: isDark ? '#70788D' : '#64748B',
        desc: 'Sensors calibrating. Ready for activity.',
      };
    }
    if (avgHeartRate < 115) {
      return {
        label: 'Zone 1: Active Recovery',
        zoneNum: 1,
        color: '#60A5FA',
        desc: '< 60% HR Max • Promotes recovery & circulation',
      };
    }
    if (avgHeartRate < 135) {
      return {
        label: 'Zone 2: Fat Oxidation',
        zoneNum: 2,
        color: '#25D9E6',
        desc: '60-70% HR Max • Mitochondrial endurance & lipid burn',
      };
    }
    if (avgHeartRate < 155) {
      return {
        label: 'Zone 3: Aerobic Capacity',
        zoneNum: 3,
        color: '#39E58C',
        desc: '70-80% HR Max • Cardiovascular stamina & volume',
      };
    }
    if (avgHeartRate < 175) {
      return {
        label: 'Zone 4: Anaerobic Threshold',
        zoneNum: 4,
        color: '#C8FF00',
        desc: '80-90% HR Max • Lactate threshold & high power',
      };
    }
    return {
      label: 'Zone 5: Peak Maximum',
      zoneNum: 5,
      color: '#FF5C67',
      desc: '90-100% HR Max • Pure anaerobic sprint capacity',
    };
  }, [avgHeartRate, isDark]);

  // Live Timer & Dynamic Telemetry logic
  useEffect(() => {
    if (workoutState === 'Recording') {
      // Set initial realistic baseline heart rate for this discipline
      setAvgHeartRate((prev) => {
        if (prev > 0) return prev;
        if (selectedStyle.id === 'Yoga') return 96;
        if (selectedStyle.id === 'Walking') return 112;
        if (selectedStyle.id === 'Weight Training') return 128;
        if (selectedStyle.id === 'HIIT' || selectedStyle.id === 'Boxing') return 155;
        return 142;
      });

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const nextSec = prev + 1;

          // Increment distance if style has speed multiplier
          if (selectedStyle.speedMultiplier) {
            setDistanceKm((prevDist) => {
              const increment = selectedStyle.speedMultiplier;
              const newDist = parseFloat((prevDist + increment).toFixed(2));
              if (newDist > 0) {
                const paceSecPerKm = Math.round(nextSec / newDist);
                const pMin = Math.floor(paceSecPerKm / 60);
                const pSec = paceSecPerKm % 60;
                setAvgPace(`${pMin}'${pSec.toString().padStart(2, '0')}" /km`);
              }
              return newDist;
            });
          }

          // Dynamic calories burned based on discipline burn rate
          setCaloriesBurned((prevCal) => {
            const calInc = selectedStyle.calPerSec || 0.15;
            return Math.round((prevCal + calInc) * 10) / 10;
          });

          // Subtle organic heart rate variance
          if (nextSec % 4 === 0) {
            setAvgHeartRate((prevHr) => {
              const base = selectedStyle.id === 'Yoga' ? 95 : selectedStyle.id === 'Walking' ? 114 : selectedStyle.id === 'HIIT' ? 162 : 144;
              const jitter = Math.floor(Math.random() * 8) - 4;
              return Math.max(80, Math.min(190, base + jitter));
            });
          }

          return nextSec;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [workoutState, selectedStyle]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  // Handle Pause / Resume
  const handleTogglePause = () => {
    if (workoutState === 'Ready') {
      setWorkoutState('Recording');
    } else if (workoutState === 'Recording') {
      setWorkoutState('Paused');
    } else if (workoutState === 'Paused') {
      setWorkoutState('Recording');
    }
  };

  // Handle Stop Workout
  const handleStop = () => {
    setConfirmStopModal(true);
  };

  // Confirm Stop & Save Workout to Backend
  const handleConfirmSave = async () => {
    setConfirmStopModal(false);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const payload = {
        title: `${selectedStyle.name} Session`,
        activityType: selectedStyle.id,
        durationSeconds: Math.max(1, elapsedSeconds),
        distanceKm: distanceKm > 0 ? distanceKm : null,
        caloriesBurned: Math.max(1, Math.round(caloriesBurned)),
        avgPace: avgPace !== '--' ? avgPace : null,
        avgHeartRate: avgHeartRate > 0 ? avgHeartRate : null,
        status: 'COMPLETED',
        loggedDate: todayStr,
      };

      await workoutService.logWorkout(payload);
      setWorkoutState('Completed');

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#C8FF00', '#25D9E6', '#39E58C', '#8B5CF6'],
      });

      setSaveSuccessMsg(`Awesome work! Your ${selectedStyle.name} session (${Math.round(caloriesBurned)} Kcal) is now synced to your daily records!`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);

      // Refresh recent list
      fetchWorkouts();
    } catch (err) {
      console.error('Error saving workout:', err);
    }
  };

  // Reset Workout Session
  const handleReset = () => {
    setWorkoutState('Ready');
    setElapsedSeconds(0);
    setDistanceKm(0);
    setCaloriesBurned(0);
    setAvgHeartRate(0);
    setAvgPace('--');
    setConfirmStopModal(false);
  };

  // Delete recorded workout
  const handleDeleteWorkout = async (id) => {
    try {
      await workoutService.deleteWorkout(id);
      setRecentWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error('Failed to delete workout:', err);
    }
  };

  // Load a preset directly into active session
  const handleSelectPreset = (preset) => {
    setSelectedStyleId(preset.styleId);
    handleReset();
    setWorkoutState('Recording');
  };

  const IconSelected = selectedStyle.icon;

  return (
    <DashboardLayout>
      <div className="w-full pt-2 sm:pt-4 pb-10 space-y-6">
        {/* A. Top Header Banner with Live Sensor Badge & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#111522] border-[#242A3A] text-[#F5F7FC] hover:bg-[#151A29]'
                  : 'bg-white border-[#E2E8F0] text-[#0F172A] hover:bg-slate-100 shadow-sm'
              }`}
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg sm:text-2xl font-black tracking-tight ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                  Workout Telemetry & Styles Hub
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-[#C8FF00]">
                  Dynamic Engine
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#70788D]' : 'text-[#64748B]'}`}>
                Multi-discipline bio-telemetry, metabolic zone pacing, and scientific guides
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isDark
                ? 'bg-[#111522] border-[#242A3A] text-[#39E58C]'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="w-2 h-2 rounded-full bg-[#39E58C] animate-pulse" />
              <span>Telemetry Active</span>
            </span>

            <button
              onClick={handleReset}
              className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#111522] border-[#242A3A] text-[#A4AABC] hover:text-[#C8FF00] hover:bg-[#151A29]'
                  : 'bg-white border-[#E2E8F0] text-slate-600 hover:text-emerald-700 hover:bg-slate-50 shadow-sm'
              }`}
              title="Reset session stopwatch and metrics"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Save confirmation toast */}
        {saveSuccessMsg && (
          <div className="p-3.5 bg-[#39E58C]/15 border border-[#39E58C]/40 text-[#39E58C] rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-md">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* B. Workout Disciplines & Styles Catalogue Explorer */}
        <div className={`rounded-[26px] p-4 sm:p-6 border transition-all shadow-xl space-y-4 ${
          isDark
            ? 'bg-[#111522]/90 backdrop-blur-xl border-[#242A3A]'
            : 'bg-white border-[#E2E8F0]'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.2)]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className={`text-sm sm:text-base font-black tracking-tight ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                  Select Workout Discipline & Style
                </h2>
                <p className={`text-[11px] ${isDark ? 'text-[#70788D]' : 'text-[#64748B]'}`}>
                  Choose a style to view scientific protocols, targeted muscle chains, and real-time cadence
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className={`flex flex-wrap items-center gap-1 p-1 rounded-2xl border ${
              isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-100 border-[#E2E8F0]'
            }`}>
              {DISCIPLINE_FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-[#C8FF00] text-[#080A12] shadow-sm font-black'
                      : isDark
                      ? 'text-[#70788D] hover:text-[#F5F7FC]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Workout Styles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {filteredStyles.map((style) => {
              const Icon = style.icon;
              const isSelected = selectedStyleId === style.id;
              const themeColor = isDark ? style.color : style.lightColor;

              return (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:scale-[1.01] ${
                    isSelected
                      ? isDark
                        ? 'bg-[#151A29] border-[#C8FF00] shadow-[0_0_16px_rgba(200,255,0,0.2)]'
                        : 'bg-emerald-50/70 border-emerald-500 shadow-md ring-1 ring-emerald-400'
                      : isDark
                      ? 'bg-[#0D101B]/80 border-[#1D2332] hover:border-[#242A3A] hover:bg-[#151A29]/70'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div>
                    {/* Top Tag & Info Button */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor: `${themeColor}18`,
                          color: themeColor,
                        }}
                      >
                        {style.badge}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingStyle(style);
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-[#70788D] hover:text-[#C8FF00] hover:bg-[#111522]' : 'text-slate-400 hover:text-emerald-700 hover:bg-slate-200'
                        }`}
                        title="View detailed scientific guide & protocol"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Style Icon & Name */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm"
                        style={{
                          backgroundColor: `${themeColor}20`,
                          color: themeColor,
                        }}
                      >
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <h3 className={`text-xs sm:text-sm font-black leading-tight ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                        {style.name}
                      </h3>
                    </div>

                    {/* Scientific Summary Description */}
                    <p className={`text-[11px] leading-relaxed line-clamp-2 mb-3 ${isDark ? 'text-[#A4AABC]' : 'text-[#475569]'}`}>
                      {style.description}
                    </p>
                  </div>

                  {/* Micro Specs Footer */}
                  <div className={`pt-2 border-t flex items-center justify-between text-[10px] font-semibold ${
                    isDark ? 'border-[#1D2332] text-[#70788D]' : 'border-slate-200 text-slate-500'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#FF5C67]" />
                      <span>{style.burnRate}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#25D9E6]" />
                      <span>{style.idealTime}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* C. Responsive Two-Column Grid: Left (Active Session & Telemetry), Right (Presets & History) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Main Left Column: Selected Style Featured Banner & Live Stopwatch */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">
            {/* Active Style Spotlight & Telemetry Board */}
            <div className={`rounded-[26px] p-5 sm:p-6 border transition-all shadow-xl space-y-4 relative overflow-hidden ${
              isDark
                ? 'bg-[#111522]/90 backdrop-blur-xl border-[#242A3A]'
                : 'bg-white border-[#E2E8F0]'
            }`}>
              {/* Header: Discipline Title & Dynamic Pulse Tag */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                    style={{
                      backgroundColor: `${isDark ? selectedStyle.color : selectedStyle.lightColor}20`,
                      color: isDark ? selectedStyle.color : selectedStyle.lightColor,
                    }}
                  >
                    <IconSelected className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                        {selectedStyle.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-[#C8FF00]">
                        {selectedStyle.category}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-[#64748B]'}`}>
                      {selectedStyle.zone} • {selectedStyle.muscles}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingStyle(selectedStyle)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#0D101B] border-[#1D2332] text-[#C8FF00] hover:bg-[#151A29]'
                      : 'bg-slate-50 border-slate-200 text-emerald-700 hover:bg-slate-100'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Protocol Guide</span>
                </button>
              </div>

              {/* Big Distance / Calorie Focus */}
              <div className="flex flex-wrap items-baseline justify-between gap-4 pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-6xl font-black text-[#C8FF00] tracking-tight leading-none drop-shadow-[0_0_20px_rgba(200,255,0,0.25)]">
                    {selectedStyle.hasGps ? distanceKm : Math.round(caloriesBurned)}
                  </span>
                  <span className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                    {selectedStyle.hasGps ? 'km' : 'Kcal'}
                  </span>
                </div>

                {/* Live Heart Rate Zone Indicator */}
                <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
                  isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${hrZoneInfo.color}20`, color: hrZoneInfo.color }}
                  >
                    <Heart className={`w-4 h-4 fill-current stroke-none ${workoutState === 'Recording' ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                        {avgHeartRate > 0 ? `${avgHeartRate} BPM` : '-- BPM'}
                      </span>
                      <span
                        className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full"
                        style={{ backgroundColor: `${hrZoneInfo.color}20`, color: hrZoneInfo.color }}
                      >
                        {hrZoneInfo.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#70788D]">{hrZoneInfo.desc}</p>
                  </div>
                </div>
              </div>

              {/* 4-Stat Metric Row */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t ${
                isDark ? 'border-[#1D2332]' : 'border-slate-200'
              }`}>
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider">Duration</p>
                  <p className={`text-base sm:text-lg font-black mt-0.5 ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>

                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider">
                    {selectedStyle.hasGps ? 'Avg. Pace' : 'Cadence / Sets'}
                  </p>
                  <p className={`text-base sm:text-lg font-black mt-0.5 ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                    {selectedStyle.hasGps ? avgPace : `${Math.floor(elapsedSeconds / 180) + 1} Active Sets`}
                  </p>
                </div>

                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider">Metabolic Burn</p>
                  <p className="text-base sm:text-lg font-black mt-0.5 text-[#C8FF00]">
                    {Math.round(caloriesBurned)} Kcal
                  </p>
                </div>

                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] text-[#70788D] uppercase font-bold tracking-wider">Heart Rate</p>
                  <p className="text-base sm:text-lg font-black mt-0.5 text-[#FF5C67]">
                    {avgHeartRate} BPM
                  </p>
                </div>
              </div>

              {/* GPS Trace Map or Style-Specific Visualizer */}
              {selectedStyle.hasGps ? (
                <WorkoutRouteMap distanceKm={distanceKm} />
              ) : (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                        Indoor Non-GPS Bio-Telemetry Active
                      </p>
                      <p className="text-[10px] text-[#70788D]">
                        Caloric burn dynamically modeled via {selectedStyle.burnRate} metabolic intensity
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/25 text-[#C8FF00] text-xs font-bold">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>EPOC Calibrated</span>
                  </div>
                </div>
              )}
            </div>

            {/* Workout Live Controller Card */}
            <div className={`rounded-[26px] p-5 sm:p-6 text-center space-y-4 border transition-all shadow-xl ${
              isDark ? 'bg-[#111522]/90 border-[#242A3A]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#70788D] uppercase tracking-wider">
                  Live Session Stopwatch
                </span>
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  workoutState === 'Recording'
                    ? 'bg-[#39E58C]/15 text-[#39E58C] border border-[#39E58C]/30 animate-pulse'
                    : workoutState === 'Paused'
                    ? 'bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30'
                    : isDark
                    ? 'bg-[#151A29] text-[#70788D]'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {workoutState}
                </span>
              </div>

              {/* Big Stopwatch Display */}
              <div className="text-5xl sm:text-6xl font-black text-[#C8FF00] tracking-wider leading-none drop-shadow-[0_0_16px_rgba(200,255,0,0.25)] py-2 select-none">
                {formatTime(elapsedSeconds)}
              </div>

              {/* 3 Columns Stats Bar */}
              <div className={`grid grid-cols-3 divide-x py-3 border-y ${
                isDark ? 'divide-[#1D2332] border-[#1D2332]' : 'divide-slate-200 border-slate-200'
              }`}>
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-[#25D9E6] mb-1">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <p className={`text-lg sm:text-xl font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                    {selectedStyle.hasGps ? distanceKm : `${Math.round(caloriesBurned)} kcal`}
                  </p>
                  <p className="text-[11px] text-[#70788D]">
                    {selectedStyle.hasGps ? 'Distance (km)' : 'Energy Burn'}
                  </p>
                </div>

                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-[#C8FF00] mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className={`text-lg sm:text-xl font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                    {selectedStyle.hasGps ? avgPace : `${Math.floor(elapsedSeconds / 60)} min`}
                  </p>
                  <p className="text-[11px] text-[#70788D]">
                    {selectedStyle.hasGps ? 'Pace (/km)' : 'Total Time'}
                  </p>
                </div>

                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-[#FF5C67] mb-1">
                    <Heart className="w-4 h-4" />
                  </div>
                  <p className={`text-lg sm:text-xl font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                    {avgHeartRate}
                  </p>
                  <p className="text-[11px] text-[#70788D]">Pulse (BPM)</p>
                </div>
              </div>

              {/* Dual Primary Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="py-4 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7c4df2] text-white shadow-lg shadow-[#8B5CF6]/25 transition-all active:scale-95 cursor-pointer"
                >
                  {workoutState === 'Recording' ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pause Session</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>{workoutState === 'Paused' ? 'Resume Session' : 'Start Session'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleStop}
                  disabled={elapsedSeconds === 0 && workoutState === 'Ready'}
                  className={`py-4 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-[#151A29] hover:bg-[#1D2332] text-[#FF5C67] border-[#FF5C67]/40'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 fill-[#FF5C67]" />
                  <span>Finish & Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Guided Training Presets & Recorded Sessions History */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 sm:space-y-6">
            {/* Quick Session Presets Card */}
            <div className={`rounded-[26px] p-5 space-y-3.5 border transition-all shadow-xl ${
              isDark ? 'bg-[#111522]/90 border-[#242A3A]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                      Training Presets
                    </h3>
                    <p className={`text-[10px] ${isDark ? 'text-[#70788D]' : 'text-[#64748B]'}`}>
                      Quick-load scientific routines
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#39E58C]/15 text-[#39E58C] border border-[#39E58C]/30">
                  1-Click Start
                </span>
              </div>

              <div className="space-y-2">
                {WORKOUT_PRESETS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer group hover:scale-[1.01] ${
                      isDark
                        ? 'bg-[#0D101B] border-[#1D2332] hover:border-[#C8FF00]/40'
                        : 'bg-slate-50 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className={`text-xs font-bold transition-colors ${
                          isDark ? 'text-[#F5F7FC] group-hover:text-[#C8FF00]' : 'text-slate-900 group-hover:text-emerald-700'
                        }`}>
                          {preset.title}
                        </p>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6]">
                          {preset.tag}
                        </span>
                      </div>
                      <p className={`text-[10px] ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                        {preset.target}
                      </p>
                    </div>

                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0"
                      style={{ backgroundColor: `${preset.color}15`, color: preset.color }}
                    >
                      {preset.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workout History / Recorded Activities */}
            <div className={`rounded-[26px] p-5 space-y-3.5 border transition-all shadow-xl ${
              isDark ? 'bg-[#111522]/90 border-[#242A3A]' : 'bg-white border-[#E2E8F0]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#25D9E6]/15 border border-[#25D9E6]/30 flex items-center justify-center text-[#25D9E6]">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                      Recorded Sessions ({recentWorkouts.length})
                    </h3>
                    <p className={`text-[10px] ${isDark ? 'text-[#70788D]' : 'text-[#64748B]'}`}>
                      Synced with Activity Rings & Biomarkers
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[#39E58C] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#39E58C]" />
                  <span>Synced</span>
                </span>
              </div>

              {recentWorkouts.length === 0 ? (
                <div className={`py-8 text-center space-y-2 rounded-2xl border ${
                  isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <Dumbbell className="w-8 h-8 text-[#70788D] mx-auto opacity-50" />
                  <p className={`text-xs font-bold ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                    No workouts recorded yet
                  </p>
                  <p className="text-[10px] text-[#70788D]">
                    Pick a style and click Start Session to record your first workout
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {recentWorkouts.map((w) => {
                    const matchStyle = WORKOUT_STYLES.find((s) => s.id === w.activityType) || WORKOUT_STYLES[0];
                    const WIcon = matchStyle.icon;

                    return (
                      <div
                        key={w.id}
                        className={`border rounded-2xl p-3 flex items-center justify-between transition-colors ${
                          isDark
                            ? 'bg-[#0D101B] border-[#1D2332] hover:border-[#242A3A]'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${matchStyle.color}15`,
                              borderColor: `${matchStyle.color}30`,
                              color: matchStyle.color,
                            }}
                          >
                            <WIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                              {w.title}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-[#70788D]">
                              {w.loggedDate} • {Math.round((w.durationSeconds || 0) / 60)} min • {w.distanceKm ? `${w.distanceKm} km` : `${w.caloriesBurned} Kcal`}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteWorkout(w.id)}
                          className="p-1.5 text-[#70788D] hover:text-[#FF5C67] transition-colors rounded-lg hover:bg-rose-500/10 cursor-pointer"
                          title="Delete workout record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* D. Workout Style Scientific Deep Dive Modal */}
        {inspectingStyle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className={`w-full max-w-lg rounded-[28px] p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto border ${
              isDark ? 'bg-[#111522] border-[#242A3A]' : 'bg-white border-slate-200'
            }`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                    style={{
                      backgroundColor: `${inspectingStyle.color}20`,
                      color: inspectingStyle.color,
                    }}
                  >
                    <inspectingStyle.icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                        {inspectingStyle.name}
                      </h3>
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                        style={{ backgroundColor: `${inspectingStyle.color}18`, color: inspectingStyle.color }}
                      >
                        {inspectingStyle.badge}
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      {inspectingStyle.category} • {inspectingStyle.intensity} Intensity
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectingStyle(null)}
                  className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29]' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-[#A4AABC]' : 'text-slate-700'}`}>
                  {inspectingStyle.description}
                </p>
              </div>

              {/* Protocol & Form Cues */}
              <div className="space-y-1.5">
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>
                  Training Protocol & Execution
                </h4>
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#0D101B]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-[#C8FF00]' : 'text-emerald-800'} font-medium`}>
                    💡 {inspectingStyle.protocol}
                  </p>
                </div>
              </div>

              {/* Physiological Benefits */}
              <div className="space-y-1.5">
                <h4 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>
                  Key Biological Benefits
                </h4>
                <div className="space-y-1">
                  {inspectingStyle.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#39E58C]">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className={isDark ? 'text-[#F5F7FC]' : 'text-slate-800'}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Telemetry Target Specs */}
              <div className={`grid grid-cols-2 gap-2 pt-1 border-t ${isDark ? 'border-[#1D2332]' : 'border-slate-200'}`}>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] text-[#70788D] uppercase font-bold">Target Zone</p>
                  <p className={`text-xs font-bold mt-0.5 ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>
                    {inspectingStyle.zone}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] text-[#70788D] uppercase font-bold">Burn Rate</p>
                  <p className="text-xs font-bold mt-0.5 text-[#C8FF00]">
                    {inspectingStyle.burnRate}
                  </p>
                </div>
              </div>

              {/* Action Button: Load and Start Session */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingStyle(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isDark ? 'bg-[#151A29] text-[#70788D] hover:text-[#F5F7FC]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStyleId(inspectingStyle.id);
                    setInspectingStyle(null);
                    handleReset();
                    setWorkoutState('Recording');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C8FF00] to-[#39E58C] text-[#080A12] text-xs font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-[#080A12]" />
                  <span>Start {inspectingStyle.name}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* E. Stop Workout Confirmation Modal */}
        {confirmStopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className={`w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border ${
              isDark ? 'bg-[#0D101B] border-[#242A3A]' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5C67]/15 border border-[#FF5C67]/30 flex items-center justify-center text-[#FF5C67]">
                  <Square className="w-4 h-4 fill-[#FF5C67]" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                    Finish Workout Session?
                  </h3>
                  <p className="text-[11px] text-[#70788D]">
                    {formatTime(elapsedSeconds)} • {distanceKm} km • {Math.round(caloriesBurned)} Kcal
                  </p>
                </div>
              </div>

              <p className={`text-xs ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                Would you like to save this completed {selectedStyle.name} workout to your fitness profile and sync it with your daily activity rings?
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? 'bg-[#151A29] text-[#70788D] hover:text-[#F5F7FC]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C8FF00] to-[#39E58C] text-[#080A12] text-xs font-black shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Save & Sync
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
