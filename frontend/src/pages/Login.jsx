import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getThemeVisual } from '../utils/themeVisuals';
import Logo from '../components/Logo';
import AuthScene3D from '../components/auth/AuthScene3D';
import Card3D from '../components/auth/Card3D';
import HabitHeroVisual3D from '../components/auth/HabitHeroVisual3D';
import { 
  FloatingStreakBadge, 
  FloatingConsistencyBadge, 
  FloatingSecureBadge 
} from '../components/auth/FloatingBadges3D';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ArrowLeft,
  Zap,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const { login } = useAuth();
  const { theme, toggleTheme, setTheme, applyAccountTheme, saveAccountTheme } = useTheme();
  const themeVisual = getThemeVisual(theme);

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // When email input changes, dynamically detect if this account has a saved theme
  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (errorMessage) setErrorMessage('');
    if (newEmail && newEmail.includes('@') && newEmail.includes('.')) {
      applyAccountTheme(newEmail);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    if (email && email.includes('@')) {
      setTimeout(() => {
        const activeTheme = localStorage.getItem('habytat_theme') || 'dark';
        saveAccountTheme(email, activeTheme);
      }, 50);
    }
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: [themeVisual.accentColor, themeVisual.secondaryColor, '#ffffff', '#38bdf8', '#34d399'],
      disableForReducedMotion: true,
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    const cleanEmail = (email || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      emailInputRef.current?.focus();
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Please enter your password.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(cleanEmail, cleanPassword);
      // Persist active account and theme association
      localStorage.setItem('habytat_last_account', cleanEmail);
      saveAccountTheme(cleanEmail, theme);

      setIsSuccess(true);
      triggerCelebration();
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 700);
    } catch (err) {
      const msg = err.message || err.response?.data?.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    const demoEmail = 'alex@example.com';
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage('');
    applyAccountTheme(demoEmail);
  };

  return (
    <div 
      className={`min-h-screen min-h-[100dvh] w-full relative flex flex-col justify-between overflow-x-hidden font-sans transition-colors duration-500 ${
        themeVisual.bgClass
      } ${themeVisual.isDark ? 'text-white selection:bg-white/20' : `${themeVisual.textHeadingClass} selection:bg-sky-200`}`}
      style={themeVisual.bgStyle}
    >
      {/* Interactive 3D Canvas Background (Theme-reactive) */}
      <AuthScene3D />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        <Link 
          to="/" 
          className="group flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Logo className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105" />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/"
            className={`hidden sm:inline-flex items-center gap-1.5 text-xs transition-colors px-3 py-1.5 rounded-full ${
              themeVisual.isDark 
                ? 'text-slate-400 hover:text-white hover:bg-white/5' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          {/* Theme Switcher Button */}
          <button
            id="login-theme-toggle-btn"
            onClick={handleThemeToggle}
            type="button"
            className={`p-2 px-3 rounded-xl border transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
              themeVisual.isDark
                ? 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800/80'
                : 'bg-white/90 border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-white shadow-xs'
            }`}
            title={`Switch to ${themeVisual.isDark ? 'Light' : 'Dark'} Theme`}
            aria-label="Toggle visual theme"
          >
            {themeVisual.isDark ? (
              <Sun 
                className="w-4 h-4 transition-transform duration-300 hover:rotate-45"
                style={{ color: themeVisual.accentColor }}
              />
            ) : (
              <Moon 
                className="w-4 h-4 text-sky-600 transition-transform duration-300 hover:rotate-12"
              />
            )}
            <span className={`text-[11px] font-medium ${
              themeVisual.isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {themeVisual.isDark ? 'Dark Theme' : 'Light Theme'}
            </span>
          </button>

          {/* Segmented Auth Switcher */}
          <div className={`flex items-center p-1 rounded-full border backdrop-blur-md ${
            themeVisual.isDark
              ? 'bg-slate-900/80 border-slate-700/60'
              : 'bg-white/90 border-slate-200/90 shadow-sm'
          }`}>
            <span 
              className="px-3.5 py-1 text-xs font-semibold rounded-full !text-white shadow-md transition-all duration-300"
              style={{
                background: `linear-gradient(to right, ${themeVisual.accentColor}, ${themeVisual.secondaryColor})`,
              }}
            >
              Sign In
            </span>
            <Link
              to="/register"
              className={`px-3.5 py-1 text-xs font-medium transition-colors rounded-full ${
                themeVisual.isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Main Showcase & 3D Tilt Card Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Habit Ecosystem Showcase (Desktop) */}
          <div className="lg:col-span-6 xl:col-span-7 flex justify-center lg:justify-start">
            <HabitHeroVisual3D />
          </div>

          {/* Right Column: 3D Tilt Card */}
          <div className="lg:col-span-6 xl:col-span-5 w-full max-w-md mx-auto relative">
            
            {/* Floating Badges */}
            <div className="hidden xl:block absolute -top-6 -left-6 z-20 pointer-events-none">
              <FloatingStreakBadge />
            </div>
            <div className="hidden xl:block absolute -bottom-6 -right-6 z-20 pointer-events-none">
              <FloatingConsistencyBadge />
            </div>

            {/* The Auth Card */}
            <Card3D>
              <div className="p-6 sm:p-9 space-y-6">
                
                {/* Header & Status */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-500 ${themeVisual.textAccentClass}`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      Momentum Portal
                    </span>
                    <FloatingSecureBadge />
                  </div>

                  <h2 
                    className={`text-2xl sm:text-3xl font-normal tracking-tight transition-colors duration-500 ${
                      themeVisual.isDark ? 'text-white' : themeVisual.textHeadingClass
                    }`}
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Welcome back to <span className={`italic font-serif ${themeVisual.isDark ? 'text-white' : themeVisual.textHeadingClass}`}>HAbyTAT</span>
                  </h2>

                  <p className={`text-xs sm:text-sm transition-colors duration-500 ${
                    themeVisual.isDark ? 'text-slate-400' : themeVisual.textMutedClass
                  }`}>
                    Sign in to continue building your streak momentum.
                  </p>
                </div>

                {/* Quick Demo Fill Helper */}
                <div>
                  <button
                    id="autofill-demo-btn"
                    type="button"
                    onClick={handleDemoFill}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all group cursor-pointer border ${
                      themeVisual.isDark 
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/90 text-slate-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Autofill Demo Account (Alex Morgan)</span>
                  </button>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-red-500 text-xs shadow-lg"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Form */}
                <form 
                  onSubmit={handleSubmit} 
                  noValidate
                  className="space-y-4 text-left relative z-20"
                >
                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className={`block text-[11px] font-semibold uppercase tracking-wider ${
                      themeVisual.isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                        themeVisual.isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'
                      }`}>
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="login-email-input"
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="you@example.com"
                        required
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all shadow-inner focus:outline-none focus:ring-2 ${
                          themeVisual.focusRingClass
                        } ${
                          themeVisual.isDark
                            ? 'bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500'
                            : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-xs'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`block text-[11px] font-semibold uppercase tracking-wider ${
                        themeVisual.isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Password
                      </label>
                      <span className={`text-[11px] hover:underline cursor-pointer transition-colors ${themeVisual.textAccentClass}`}>
                        Forgot password?
                      </span>
                    </div>
                    <div className="relative group">
                      <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                        themeVisual.isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-900'
                      }`}>
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="login-password-input"
                        ref={passwordInputRef}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="••••••••••••"
                        required
                        className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all shadow-inner focus:outline-none focus:ring-2 ${
                          themeVisual.focusRingClass
                        } ${
                          themeVisual.isDark
                            ? 'bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500'
                            : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-xs'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors cursor-pointer ${
                          themeVisual.isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Interactive Submit Button */}
                  <div className="pt-2 relative z-30">
                    <motion.button
                      id="signin-btn"
                      type="submit"
                      onClick={(e) => {
                        if (!isSubmitting && !isSuccess) handleSubmit(e);
                      }}
                      disabled={isSubmitting || isSuccess}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer relative z-30 overflow-hidden group shadow-md ${themeVisual.buttonGradientClass}`}
                    >
                      {/* Button ambient shimmer */}
                      <div className="absolute inset-0 w-1/2 h-full bg-white/15 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />

                      {isSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                          <span>Welcome back! Redirecting...</span>
                        </>
                      ) : isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Authenticating credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to HAbyTAT</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>

                {/* Footer Switcher */}
                <div className={`pt-4 text-center border-t ${
                  themeVisual.isDark ? 'border-slate-800/80' : 'border-slate-200/80'
                }`}>
                  <p className={`text-xs ${themeVisual.isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Don't have an account yet?{' '}
                    <Link 
                      to="/register" 
                      className={`font-semibold underline underline-offset-4 transition-colors ${themeVisual.textAccentClass}`}
                    >
                      Create an account
                    </Link>
                  </p>
                </div>

              </div>
            </Card3D>
          </div>

        </div>
      </main>

      {/* Subtle Bottom Ambient Bar */}
      <footer className="relative z-10 w-full py-4 text-center text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} HAbyTAT. Precision Habit Engineering • Active Theme: {themeVisual.name}</p>
      </footer>
    </div>
  );
}
