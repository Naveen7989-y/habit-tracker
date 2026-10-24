import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COMMON_TIMEZONES } from '../utils/constants';
import confetti from 'canvas-confetti';
import {
  Settings as SettingsIcon,
  Palette,
  Sun,
  Moon,
  Globe,
  Bell,
  Lock,
  Download,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
} from 'lucide-react';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, isDark, setTheme } = useTheme();

  // Regional & Units State
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [unitSystem, setUnitSystem] = useState(() => {
    return localStorage.getItem('habytat_unit_system') || 'metric';
  });
  const [clockFormat, setClockFormat] = useState(() => {
    return localStorage.getItem('habytat_clock_format') || '12h';
  });

  // Notification Preferences State (Stored in localStorage)
  const [notifHydration, setNotifHydration] = useState(() => {
    return localStorage.getItem('habytat_notif_hydration') !== 'false';
  });
  const [notifHabits, setNotifHabits] = useState(() => {
    return localStorage.getItem('habytat_notif_habits') !== 'false';
  });
  const [soundEffects, setSoundEffects] = useState(() => {
    return localStorage.getItem('habytat_sound_effects') !== 'false';
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // General Settings Saving
  const [savingSettings, setSavingSettings] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Save General Preferences
  const handleSavePreferences = async (e) => {
    e?.preventDefault();
    setSavingSettings(true);
    setGeneralError(null);
    setGeneralSuccess(false);

    try {
      // Save timezone to user profile
      if (timezone !== user?.timezone) {
        await updateProfile({ timezone });
      }

      // Save local preferences
      localStorage.setItem('habytat_unit_system', unitSystem);
      localStorage.setItem('habytat_clock_format', clockFormat);
      localStorage.setItem('habytat_notif_hydration', String(notifHydration));
      localStorage.setItem('habytat_notif_habits', String(notifHabits));
      localStorage.setItem('habytat_sound_effects', String(soundEffects));

      setGeneralSuccess(true);
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#8B5CF6', '#C8FF00', '#25D9E6'],
      });
      setTimeout(() => setGeneralSuccess(false), 3000);
    } catch (err) {
      setGeneralError(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setPasswordSaving(true);
      await updateProfile({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Export User Telemetry Data
  const handleExportData = () => {
    const exportObject = {
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        timezone: user?.timezone,
      },
      preferences: {
        unitSystem,
        clockFormat,
        theme,
      },
      exportedAt: new Date().toISOString(),
      platform: 'HAbyTAT Intelligent Vitality System',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `habytat_telemetry_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-2 sm:px-6 py-4 sm:py-6 w-full space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences & Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5F7FC]">
            Theme & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#70788D] mt-1">
            Configure visual appearance, theme modes, interface localization, and account security
          </p>
        </div>

        {/* Global Success / Error Alerts */}
        {generalError && (
          <div className="p-3.5 bg-[#FF5C67]/10 border border-[#FF5C67]/30 rounded-2xl text-[#FF5C67] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {generalSuccess && (
          <div className="p-3.5 bg-[#39E58C]/15 border border-[#39E58C]/30 rounded-2xl text-[#39E58C] text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Preferences updated and saved successfully!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* SECTION 1: VISUAL THEME & STUDIO */}
          <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#C8FF00]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                  Visual Theme Studio
                </h2>
              </div>
              <span className="text-[11px] text-[#70788D]">Real-time visual mode</span>
            </div>

            {/* Light / Dark Mode High-Contrast Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  !isDark
                    ? 'border-[#C8FF00] bg-white text-slate-900 shadow-[0_0_20px_rgba(200,255,0,0.25)]'
                    : 'border-[#242A3A] bg-[#0D101B] text-[#A4AABC] hover:border-[#70788D]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                    <Sun className="w-6 h-6 fill-amber-500" />
                  </div>
                  <div>
                    <span className="font-black text-sm block">Light High-Contrast Mode</span>
                    <span className="text-xs text-slate-500">
                      Crisp, high-legibility daytime theme (adyapan inspired)
                    </span>
                  </div>
                </div>
                {!isDark && (
                  <span className="w-3 h-3 rounded-full bg-[#C8FF00] border-2 border-slate-900" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                  isDark
                    ? 'border-[#C8FF00] bg-[#151A29] text-[#F5F7FC] shadow-[0_0_20px_rgba(200,255,0,0.25)]'
                    : 'border-[#242A3A] bg-[#0D101B] text-[#A4AABC] hover:border-[#70788D]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6]">
                    <Moon className="w-6 h-6 fill-[#8B5CF6]/50" />
                  </div>
                  <div>
                    <span className="font-black text-sm block">Cyber Dark Mode</span>
                    <span className="text-xs text-[#70788D]">
                      OLED deep black with neon telemetry accents
                    </span>
                  </div>
                </div>
                {isDark && (
                  <span className="w-3 h-3 rounded-full bg-[#C8FF00] border-2 border-[#080A12]" />
                )}
              </button>
            </div>

            {/* Accent Palettes */}
            <div>
              <label className="text-xs font-semibold text-[#A4AABC] block mb-2">
                Accent Theme Accents
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'midnight-sea', name: 'Midnight Sea', color: '#C8FF00', desc: 'Neon Lime' },
                  { id: 'fresh-sky', name: 'Fresh Sky', color: '#30AFFF', desc: 'Electric Cyan' },
                  { id: 'soft-sunrise', name: 'Soft Sunrise', color: '#FFBE91', desc: 'Amber Glow' },
                  { id: 'warm-horizon', name: 'Warm Horizon', color: '#F2765E', desc: 'Coral Flame' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      theme === item.id
                        ? 'bg-[#151A29] border-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.2)]'
                        : 'bg-[#0D101B] border-[#242A3A] hover:border-[#70788D]'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <span className="text-xs font-bold text-[#F5F7FC] block">{item.name}</span>
                      <span className="text-[10px] text-[#70788D]">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: LOCALIZATION & UNIT SYSTEM */}
          <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#39E58C]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                  Regional & Unit Localization
                </h2>
              </div>
              <span className="text-[11px] text-[#70788D]">Display preferences</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Timezone */}
              <div>
                <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Units System */}
              <div>
                <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                  Measurement System
                </label>
                <select
                  value={unitSystem}
                  onChange={(e) => setUnitSystem(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                >
                  <option value="metric">Metric (kg, km, ml, cm)</option>
                  <option value="imperial">Imperial (lbs, miles, fl oz, ft/in)</option>
                </select>
              </div>

              {/* Clock Format */}
              <div>
                <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                  Clock Time Format
                </label>
                <select
                  value={clockFormat}
                  onChange={(e) => setClockFormat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                >
                  <option value="12h">12-Hour (e.g. 05:30 PM)</option>
                  <option value="24h">24-Hour (e.g. 17:30)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl bg-[#151A29] hover:bg-[#C8FF00] text-[#C8FF00] hover:text-[#080A12] border border-[#242A3A] hover:border-[#C8FF00] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Localization</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: NOTIFICATIONS & TELEMETRY ALERTS */}
          <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#25D9E6]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                  Alert & Prompt Configuration
                </h2>
              </div>
              <span className="text-[11px] text-[#70788D]">In-app notification controls</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0D101B] border border-[#1D2332]">
                <div>
                  <span className="text-xs font-bold text-[#F5F7FC] block">
                    Hydration Drinking Prompts
                  </span>
                  <span className="text-[11px] text-[#70788D]">
                    Periodic telemetry reminders to log 250ml glasses of water
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifHydration(!notifHydration)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    notifHydration ? 'bg-[#39E58C]' : 'bg-[#242A3A]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      notifHydration ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0D101B] border border-[#1D2332]">
                <div>
                  <span className="text-xs font-bold text-[#F5F7FC] block">
                    Daily Habit Streak Protection
                  </span>
                  <span className="text-[11px] text-[#70788D]">
                    Reminders before midnight to maintain active streaks
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifHabits(!notifHabits)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    notifHabits ? 'bg-[#39E58C]' : 'bg-[#242A3A]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      notifHabits ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0D101B] border border-[#1D2332]">
                <div>
                  <span className="text-xs font-bold text-[#F5F7FC] block">
                    Audio & Celebratory Effects
                  </span>
                  <span className="text-[11px] text-[#70788D]">
                    Confetti bursts and goal completion animations
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEffects(!soundEffects)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    soundEffects ? 'bg-[#C8FF00]' : 'bg-[#242A3A]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-[#080A12] transition-transform ${
                      soundEffects ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: SECURITY & PASSWORD CHANGE */}
          <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#8B5CF6]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                  Account Security & Password
                </h2>
              </div>
              <span className="text-[11px] text-[#70788D]">Encrypted authentication</span>
            </div>

            {passwordError && (
              <div className="p-3 bg-[#FF5C67]/10 border border-[#FF5C67]/30 rounded-xl text-[#FF5C67] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-[#39E58C]/15 border border-[#39E58C]/30 rounded-xl text-[#39E58C] text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Password updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-[#8B5CF6]/25 cursor-pointer"
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 5: DATA EXPORT & AUDIT */}
          <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-[#FFB020]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                  Data Privacy & Telemetry Export
                </h2>
              </div>
              <span className="text-[11px] text-[#70788D]">Full data ownership</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#F5F7FC] font-semibold">
                  Export Your Personal Health Archive
                </p>
                <p className="text-[11px] text-[#70788D] mt-0.5">
                  Download a JSON copy of your habits, biometric goals, and platform preferences.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2.5 rounded-xl bg-[#0D101B] hover:bg-[#151A29] text-[#F5F7FC] border border-[#242A3A] hover:border-[#FFB020] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-[#FFB020]" />
                <span>Export JSON Archive</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
