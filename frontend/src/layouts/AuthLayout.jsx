import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 py-12">
        {/* Header Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              HAbyTAT
            </span>
          </Link>
          {title && <h2 className="mt-4 text-2xl font-bold text-white tracking-tight">{title}</h2>}
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>

        {/* Content Card */}
        {children}
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
        HAbyTAT SaaS • Secure JWT Authentication
      </footer>
    </div>
  );
}
