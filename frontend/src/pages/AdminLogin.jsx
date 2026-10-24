import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/admin.service';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import Logo from '../components/Logo';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please provide both administrator email and master key.');
      return;
    }

    setLoading(true);
    try {
      const data = await adminService.adminLogin({ email, password });
      const authPayload = data?.data || data;

      if (authPayload?.token && authPayload?.user) {
        localStorage.setItem('habitpulse_token', authPayload.token);
        localStorage.setItem('habitpulse_user', JSON.stringify(authPayload.user));
        window.location.href = '/admin';
      } else {
        throw new Error('Authentication token was not returned.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Administrative verification failed.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-[#080A12] text-[#F5F7FC] flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#8B5CF6]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Security Watermark Header */}
      <div className="text-center mb-6 space-y-2 z-10">
        <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-[#111522] border border-[#242A3A] mb-1">
          <Logo variant="dark" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#FFBF47]/10 text-[#FFBF47] border border-[#FFBF47]/30">
            <Shield className="w-3.5 h-3.5 text-[#FFBF47]" />
            Restricted Admin Console
          </span>
        </div>
      </div>

      {/* Admin Card */}
      <div className="w-full max-w-md bg-[#0D101B] border border-[#242A3A] rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F5F7FC] tracking-tight">
            Administrator Authentication
          </h2>
          <p className="text-xs text-[#70788D] mt-1 leading-relaxed">
            Enter authorized master credentials to manage users, site content, ads, and system catalogues.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#FF5C67]/10 border border-[#FF5C67]/30 flex items-start gap-3 text-xs text-[#FF5C67]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A4AABC] flex items-center justify-between">
              <span>Admin Email</span>
              <span className="text-[10px] text-[#70788D]">Master Domain</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#70788D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@habittracker.com"
                className="w-full bg-[#111522] border border-[#242A3A] focus:border-[#C8FF00] rounded-xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-[#F5F7FC] placeholder-[#70788D] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Master Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A4AABC]">Master Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#70788D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#111522] border border-[#242A3A] focus:border-[#C8FF00] rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-[#F5F7FC] placeholder-[#70788D] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#70788D] hover:text-[#F5F7FC] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] active:scale-[0.98] text-[#080A12] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(200,255,0,0.2)] disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#080A12]" />
                <span>Verifying Administrator Token...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-[#080A12]" />
                <span>Verify & Access Console</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-[#1D2332] text-center">
          <p className="text-[11px] text-[#70788D]">
            Notice: All administrator authentication attempts and IP telemetry are securely audited.
          </p>
        </div>
      </div>
    </div>
  );
}
