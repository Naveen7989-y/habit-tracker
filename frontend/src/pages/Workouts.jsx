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
      <div className="max-w-2xl mx-auto w-full pt-2 sm:pt-4 space-y-4 sm:space-y-5">
        {/* A. Workout Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[#111522] border border-[#242A3A] text-[#F5F7FC] flex items-center justify-center hover:bg-[#151A29] transition-colors"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h1 className="text-base sm:text-lg font-bold text-[#F5F7FC] tracking-tight">
            Workout
          </h1>

          <button
            onClick={() => handleReset()}
            className="w-10 h-10 rounded-xl bg-[#111522] border border-[#242A3A] text-[#A4AABC] hover:text-[#C8FF00] flex items-center justify-center hover:bg-[#151A29] transition-colors"
            title="Workout Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Save confirmation toast */}
        {saveSuccessMsg && (
          <div className="p-3 bg-[#39E58C]/15 border border-[#39E58C]/40 text-[#39E58C] rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* B. Workout Category Selector (Horizontal Scrollable) */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none select-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-1 min-w-[76px] sm:min-w-[90px] py-2.5 px-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#111522] border-[#C8FF00] text-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.15)]'
                    : 'bg-[#0D101B] border-[#1D2332] text-[#70788D] hover:text-[#A4AABC] hover:bg-[#111522]'
                }`}
              >
                <Icon
                  className="w-4 h-4 sm:w-5 sm:h-5 transition-transform"
                  style={isSelected ? { color: '#C8FF00', filter: 'drop-shadow(0 0 4px #C8FF00)' } : {}}
                />
                <span className="text-[11px] sm:text-xs font-bold tracking-tight">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* C. Featured Workout Card */}
        <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
          {/* Activity Tag & GPS Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#F5F7FC]">
                Outdoor {selectedCategory}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-[#C8FF00] text-[10px] font-black tracking-wider uppercase">
                GPS
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-[#70788D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39E58C] animate-pulse" />
              <span>Telemetry Synced</span>
            </div>
          </div>

          {/* Big Distance Metric */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-[#C8FF00] tracking-tight leading-none drop-shadow-[0_0_16px_rgba(200,255,0,0.25)]">
              {distanceKm}
            </span>
            <span className="text-lg sm:text-xl font-bold text-[#F5F7FC]">
              km
            </span>
          </div>

          {/* 4-Stat Metric Row */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[#1D2332]">
            <div>
              <p className="text-[10px] text-[#70788D]">Duration</p>
              <p className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                {formatTime(elapsedSeconds)}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-[#70788D]">Avg. Pace</p>
              <p className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                {avgPace}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-[#70788D]">Calories</p>
              <p className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                {caloriesBurned} Kcal
              </p>
            </div>

            <div>
              <p className="text-[10px] text-[#70788D]">Avg. Heart Rate</p>
              <p className="text-xs sm:text-sm font-bold text-[#F5F7FC]">
                {avgHeartRate} BPM
              </p>
            </div>
          </div>

          {/* Route Map Trace */}
          <WorkoutRouteMap distanceKm={distanceKm} />
        </div>

        {/* D. Workout Live Statistics & Controller Card */}
        <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-5 text-center space-y-4">
          <p className="text-xs font-semibold text-[#70788D] uppercase tracking-wider">
            Duration
          </p>

          {/* Big Stopwatch Display */}
          <div className="text-4xl sm:text-5xl font-black text-[#C8FF00] tracking-wider leading-none drop-shadow-[0_0_12px_rgba(200,255,0,0.2)]">
            {formatTime(elapsedSeconds)}
          </div>

          {/* 3 Columns Stats */}
          <div className="grid grid-cols-3 divide-x divide-[#1D2332] py-2 border-y border-[#1D2332]">
            <div className="px-2">
              <div className="flex items-center justify-center gap-1 text-[#25D9E6] mb-1">
                <Navigation className="w-3.5 h-3.5" />
              </div>
              <p className="text-base sm:text-lg font-bold text-[#F5F7FC]">
                {distanceKm}
              </p>
              <p className="text-[10px] text-[#70788D]">km</p>
            </div>

            <div className="px-2">
              <div className="flex items-center justify-center gap-1 text-[#C8FF00] mb-1">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <p className="text-base sm:text-lg font-bold text-[#F5F7FC]">
                {avgPace}
              </p>
              <p className="text-[10px] text-[#70788D]">/km</p>
            </div>

            <div className="px-2">
              <div className="flex items-center justify-center gap-1 text-[#FF5C67] mb-1">
                <Heart className="w-3.5 h-3.5" />
              </div>
              <p className="text-base sm:text-lg font-bold text-[#F5F7FC]">
                {avgHeartRate}
              </p>
              <p className="text-[10px] text-[#70788D]">BPM</p>
            </div>
          </div>

          {/* E. Dual Workout Controls */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Pause / Resume Button (Electric Violet) */}
            <button
              onClick={handleTogglePause}
              className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                workoutState === 'Recording'
                  ? 'bg-[#8B5CF6] hover:bg-[#7c4df2] text-white shadow-[#8B5CF6]/30'
                  : 'bg-[#8B5CF6] hover:bg-[#7c4df2] text-white shadow-[#8B5CF6]/20'
              }`}
            >
              {workoutState === 'Recording' ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{workoutState === 'Paused' ? 'Resume' : 'Start'}</span>
                </>
              )}
            </button>

            {/* Stop Workout Button (Red square icon) */}
            <button
              onClick={handleStop}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#151A29] hover:bg-[#1D2332] text-[#FF5C67] border border-[#FF5C67]/40 transition-all active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-[#FF5C67]" />
              <span>Stop Workout</span>
            </button>
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

        {/* Workout History / Recorded Activities */}
        {recentWorkouts.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-[#A4AABC] uppercase tracking-wider px-1">
              Recorded Workouts ({recentWorkouts.length})
            </h3>

            <div className="space-y-2">
              {recentWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="bg-[#111522] border border-[#242A3A] rounded-2xl p-3 sm:p-3.5 flex items-center justify-between"
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
