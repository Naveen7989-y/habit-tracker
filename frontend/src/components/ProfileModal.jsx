import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COMMON_TIMEZONES } from '../utils/constants';
import { X, User, Globe, Image, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

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
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080A12]/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0D101B] border border-[#242A3A] rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#C8FF00]/10 border border-[#C8FF00]/20 flex items-center justify-center text-[#C8FF00]">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F5F7FC]">Edit Profile</h2>
            <p className="text-xs text-[#A4AABC]">Manage your account information</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FF5C67]/10 border border-[#FF5C67]/20 rounded-xl text-[#FF5C67] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-[#39E58C]/10 border border-[#39E58C]/20 rounded-xl text-[#39E58C] text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A4AABC] mb-1.5">
              Account Email
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151A29]/50 border border-[#242A3A] text-[#70788D] text-sm cursor-not-allowed"
            />
            <span className="text-[11px] text-[#70788D] mt-1 block">Email address cannot be changed</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A4AABC] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#151A29] border border-[#242A3A] text-[#F5F7FC] text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A4AABC] mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#C8FF00]" />
              <span>Timezone</span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151A29] border border-[#242A3A] text-[#F5F7FC] text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
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
              <span>Avatar Image URL (Optional)</span>
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#151A29] border border-[#242A3A] text-[#F5F7FC] text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
            />
            {avatar && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-[#A4AABC]">Preview:</span>
                <img
                  src={avatar}
                  alt="Avatar Preview"
                  onError={(e) => { e.target.style.display = 'none'; }}
                  className="w-8 h-8 rounded-full object-cover border border-[#242A3A]"
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#242A3A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] disabled:opacity-50 text-[#080A12] text-xs font-bold shadow-[0_0_12px_rgba(200,255,0,0.25)] transition-all flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#080A12]" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
