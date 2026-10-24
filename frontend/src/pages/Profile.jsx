import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { nutritionService } from '../services/nutrition.service';
import { COMMON_TIMEZONES } from '../utils/constants';
import confetti from 'canvas-confetti';
import {
  User,
  Mail,
  Globe,
  Image,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Flame,
  Droplets,
  Footprints,
  Clock,
  Sparkles,
  Scale,
  Ruler,
  Activity,
  Heart,
  TrendingDown,
  TrendingUp,
  Target,
  Zap,
  Info,
} from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  // Basic Account State
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  // Biometrics & Vitality Targets State (Synced with backend nutrition_goals)
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('female');
  const [heightCm, setHeightCm] = useState(165);
  const [currentWeightKg, setCurrentWeightKg] = useState(62);
  const [targetWeightKg, setTargetWeightKg] = useState(58);
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [fitnessGoal, setFitnessGoal] = useState('weight_loss');
  const [dietaryPreference, setDietaryPreference] = useState('Veg');

  // Daily Nutritional & Activity Targets
  const [dailyCalories, setDailyCalories] = useState(1950);
  const [proteinGrams, setProteinGrams] = useState(110);
  const [carbsGrams, setCarbsGrams] = useState(220);
  const [fatGrams, setFatGrams] = useState(55);
  const [waterTargetMl, setWaterTargetMl] = useState(2500);
  const [stepsTarget, setStepsTarget] = useState(10000);
  const [activeMinutesTarget, setActiveMinutesTarget] = useState(45);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load user goals on mount
  useEffect(() => {
    const fetchGoals = async () => {
      setGoalsLoading(true);
      try {
        const goals = await nutritionService.getGoals();
        if (goals) {
          if (goals.age) setAge(Number(goals.age));
          if (goals.gender) setGender(goals.gender);
          if (goals.heightCm) setHeightCm(Number(goals.heightCm));
          if (goals.currentWeightKg) setCurrentWeightKg(Number(goals.currentWeightKg));
          if (goals.targetWeightKg) setTargetWeightKg(Number(goals.targetWeightKg));
          if (goals.activityLevel) setActivityLevel(goals.activityLevel);
          if (goals.fitnessGoal) setFitnessGoal(goals.fitnessGoal);
          if (goals.dietaryPreference) setDietaryPreference(goals.dietaryPreference);
          if (goals.dailyCalories) setDailyCalories(Math.round(Number(goals.dailyCalories)));
          if (goals.proteinGrams) setProteinGrams(Math.round(Number(goals.proteinGrams)));
          if (goals.carbsGrams) setCarbsGrams(Math.round(Number(goals.carbsGrams)));
          if (goals.fatGrams) setFatGrams(Math.round(Number(goals.fatGrams)));
          if (goals.waterTargetMl) setWaterTargetMl(Number(goals.waterTargetMl));
        }
      } catch (err) {
        console.warn('Could not load user goals:', err);
      } finally {
        setGoalsLoading(false);
      }
    };
    fetchGoals();
  }, []);

  // Compute BMI
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? (currentWeightKg / (heightM * heightM)).toFixed(1) : 22.0;

  const getBmiCategory = (bmiVal) => {
    const v = parseFloat(bmiVal);
    if (v < 18.5) return { label: 'Underweight', color: 'text-amber-400' };
    if (v < 25) return { label: 'Healthy & Prime', color: 'text-[#39E58C]' };
    if (v < 30) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'Obese', color: 'text-[#FF5C67]' };
  };
  const bmiCategory = getBmiCategory(bmi);

  // Compute BMR & TDEE (Mifflin-St Jeor formula)
  const calculateTDEE = () => {
    let bmr = (10 * currentWeightKg) + (6.25 * heightCm) - (5 * age);
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      athlete: 1.9,
    };
    const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.375));
    return { bmr: Math.round(bmr), tdee };
  };

  const { bmr, tdee } = calculateTDEE();

  // Auto-Calculate Recommended Daily Targets
  const applyRecommendedTargets = () => {
    let targetCal = tdee;
    if (fitnessGoal === 'weight_loss') targetCal = Math.max(1300, Math.round(tdee - 450));
    else if (fitnessGoal === 'muscle_gain') targetCal = Math.round(tdee + 350);

    // Protein: ~1.8g per kg bodyweight
    const recommendedProtein = Math.round(currentWeightKg * 1.8);
    // Fat: ~25% of total calories (9 kcal per gram)
    const recommendedFat = Math.round((targetCal * 0.25) / 9);
    // Carbs: Remaining calories (4 kcal per gram)
    const remainingCal = targetCal - (recommendedProtein * 4) - (recommendedFat * 9);
    const recommendedCarbs = Math.max(50, Math.round(remainingCal / 4));
    // Water: ~35ml per kg
    const recommendedWater = Math.max(2000, Math.round(currentWeightKg * 35));

    setDailyCalories(targetCal);
    setProteinGrams(recommendedProtein);
    setFatGrams(recommendedFat);
    setCarbsGrams(recommendedCarbs);
    setWaterTargetMl(recommendedWater);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#C8FF00', '#25D9E6', '#39E58C'],
    });
  };

  // Height conversion to feet & inches display
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Save user profile info
      await updateProfile({
        name: name.trim(),
        timezone,
        avatar: avatar.trim() || null,
      });

      // 2. Save health goals and biometrics
      await nutritionService.updateGoals({
        age: Number(age),
        gender,
        heightCm: Number(heightCm),
        currentWeightKg: Number(currentWeightKg),
        targetWeightKg: Number(targetWeightKg),
        fitnessGoal,
        activityLevel,
        dietaryPreference,
        dailyCalories: Number(dailyCalories),
        proteinGrams: Number(proteinGrams),
        carbsGrams: Number(carbsGrams),
        fatGrams: Number(fatGrams),
        waterTargetMl: Number(waterTargetMl),
      });

      // Log current weight if changed
      try {
        await nutritionService.logWeight({
          weightKg: Number(currentWeightKg),
          logDate: new Date().toISOString().split('T')[0],
          note: 'Profile update sync',
        });
      } catch {
        // silent
      }

      setSuccess(true);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#C8FF00', '#39E58C', '#25D9E6'],
      });
      setTimeout(() => setSuccess(false), 3500);
    } catch (err) {
      setError(err.message || 'Failed to update profile and goals');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-2 sm:px-6 py-4 sm:py-6 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-[#C8FF00] mb-2">
              <Target className="w-3.5 h-3.5 fill-current" />
              <span>Biometric Hub & Goals</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5F7FC]">
              Profile & Personal Vitality Goals
            </h1>
            <p className="text-xs sm:text-sm text-[#70788D] mt-1">
              Customize your body measurements, nutritional macros, and daily activity benchmarks
            </p>
          </div>

          <button
            type="button"
            onClick={applyRecommendedTargets}
            className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#C8FF00] to-[#25D9E6] text-[#080A12] text-xs font-black hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(200,255,0,0.25)] hover:scale-105 active:scale-95 cursor-pointer"
            title="Calculate and apply optimal caloric and macro targets using Mifflin-St Jeor formula"
          >
            <Zap className="w-4 h-4 fill-current stroke-none" />
            <span>Auto-Calculate Targets</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 bg-[#FF5C67]/10 border border-[#FF5C67]/30 rounded-2xl text-[#FF5C67] text-xs flex items-center gap-2 animate-scale-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-[#39E58C]/15 border border-[#39E58C]/30 rounded-2xl text-[#39E58C] text-xs font-semibold flex items-center gap-2 animate-scale-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>Vitality profile and daily targets successfully synchronized!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Identity & Biometric Snapshot */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
                <div className="relative group">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      className="w-24 h-24 rounded-full object-cover ring-2 ring-[#C8FF00]/50 shadow-[0_0_20px_rgba(200,255,0,0.25)]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#151A29] text-[#8B5CF6] border-2 border-[#8B5CF6]/50 flex items-center justify-center font-bold text-3xl shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                      {name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#39E58C] border-2 border-[#111522]" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#F5F7FC]">{name || 'Athlete'}</h2>
                  <p className="text-xs text-[#70788D]">{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#39E58C]/15 border border-[#39E58C]/30 text-[#39E58C]">
                    {user?.role || 'Active Member'}
                  </span>
                </div>

                {/* Biometrics Summary Pills */}
                <div className="w-full pt-4 border-t border-[#1D2332] grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-xl bg-[#0D101B] border border-[#1D2332]">
                    <span className="text-[10px] text-[#70788D] block">Body Mass Index</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-black text-[#F5F7FC]">{bmi}</span>
                      <span className={`text-[10px] font-bold ${bmiCategory.color}`}>
                        {bmiCategory.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0D101B] border border-[#1D2332]">
                    <span className="text-[10px] text-[#70788D] block">Est. Maintenance</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-black text-[#C8FF00]">{tdee}</span>
                      <span className="text-[10px] text-[#70788D]">kcal/day</span>
                    </div>
                  </div>
                </div>

                {/* Weight Goal Progress Indicator */}
                <div className="w-full p-3 rounded-2xl bg-[#0D101B] border border-[#1D2332] text-left space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#A4AABC] font-semibold flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-[#25D9E6]" />
                      <span>Target Weight</span>
                    </span>
                    <span className="text-[#F5F7FC] font-bold">{targetWeightKg} kg</span>
                  </div>
                  <div className="text-[11px] text-[#70788D] flex items-center justify-between">
                    <span>Current: {currentWeightKg} kg</span>
                    <span className="font-semibold text-[#C8FF00]">
                      {currentWeightKg > targetWeightKg
                        ? `-${(currentWeightKg - targetWeightKg).toFixed(1)} kg to goal`
                        : currentWeightKg < targetWeightKg
                        ? `+${(targetWeightKg - currentWeightKg).toFixed(1)} kg to goal`
                        : 'Goal achieved! 🎯'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Details Form */}
              <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 space-y-3.5">
                <h3 className="text-xs font-bold text-[#A4AABC] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C8FF00]" />
                  <span>Personal Identity</span>
                </h3>

                <div>
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#39E58C]" />
                    <span>Timezone</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Biometrics & Daily Vitality Goals */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Biometric Parameters */}
              <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#25D9E6]" />
                    <h3 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                      Biometric Measurements
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#70788D]">Used for energy telemetry</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gender */}
                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Biological Sex
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Non-binary / Other</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="12"
                      max="110"
                      value={age}
                      onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-[#A4AABC]">Height (cm)</label>
                      <span className="text-[11px] text-[#25D9E6] font-semibold">
                        {feet}' {inches}"
                      </span>
                    </div>
                    <input
                      type="number"
                      min="100"
                      max="250"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Math.max(50, parseFloat(e.target.value) || 0))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                    />
                  </div>

                  {/* Current Weight */}
                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      value={currentWeightKg}
                      onChange={(e) =>
                        setCurrentWeightKg(Math.max(20, parseFloat(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                    />
                  </div>

                  {/* Target Weight */}
                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Target Weight Goal (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="300"
                      value={targetWeightKg}
                      onChange={(e) =>
                        setTargetWeightKg(Math.max(20, parseFloat(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                    />
                  </div>

                  {/* Fitness Goal */}
                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Primary Fitness Directive
                    </label>
                    <select
                      value={fitnessGoal}
                      onChange={(e) => setFitnessGoal(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                    >
                      <option value="weight_loss">Fat Loss & Leaning (-450 kcal)</option>
                      <option value="maintenance">Maintenance & Longevity (TDEE)</option>
                      <option value="muscle_gain">Hypertrophy & Muscle Gain (+350 kcal)</option>
                      <option value="endurance">Athletic Endurance Pacing</option>
                    </select>
                  </div>
                </div>

                {/* Activity Level Selector */}
                <div className="pt-2">
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1.5">
                    Daily Activity Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'sedentary', label: 'Sedentary', sub: 'Desk job' },
                      { id: 'light', label: 'Light', sub: '1-2 workouts/wk' },
                      { id: 'moderate', label: 'Moderate', sub: '3-5 workouts/wk' },
                      { id: 'very_active', label: 'Athlete', sub: 'Daily training' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setActivityLevel(lvl.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          activityLevel === lvl.id
                            ? 'bg-[#151A29] border-[#C8FF00] text-[#C8FF00] shadow-[0_0_10px_rgba(200,255,0,0.2)]'
                            : 'bg-[#0D101B] border-[#242A3A] text-[#A4AABC] hover:border-[#70788D]'
                        }`}
                      >
                        <span className="text-xs font-bold block">{lvl.label}</span>
                        <span className="text-[10px] text-[#70788D]">{lvl.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Daily Vitality & Nutritional Targets */}
              <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#C8FF00]" />
                    <h3 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                      Daily Energy & Macro Targets
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#39E58C] font-semibold">
                    Synced with Dashboard & Nutrition Tracker
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {/* Calories */}
                  <div className="bg-[#0D101B] border border-[#242A3A] p-3 rounded-2xl">
                    <label className="text-[11px] font-bold text-[#C8FF00] block mb-1">
                      Calories (kcal)
                    </label>
                    <input
                      type="number"
                      min="800"
                      max="6000"
                      value={dailyCalories}
                      onChange={(e) =>
                        setDailyCalories(Math.max(500, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-transparent border-b border-[#242A3A] text-lg font-black text-[#F5F7FC] focus:outline-none focus:border-[#C8FF00]"
                    />
                    <span className="text-[10px] text-[#70788D] mt-1 block">Daily Budget</span>
                  </div>

                  {/* Protein */}
                  <div className="bg-[#0D101B] border border-[#242A3A] p-3 rounded-2xl">
                    <label className="text-[11px] font-bold text-[#25D9E6] block mb-1">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="400"
                      value={proteinGrams}
                      onChange={(e) =>
                        setProteinGrams(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-transparent border-b border-[#242A3A] text-lg font-black text-[#F5F7FC] focus:outline-none focus:border-[#25D9E6]"
                    />
                    <span className="text-[10px] text-[#70788D] mt-1 block">Muscle Recovery</span>
                  </div>

                  {/* Carbs */}
                  <div className="bg-[#0D101B] border border-[#242A3A] p-3 rounded-2xl">
                    <label className="text-[11px] font-bold text-[#FFB020] block mb-1">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      min="20"
                      max="800"
                      value={carbsGrams}
                      onChange={(e) =>
                        setCarbsGrams(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-transparent border-b border-[#242A3A] text-lg font-black text-[#F5F7FC] focus:outline-none focus:border-[#FFB020]"
                    />
                    <span className="text-[10px] text-[#70788D] mt-1 block">Energy Fuel</span>
                  </div>

                  {/* Fat */}
                  <div className="bg-[#0D101B] border border-[#242A3A] p-3 rounded-2xl">
                    <label className="text-[11px] font-bold text-[#FF5C67] block mb-1">
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={fatGrams}
                      onChange={(e) => setFatGrams(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-transparent border-b border-[#242A3A] text-lg font-black text-[#F5F7FC] focus:outline-none focus:border-[#FF5C67]"
                    />
                    <span className="text-[10px] text-[#70788D] mt-1 block">Hormonal Balance</span>
                  </div>
                </div>

                {/* Secondary Targets: Hydration & Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                  <div className="bg-[#0D101B] border border-[#242A3A] p-3 rounded-2xl">
                    <label className="text-[11px] font-bold text-[#39E58C] flex items-center gap-1.5 mb-1">
                      <Droplets className="w-3.5 h-3.5 text-[#39E58C]" />
                      <span>Water Target (ml)</span>
                    </label>
                    <input
                      type="number"
                      step="250"
                      min="1000"
                      max="6000"
                      value={waterTargetMl}
                      onChange={(e) =>
                        setWaterTargetMl(Math.max(500, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-transparent border-b border-[#242A3A] text-base font-black text-[#F5F7FC] focus:outline-none focus:border-[#39E58C]"
                    />
                    <span className="text-[10px] text-[#70788D] mt-1 block">
                      ~{Math.round(waterTargetMl / 250)} standard glasses
                    </span>
                  </div>

                  <div className="bg-[#0D101B] border border-[#242A3A] p-3 rounded-2xl">
                    <label className="text-[11px] font-bold text-[#25D9E6] flex items-center gap-1.5 mb-1">
                      <Footprints className="w-3.5 h-3.5 text-[#25D9E6]" />
                      <span>Daily Step Target</span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="2000"
                      max="50000"
                      value={stepsTarget}
                      onChange={(e) =>
                        setStepsTarget(Math.max(1000, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-transparent border-b border-[#242A3A] text-base font-black text-[#F5F7FC] focus:outline-none focus:border-[#25D9E6]"
                    />
                    <span className="text-[10px] text-[#70788D] mt-1 block">Cadence goal</span>
                  </div>

                  <div className="bg-[#0D101B] border border-[#242A3A] p-3 rounded-2xl">
                    <label className="text-[11px] font-bold text-[#8B5CF6] flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>Active Exercise (min)</span>
                    </label>
                    <input
                      type="number"
                      step="5"
                      min="10"
                      max="300"
                      value={activeMinutesTarget}
                      onChange={(e) =>
                        setActiveMinutesTarget(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full bg-transparent border-b border-[#242A3A] text-base font-black text-[#F5F7FC] focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <span className="text-[10px] text-[#70788D] mt-1 block">Aerobic duration</span>
                  </div>
                </div>

                {/* Dietary Preference */}
                <div className="pt-2">
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                    Dietary Classification
                  </label>
                  <select
                    value={dietaryPreference}
                    onChange={(e) => setDietaryPreference(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                  >
                    <option value="Veg">Vegetarian (Lacto/Ovo)</option>
                    <option value="Egg">Eggitarian</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                    <option value="Vegan">Vegan (100% Plant-Based)</option>
                    <option value="Jain">Jain Friendly</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#C8FF00] hover:bg-[#B4E600] disabled:opacity-50 text-[#080A12] text-sm font-black transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,255,0,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synchronizing Vitality Parameters...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save & Apply Vitality Goals</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
