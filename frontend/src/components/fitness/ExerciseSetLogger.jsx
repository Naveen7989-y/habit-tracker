import React, { useState } from 'react';
import { Plus, Trash2, Check, Dumbbell, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ExerciseSetLogger
 * Interactive set-by-set tracker for strength, calisthenics, and functional movements.
 */
export default function ExerciseSetLogger({
  exerciseName = '',
  targetDescription = '',
  defaultSets = 4,
  defaultReps = 10,
  defaultWeight = 0,
  onTriggerRest,
}) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const [sets, setSets] = useState(() => {
    return Array.from({ length: defaultSets }, (_, i) => ({
      id: i + 1,
      targetReps: defaultReps,
      reps: defaultReps,
      weight: defaultWeight,
      completed: false,
    }));
  });

  const handleToggleComplete = (id) => {
    setSets((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s));
      const targetSet = next.find((s) => s.id === id);
      // If newly marked complete, trigger rest timer
      if (targetSet?.completed && onTriggerRest) {
        onTriggerRest(exerciseName);
      }
      return next;
    });
  };

  const handleUpdateReps = (id, reps) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, reps: Math.max(0, parseInt(reps, 10) || 0) } : s))
    );
  };

  const handleUpdateWeight = (id, weight) => {
    setSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, weight: Math.max(0, parseFloat(weight) || 0) } : s))
    );
  };

  const handleAddSet = (e) => {
    e.stopPropagation();
    setSets((prev) => {
      const last = prev[prev.length - 1];
      const nextId = prev.length > 0 ? last.id + 1 : 1;
      return [
        ...prev,
        {
          id: nextId,
          targetReps: last?.targetReps || defaultReps,
          reps: last?.reps || defaultReps,
          weight: last?.weight || defaultWeight,
          completed: false,
        },
      ];
    });
  };

  const handleRemoveSet = (e, id) => {
    e.stopPropagation();
    setSets((prev) => prev.filter((s) => s.id !== id));
  };

  const totalVolumeKg = sets
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.reps * s.weight, 0);

  const completedCount = sets.filter((s) => s.completed).length;

  return (
    <div
      className={`rounded-2xl border transition-all mt-2 overflow-hidden ${
        isDark ? 'bg-[#080A12]/80 border-[#1D2332]' : 'bg-slate-50 border-slate-200'
      }`}
    >
      {/* Header bar */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
          isDark ? 'hover:bg-[#111522]' : 'hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Dumbbell className="w-3 h-3" />
          </div>
          <span className={`text-[11px] font-bold ${isDark ? 'text-[#F5F7FC]' : 'text-slate-800'}`}>
            Live Set Tracker
          </span>
          <span className="text-[10px] text-[#70788D] font-medium">
            ({completedCount}/{sets.length} Sets Done)
          </span>
          {totalVolumeKg > 0 && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#39E58C]/15 text-[#39E58C]">
              {totalVolumeKg.toLocaleString()} kg Total Volume
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAddSet}
            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#C8FF00]/15 text-[#C8FF00] hover:bg-[#C8FF00]/25 border border-[#C8FF00]/30 flex items-center gap-0.5 transition-colors"
          >
            <Plus className="w-2.5 h-2.5" />
            <span>Add Set</span>
          </button>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[#70788D]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#70788D]" />
          )}
        </div>
      </div>

      {/* Expanded Sets Table */}
      {isOpen && (
        <div className={`p-3 pt-1 border-t space-y-2 ${isDark ? 'border-[#1D2332]' : 'border-slate-200'}`}>
          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-[#70788D] px-1">
            <span className="col-span-2">Set</span>
            <span className="col-span-4">Weight (kg)</span>
            <span className="col-span-3">Reps</span>
            <span className="col-span-3 text-right">Done</span>
          </div>

          <div className="space-y-1.5">
            {sets.map((set, idx) => (
              <div
                key={set.id}
                onClick={(e) => e.stopPropagation()}
                className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-xl border transition-all ${
                  set.completed
                    ? isDark
                      ? 'bg-[#151A29]/90 border-[#39E58C]/40 text-[#39E58C]'
                      : 'bg-emerald-50 border-emerald-300'
                    : isDark
                    ? 'bg-[#0D101B] border-[#1D2332]'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Set # */}
                <div className="col-span-2 flex items-center gap-1">
                  <span className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs bg-black/20 text-[#A4AABC]">
                    {idx + 1}
                  </span>
                </div>

                {/* Weight Input */}
                <div className="col-span-4">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={set.weight || ''}
                    placeholder="0"
                    onChange={(e) => handleUpdateWeight(set.id, e.target.value)}
                    className={`w-full px-2 py-1 text-xs font-bold rounded-lg border outline-none ${
                      isDark
                        ? 'bg-[#111522] border-[#242A3A] text-white focus:border-[#C8FF00]'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* Reps Input */}
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    value={set.reps || ''}
                    placeholder="10"
                    onChange={(e) => handleUpdateReps(set.id, e.target.value)}
                    className={`w-full px-2 py-1 text-xs font-bold rounded-lg border outline-none ${
                      isDark
                        ? 'bg-[#111522] border-[#242A3A] text-white focus:border-[#C8FF00]'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* Complete Button & Delete */}
                <div className="col-span-3 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(set.id)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      set.completed
                        ? 'bg-[#39E58C] text-[#080A12] shadow-[0_0_8px_#39E58C]'
                        : isDark
                        ? 'bg-[#151A29] text-[#70788D] hover:text-[#C8FF00] hover:bg-[#1D2332]'
                        : 'bg-slate-100 text-slate-500 hover:text-emerald-700 hover:bg-slate-200'
                    }`}
                    title={set.completed ? 'Mark Set Incomplete' : 'Complete Set & Start Rest'}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSet(e, set.id)}
                      className="p-1 text-[#70788D] hover:text-[#FF5C67] transition-colors rounded cursor-pointer"
                      title="Remove set"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
