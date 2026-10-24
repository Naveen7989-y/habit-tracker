import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Running', label: 'Running', icon: Footprints },
  { id: 'Cycling', label: 'Cycling', icon: Bike },
  { id: 'Weight Training', label: 'Weight Training', icon: Dumbbell },
  { id: 'Yoga', label: 'Yoga', icon: Sparkles },
];

export default function Workouts() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Running');
  const [workoutState, setWorkoutState] = useState('Ready'); // 'Ready' | 'Recording' | 'Paused' | 'Completed'
  const [elapsedSeconds, setElapsedSeconds] = useState(1935); // Defaults to 00:32:15 for fidelity
  const [distanceKm, setDistanceKm] = useState(5.2);
  const [caloriesBurned, setCaloriesBurned] = useState(412);
  const [avgHeartRate, setAvgHeartRate] = useState(143);
  const [avgPace, setAvgPace] = useState(`6'11" /km`);

  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [confirmStopModal, setConfirmStopModal] = useState(false);

  const timerRef = useRef(null);

  // Load existing workouts from backend
  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const res = await workoutService.getWorkouts({ limit: 10 });
      if (res?.workouts) {
        setRecentWorkouts(res.workouts);
      }
    } catch (err) {
      console.warn('Could not load workouts from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Timer logic for Recording state
  useEffect(() => {
    if (workoutState === 'Recording') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const nextSec = prev + 1;
          // Dynamically increment distance & calories based on activity
          if (nextSec % 10 === 0) {
            setDistanceKm((d) => parseFloat((d + 0.03).toFixed(2)));
            setCaloriesBurned((c) => c + 2);
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
  }, [workoutState]);

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
      const payload = {
        title: `Outdoor ${selectedCategory}`,
        activityType: selectedCategory,
        durationSeconds: elapsedSeconds,
        distanceKm: distanceKm,
        caloriesBurned: caloriesBurned,
        avgPace: avgPace,
        avgHeartRate: avgHeartRate,
        status: 'COMPLETED',
        loggedDate: new Date().toISOString().split('T')[0],
      };

      await workoutService.logWorkout(payload);
      setWorkoutState('Completed');
      setSaveSuccessMsg('Workout saved to your fitness records!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);

      // Refresh list
      fetchWorkouts();
    } catch (err) {
      console.error('Error saving workout:', err);
    }
  };

  // Reset Workout
  const handleReset = () => {
    setWorkoutState('Ready');
    setElapsedSeconds(0);
    setDistanceKm(0);
    setCaloriesBurned(0);
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

  return (
    <DashboardLayout>
      <div className="w-full pt-2 sm:pt-4 pb-6 space-y-5 sm:space-y-6">
        {/* A. Workout Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-[#111522] border border-[#242A3A] text-[#F5F7FC] flex items-center justify-center hover:bg-[#151A29] transition-colors"
              title="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-[#F5F7FC] tracking-tight">
                Workout Telemetry & Tracker
              </h1>
              <p className="text-xs text-[#70788D] hidden sm:block">
                Real-time GPS routing, pace telemetry, and interval stopwatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111522] border border-[#242A3A] text-xs font-semibold text-[#39E58C]">
              <span className="w-2 h-2 rounded-full bg-[#39E58C] animate-pulse" />
              Live Sensor Ready
            </span>
            <button
              onClick={() => handleReset()}
              className="w-10 h-10 rounded-xl bg-[#111522] border border-[#242A3A] text-[#A4AABC] hover:text-[#C8FF00] flex items-center justify-center hover:bg-[#151A29] transition-colors"
              title="Reset Workout"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save confirmation toast */}
        {saveSuccessMsg && (
          <div className="p-3 bg-[#39E58C]/15 border border-[#39E58C]/40 text-[#39E58C] rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Responsive Grid: 2-Columns on Desktop (8/4), 1-Column on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left / Main Column: Active Session & Controls */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">
            {/* Workout Category Selector */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-3 sm:p-4">
              <p className="text-xs font-bold text-[#70788D] uppercase tracking-wider mb-2.5 px-1">
                Select Activity Discipline
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 select-none">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-150 ${
                        isSelected
                          ? 'bg-[#151A29] border-[#C8FF00] text-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.15)] scale-[1.02]'
                          : 'bg-[#0D101B] border-[#1D2332] text-[#70788D] hover:text-[#A4AABC] hover:bg-[#111522]'
                      }`}
                    >
                      <Icon
                        className="w-5 h-5 transition-transform"
                        style={isSelected ? { color: '#C8FF00', filter: 'drop-shadow(0 0 4px #C8FF00)' } : {}}
                      />
                      <span className="text-xs font-bold tracking-tight">
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Featured Workout Card */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-6 space-y-4 relative overflow-hidden shadow-lg">
              {/* Activity Tag & GPS Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                    Outdoor {selectedCategory}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-[#C8FF00] text-[10px] font-black tracking-wider uppercase">
                    GPS Live
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#70788D]">
                  <span className="w-2 h-2 rounded-full bg-[#39E58C] animate-pulse" />
                  <span>Telemetry Synced</span>
                </div>
              </div>

              {/* Big Distance Metric */}
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black text-[#C8FF00] tracking-tight leading-none drop-shadow-[0_0_20px_rgba(200,255,0,0.25)]">
                  {distanceKm}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#F5F7FC]">
                  km
                </span>
              </div>

              {/* 4-Stat Metric Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1D2332]">
                <div className="bg-[#0D101B] p-2.5 rounded-xl border border-[#1D2332]">
                  <p className="text-[10px] text-[#70788D] uppercase font-semibold">Duration</p>
                  <p className="text-sm sm:text-base font-bold text-[#F5F7FC] mt-0.5">
                    {formatTime(elapsedSeconds)}
                  </p>
                </div>

                <div className="bg-[#0D101B] p-2.5 rounded-xl border border-[#1D2332]">
                  <p className="text-[10px] text-[#70788D] uppercase font-semibold">Avg. Pace</p>
                  <p className="text-sm sm:text-base font-bold text-[#F5F7FC] mt-0.5">
                    {avgPace}
                  </p>
                </div>

                <div className="bg-[#0D101B] p-2.5 rounded-xl border border-[#1D2332]">
                  <p className="text-[10px] text-[#70788D] uppercase font-semibold">Calories</p>
                  <p className="text-sm sm:text-base font-bold text-[#F5F7FC] mt-0.5">
                    {caloriesBurned} Kcal
                  </p>
                </div>

                <div className="bg-[#0D101B] p-2.5 rounded-xl border border-[#1D2332]">
                  <p className="text-[10px] text-[#70788D] uppercase font-semibold">Avg. Heart Rate</p>
                  <p className="text-sm sm:text-base font-bold text-[#F5F7FC] mt-0.5">
                    {avgHeartRate} BPM
                  </p>
                </div>
              </div>

              {/* Route Map Trace */}
              <WorkoutRouteMap distanceKm={distanceKm} />
            </div>

            {/* Workout Live Controller Card */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-5 sm:p-6 text-center space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#70788D] uppercase tracking-wider">
                  Session Stopwatch
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  workoutState === 'Recording'
                    ? 'bg-[#39E58C]/15 text-[#39E58C] border border-[#39E58C]/30'
                    : workoutState === 'Paused'
                    ? 'bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30'
                    : 'bg-[#151A29] text-[#70788D]'
                }`}>
                  {workoutState}
                </span>
              </div>

              {/* Big Stopwatch Display */}
              <div className="text-5xl sm:text-6xl font-black text-[#C8FF00] tracking-wider leading-none drop-shadow-[0_0_16px_rgba(200,255,0,0.25)] py-2">
                {formatTime(elapsedSeconds)}
              </div>

              {/* 3 Columns Stats */}
              <div className="grid grid-cols-3 divide-x divide-[#1D2332] py-3 border-y border-[#1D2332]">
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-[#25D9E6] mb-1">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-[#F5F7FC]">
                    {distanceKm}
                  </p>
                  <p className="text-[11px] text-[#70788D]">Distance (km)</p>
                </div>

                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-[#C8FF00] mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-[#F5F7FC]">
                    {avgPace}
                  </p>
                  <p className="text-[11px] text-[#70788D]">Pace (/km)</p>
                </div>

                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-[#FF5C67] mb-1">
                    <Heart className="w-4 h-4" />
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-[#F5F7FC]">
                    {avgHeartRate}
                  </p>
                  <p className="text-[11px] text-[#70788D]">Pulse (BPM)</p>
                </div>
              </div>

              {/* Dual Workout Controls */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleTogglePause}
                  className="py-4 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#8B5CF6] hover:bg-[#7c4df2] text-white shadow-lg shadow-[#8B5CF6]/25 transition-all active:scale-95 cursor-pointer"
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
                  onClick={handleStop}
                  className="py-4 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#151A29] hover:bg-[#1D2332] text-[#FF5C67] border border-[#FF5C67]/40 transition-all active:scale-95 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-[#FF5C67]" />
                  <span>Finish & Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: History, Goals & Records */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 sm:space-y-6">
            {/* Quick Session Presets Card */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-5 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F5F7FC] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#C8FF00]" />
                  <span>Training Presets</span>
                </h3>
                <span className="text-[11px] text-[#70788D]">Quick Load</span>
              </div>

              <div className="space-y-2">
                {[
                  { title: '5K Tempo Run', target: '5.0 km • 25 min', type: 'Running', color: '#C8FF00' },
                  { title: 'HIIT Cardio Burst', target: '30 min • 350 Kcal', type: 'Gym', color: '#8B5CF6' },
                  { title: 'Aerobic Recovery Ride', target: '15.0 km • 40 min', type: 'Cycling', color: '#25D9E6' },
                ].map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedCategory(preset.type);
                      setWorkoutState('Recording');
                    }}
                    className="p-3 rounded-2xl bg-[#0D101B] border border-[#1D2332] hover:border-[#C8FF00]/40 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#F5F7FC] group-hover:text-[#C8FF00] transition-colors">
                        {preset.title}
                      </p>
                      <p className="text-[10px] text-[#70788D]">{preset.target}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{ backgroundColor: `${preset.color}15`, color: preset.color }}
                    >
                      {preset.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workout History / Recorded Activities */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-5 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#A4AABC] uppercase tracking-wider">
                  Recorded Sessions ({recentWorkouts.length})
                </h3>
                <span className="text-[11px] text-[#70788D]">Synced</span>
              </div>

              {recentWorkouts.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Dumbbell className="w-8 h-8 text-[#70788D] mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-[#A4AABC]">No workouts recorded yet</p>
                  <p className="text-[10px] text-[#70788D]">Press Start Session to track your first workout</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {recentWorkouts.map((w) => (
                    <div
                      key={w.id}
                      className="bg-[#0D101B] border border-[#1D2332] hover:border-[#242A3A] rounded-2xl p-3 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/30 text-[#C8FF00] flex items-center justify-center shrink-0">
                          {w.activityType === 'Cycling' ? (
                            <Bike className="w-4 h-4" />
                          ) : (
                            <Footprints className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[#F5F7FC] truncate">
                            {w.title}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-[#70788D]">
                            {w.loggedDate} • {Math.round((w.durationSeconds || 0) / 60)} min • {w.distanceKm ? `${w.distanceKm} km` : `${w.caloriesBurned} Kcal`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteWorkout(w.id)}
                        className="p-1.5 text-[#70788D] hover:text-[#FF5C67] transition-colors rounded-lg hover:bg-[#151A29]"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stop Workout Confirmation Modal */}
        {confirmStopModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0D101B] border border-[#242A3A] w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5C67]/15 border border-[#FF5C67]/30 flex items-center justify-center text-[#FF5C67]">
                  <Square className="w-4 h-4 fill-[#FF5C67]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F7FC]">
                    Finish Workout?
                  </h3>
                  <p className="text-[11px] text-[#70788D]">
                    {formatTime(elapsedSeconds)} • {distanceKm} km • {caloriesBurned} Kcal
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#A4AABC]">
                Would you like to save this completed {selectedCategory} workout to your fitness profile history?
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleReset}
                  className="py-2.5 px-3 rounded-xl bg-[#151A29] text-[#70788D] hover:text-[#F5F7FC] text-xs font-semibold"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="py-2.5 px-3 rounded-xl bg-[#C8FF00] text-[#080A12] text-xs font-bold hover:bg-[#B4E600]"
                >
                  Save Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
