import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COMMON_TIMEZONES } from '../utils/constants';
import {
  User,
  Mail,
  Globe,
  Image,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Palette,
  Flame,
  Droplets,
  Footprints,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        name: name.trim(),
        timezone,
        avatar: avatar.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-2 sm:px-6 py-4 sm:py-6 w-full space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F5F7FC]">
            Account & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#70788D] mt-1">
            Manage your personal profile, regional timezone, daily targets, and visual theme
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-[#FF5C67]/10 border border-[#FF5C67]/30 rounded-2xl text-[#FF5C67] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-[#39E58C]/10 border border-[#39E58C]/30 rounded-2xl text-[#39E58C] text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile and settings saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Overview Card */}
          <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-5 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  onError={(e) => { e.target.style.display = 'none'; }}
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
              <h2 className="text-base font-bold text-[#F5F7FC]">{name}</h2>
              <p className="text-xs text-[#70788D]">{user?.email}</p>
            </div>

            <div className="w-full pt-3 border-t border-[#1D2332] space-y-2 text-xs text-left">
              <div className="flex justify-between text-[#70788D]">
                <span>Status</span>
                <span className="text-[#39E58C] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="flex justify-between text-[#70788D]">
                <span>Timezone</span>
                <span className="text-[#F5F7FC] font-medium">{timezone}</span>
              </div>
            </div>

            {/* Theme Selector (Preserves all 4 themes!) */}
            <div className="w-full pt-3 border-t border-[#1D2332] space-y-2 text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A4AABC]">
                <Palette className="w-3.5 h-3.5 text-[#C8FF00]" />
                <span>Visual Theme</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 w-full bg-[#0D101B] p-1.5 rounded-xl border border-[#1D2332]">
                <button
                  type="button"
                  onClick={() => setTheme('midnight-sea')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'midnight-sea'
                      ? 'bg-[#151A29] text-[#C8FF00] border border-[#C8FF00]/40 shadow-[0_0_8px_rgba(200,255,0,0.2)]'
                      : 'text-[#70788D] hover:text-[#F5F7FC]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#C8FF00]"></span>
                  <span>Midnight Sea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('fresh-sky')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'fresh-sky'
                      ? 'bg-[#151A29] text-[#30AFFF] border border-[#30AFFF]/40'
                      : 'text-[#70788D] hover:text-[#F5F7FC]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#30AFFF]"></span>
                  <span>Fresh Sky</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('soft-sunrise')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'soft-sunrise'
                      ? 'bg-[#151A29] text-[#FFBE91] border border-[#FFBE91]/40'
                      : 'text-[#70788D] hover:text-[#F5F7FC]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#FFBE91]"></span>
                  <span>Soft Sunrise</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('warm-horizon')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'warm-horizon'
                      ? 'bg-[#151A29] text-[#F2765E] border border-[#F2765E]/40'
                      : 'text-[#70788D] hover:text-[#F5F7FC]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#F2765E]"></span>
                  <span>Warm Horizon</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form & Targets Column */}
          <div className="md:col-span-2 space-y-4">
            {/* Edit Profile Form */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-5 sm:p-6 space-y-4">
              <h2 className="text-sm sm:text-base font-bold text-[#F5F7FC]">
                Profile Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A4AABC] mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C8FF00]" />
                    <span>Full Name</span>
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
                  <label className="block text-xs font-semibold text-[#A4AABC] mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#70788D]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17]/60 border border-[#1D2332] text-[#70788D] text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A4AABC] mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#39E58C]" />
                    <span>Timezone</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A4AABC] mb-1.5 flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Avatar URL</span>
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0E17] border border-[#242A3A] text-[#F5F7FC] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] disabled:opacity-50 text-[#080A12] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C8FF00]/20"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Daily Fitness & Nutrition Targets Card */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-5 space-y-3">
              <h3 className="text-xs font-bold text-[#A4AABC] uppercase tracking-wider">
                Daily Fitness Targets
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#0D101B] border border-[#1D2332] p-2.5 rounded-xl text-center">
                  <Flame className="w-4 h-4 text-[#C8FF00] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#F5F7FC]">2,200 kcal</p>
                  <p className="text-[10px] text-[#70788D]">Calories</p>
                </div>

                <div className="bg-[#0D101B] border border-[#1D2332] p-2.5 rounded-xl text-center">
                  <Footprints className="w-4 h-4 text-[#25D9E6] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#F5F7FC]">10,000</p>
                  <p className="text-[10px] text-[#70788D]">Steps</p>
                </div>

                <div className="bg-[#0D101B] border border-[#1D2332] p-2.5 rounded-xl text-center">
                  <Clock className="w-4 h-4 text-[#8B5CF6] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#F5F7FC]">45 min</p>
                  <p className="text-[10px] text-[#70788D]">Active Time</p>
                </div>

                <div className="bg-[#0D101B] border border-[#1D2332] p-2.5 rounded-xl text-center">
                  <Droplets className="w-4 h-4 text-[#39E58C] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#F5F7FC]">2,500 ml</p>
                  <p className="text-[10px] text-[#70788D]">Hydration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
