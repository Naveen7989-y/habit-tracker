import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { COMMON_TIMEZONES } from '../utils/constants';
import { User, Mail, Globe, Image, Check, AlertCircle, Loader2, Moon, Sun, ShieldCheck } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();

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
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Account Settings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your personal profile, regional timezone, and application appearance
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  onError={(e) => { e.target.style.display = 'none'; }}
                  className="w-24 h-24 rounded-3xl object-cover ring-2 ring-indigo-500/40 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-3xl shadow-xl">
                  {name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{name}</h2>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>

            <div className="w-full pt-4 border-t border-slate-800 space-y-2 text-xs text-left">
              <div className="flex justify-between text-slate-400">
                <span>Account Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Timezone</span>
                <span className="text-white font-medium">{timezone}</span>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-800 space-y-2 text-left">
              <span className="text-xs text-slate-400 block font-semibold">Active Theme</span>
              <div className="grid grid-cols-2 gap-2 w-full bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme('fresh-sky')}
                  className={`col-span-2 px-2.5 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'fresh-sky'
                      ? 'bg-[#30AFFF] text-white font-bold shadow-md shadow-sky-500/20 border border-[#92EEFF]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Fresh Sky"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#30AFFF] border border-[#92EEFF]"></span>
                  <span>Fresh Sky (Default)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('soft-sunrise')}
                  className={`col-span-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'soft-sunrise'
                      ? 'bg-[#FFBE91] text-[#1c1917] font-bold shadow-md shadow-orange-500/20 border border-[#FFDDB0]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Soft Sunrise"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBE91] border border-[#FFDDB0]"></span>
                  <span>Soft Sunrise</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('golden-olive')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'golden-olive'
                      ? 'bg-[#FFDE42] text-[#1B0C0C] font-bold shadow-md shadow-yellow-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Golden Olive"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4C5C2D] border border-[#FFDE42]"></span>
                  <span>Golden Olive</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('vibrant-red')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'vibrant-red'
                      ? 'bg-[#FF0000] text-white shadow-md shadow-red-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Vibrant Red"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#830000] border border-[#BC0202]"></span>
                  <span>Vibrant Red</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'dark'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Dark Mode"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Dark Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to Light Mode"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-6">Profile Details</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Timezone</span>
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used for computing daily habit resets and completion day boundaries
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-violet-400" />
                  <span>Avatar URL</span>
                </label>
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
