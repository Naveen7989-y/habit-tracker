import React, { useState } from 'react';
import {
  X,
  Footprints,
  Dumbbell,
  Zap,
  Activity,
  Sparkles,
  Bike,
  Flame,
  Calendar,
  Clock,
  Heart,
  Navigation,
  FileText,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { workoutService } from '../../services/workout.service';
import confetti from 'canvas-confetti';

const ACTIVITIES = [
  { id: 'Running', label: 'Running', icon: Footprints, color: '#C8FF00', lightColor: '#059669', calPerMin: 12.5, hasDistance: true },
  { id: 'Strength', label: 'Strength', icon: Dumbbell, color: '#8B5CF6', lightColor: '#7C3AED', calPerMin: 8.5, hasDistance: false },
  { id: 'HIIT', label: 'HIIT', icon: Zap, color: '#FF5C67', lightColor: '#DC2626', calPerMin: 14.0, hasDistance: false },
  { id: 'Calisthenics', label: 'Calisthenics', icon: Activity, color: '#39E58C', lightColor: '#059669', calPerMin: 9.0, hasDistance: false },
  { id: 'Yoga', label: 'Yoga & Flow', icon: Sparkles, color: '#06B6D4', lightColor: '#0891B2', calPerMin: 5.5, hasDistance: false },
  { id: 'Cycling', label: 'Cycling', icon: Bike, color: '#25D9E6', lightColor: '#0284C7', calPerMin: 10.0, hasDistance: true },
  { id: 'Boxing', label: 'Boxing', icon: Flame, color: '#FF3366', lightColor: '#E11D48', calPerMin: 12.0, hasDistance: false },
  { id: 'Walking', label: 'Walking', icon: Footprints, color: '#FFB020', lightColor: '#D97706', calPerMin: 6.0, hasDistance: true },
];

export default function ManualWorkoutModal({
  isOpen,
  onClose,
  onWorkoutSaved,
}) {
  const { isDark } = useTheme();

  const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0]);
  const [title, setTitle] = useState(`${ACTIVITIES[0].label} Workout`);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [distanceKm, setDistanceKm] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState(
    Math.round(45 * ACTIVITIES[0].calPerMin)
  );
  const [avgHeartRate, setAvgHeartRate] = useState(135);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleActivitySelect = (act) => {
    setSelectedActivity(act);
    setTitle(`${act.label} Session`);
    if (durationMinutes > 0) {
      setCaloriesBurned(Math.round(durationMinutes * act.calPerMin));
    }
  };

  const handleAutoEstimateCalories = () => {
    const mins = Number(durationMinutes) || 0;
    const est = Math.round(mins * selectedActivity.calPerMin);
    setCaloriesBurned(est);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!durationMinutes || Number(durationMinutes) <= 0) {
      setErrorMsg('Please specify a valid duration in minutes.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const durationSec = Math.round(Number(durationMinutes) * 60);
      const parsedDist = distanceKm && Number(distanceKm) > 0 ? parseFloat(distanceKm) : null;
      let calculatedPace = null;
      if (parsedDist && parsedDist > 0 && durationSec > 0) {
        const paceSecPerKm = Math.round(durationSec / parsedDist);
        const pMin = Math.floor(paceSecPerKm / 60);
        const pSec = paceSecPerKm % 60;
        calculatedPace = `${pMin}'${pSec.toString().padStart(2, '0')}" /km`;
      }

      const payload = {
        title: title.trim() || `${selectedActivity.label} Workout`,
        activityType: selectedActivity.id,
        durationSeconds: durationSec,
        distanceKm: parsedDist,
        caloriesBurned: caloriesBurned ? Math.round(Number(caloriesBurned)) : null,
        avgPace: calculatedPace,
        avgHeartRate: avgHeartRate ? parseInt(avgHeartRate, 10) : null,
        notes: notes.trim() || null,
        status: 'COMPLETED',
        loggedDate: date,
      };

      await workoutService.logWorkout(payload);

      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#C8FF00', '#25D9E6', '#39E58C', '#8B5CF6'],
      });

      if (onWorkoutSaved) {
        onWorkoutSaved(payload);
      }
      onClose();
    } catch (err) {
      console.error('Failed to log manual workout:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const activeColor = isDark ? selectedActivity.color : selectedActivity.lightColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl space-y-4 border max-h-[92vh] overflow-y-auto transition-all ${
          isDark
            ? 'bg-[#111522] border-[#242A3A] text-[#F5F7FC]'
            : 'bg-white border-[#E2E8F0] text-[#0F172A]'
        }`}
      >
        {/* Header */}
        <div className={`p-5 pb-3 border-b flex items-center justify-between ${
          isDark ? 'border-[#1D2332]' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-colors"
              style={{
                backgroundColor: `${activeColor}20`,
                color: activeColor,
              }}
            >
              <selectedActivity.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Log Completed Workout</h3>
              <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                Record an off-app session, gym visit, or outdoor activity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#151A29] border-[#242A3A] text-[#70788D] hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* Activity Category Grid */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
              Workout Discipline
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTIVITIES.map((act) => {
                const Icon = act.icon;
                const isSelected = selectedActivity.id === act.id;
                const themeColor = isDark ? act.color : act.lightColor;

                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => handleActivitySelect(act)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#151A29] border-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.2)]'
                          : 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : isDark
                        ? 'bg-[#0D101B] border-[#1D2332] hover:border-[#242A3A]'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${themeColor}20`,
                        color: themeColor,
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold truncate ${
                      isSelected
                        ? isDark ? 'text-[#F5F7FC]' : 'text-emerald-900 font-black'
                        : isDark ? 'text-[#A4AABC]' : 'text-slate-700'
                    }`}>
                      {act.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workout Title & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={`text-xs font-bold ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                Session Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Morning 5K Pace Run"
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-colors outline-none focus:ring-1 focus:ring-[#C8FF00] ${
                  isDark
                    ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC] placeholder-[#70788D]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
                required
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                Date Logged
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-colors outline-none focus:ring-1 focus:ring-[#C8FF00] ${
                    isDark
                      ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC]'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Duration & Distance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                <Clock className="w-3.5 h-3.5 text-[#C8FF00]" />
                <span>Duration (Minutes)</span>
              </label>
              <input
                type="number"
                min="1"
                max="600"
                value={durationMinutes}
                onChange={(e) => {
                  const val = e.target.value;
                  setDurationMinutes(val);
                  if (val && Number(val) > 0) {
                    setCaloriesBurned(Math.round(Number(val) * selectedActivity.calPerMin));
                  }
                }}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-colors outline-none focus:ring-1 focus:ring-[#C8FF00] ${
                  isDark
                    ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC]'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
                required
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                <Navigation className="w-3.5 h-3.5 text-[#25D9E6]" />
                <span>Distance (km) {selectedActivity.hasDistance ? '*' : '(Opt.)'}</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder={selectedActivity.hasDistance ? 'e.g. 5.25' : 'Optional'}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-colors outline-none focus:ring-1 focus:ring-[#C8FF00] ${
                  isDark
                    ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC] placeholder-[#70788D]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Calories & Heart Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                  <Flame className="w-3.5 h-3.5 text-[#FF5C67]" />
                  <span>Burn (Kcal)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoEstimateCalories}
                  className="text-[10px] text-[#C8FF00] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                  title="Auto calculate based on activity rate"
                >
                  <Wand2 className="w-2.5 h-2.5" />
                  <span>Estimate</span>
                </button>
              </div>
              <input
                type="number"
                min="1"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-colors outline-none focus:ring-1 focus:ring-[#C8FF00] ${
                  isDark
                    ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC]'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                <Heart className="w-3.5 h-3.5 text-[#FF3366]" />
                <span>Avg. Heart Rate (BPM)</span>
              </label>
              <input
                type="number"
                min="40"
                max="230"
                value={avgHeartRate}
                onChange={(e) => setAvgHeartRate(e.target.value)}
                placeholder="e.g. 142"
                className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold border transition-colors outline-none focus:ring-1 focus:ring-[#C8FF00] ${
                  isDark
                    ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC] placeholder-[#70788D]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Notes & PRs */}
          <div className="space-y-1">
            <label className={`text-xs font-bold flex items-center gap-1 ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
              <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Notes & PR Records (Optional)</span>
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Hit 4x10 Barbell Squats at 100kg, felt smooth. New 5k speed milestone!"
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-medium border transition-colors outline-none focus:ring-1 focus:ring-[#C8FF00] resize-none ${
                isDark
                  ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC] placeholder-[#70788D]'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-[#1D2332]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#151A29] text-[#70788D] hover:text-[#F5F7FC]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C8FF00] to-[#39E58C] text-[#080A12] text-xs font-black shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-[#080A12]" />
              <span>{saving ? 'Syncing...' : 'Save & Sync Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
