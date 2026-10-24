import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080A12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#C8FF00] animate-spin" />
          <p className="text-xs text-[#70788D] font-medium tracking-wide">
            Verifying administrative clearance...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to discrete admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in as standard user -> show access denied
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#080A12] text-[#F5F7FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111522] border border-[#FF5C67]/40 rounded-3xl p-8 text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#FF5C67]/15 border border-[#FF5C67]/30 flex items-center justify-center mx-auto text-[#FF5C67]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F5F7FC] tracking-tight">
              403 — Restricted Administrative Zone
            </h1>
            <p className="text-xs text-[#A4AABC] mt-2 leading-relaxed">
              Your account (<span className="text-[#F5F7FC] font-semibold">{user?.email}</span>) does not have administrator privileges. All unauthorized attempts are logged for security.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#151A29] hover:bg-[#1D2332] text-xs font-semibold text-[#F5F7FC] border border-[#242A3A] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to User Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
