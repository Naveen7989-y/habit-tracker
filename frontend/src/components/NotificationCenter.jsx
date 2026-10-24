import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/admin.service';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  ExternalLink,
  Sparkles,
  Shield,
  Megaphone,
  AlertTriangle,
  Lightbulb,
  Trophy,
  Trash2,
  Settings,
} from 'lucide-react';

export default function NotificationCenter({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`readNotificationIds_${user?.id || 'guest'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'announcements'

  // Fetch broadcast notifications published by the Admin
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const items = await adminService.getPublicNotifications();
      setNotifications(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Could not load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Update read IDs in localStorage
  const markAsRead = (id) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    try {
      localStorage.setItem(`readNotificationIds_${user?.id || 'guest'}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save read state', e);
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(`readNotificationIds_${user?.id || 'guest'}`, JSON.stringify(allIds));
    } catch (e) {
      console.warn('Could not save read state', e);
    }
  };

  const clearAllNotifications = () => {
    markAllAsRead();
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !readIds.includes(n.id);
    if (filter === 'announcements') return n.type === 'announcement' || n.type === 'challenge';
    return true;
  });

  const getCategoryConfig = (type) => {
    switch (type) {
      case 'tip':
        return {
          icon: Lightbulb,
          color: 'text-[#C8FF00]',
          bg: 'bg-[#C8FF00]/15',
          border: 'border-[#C8FF00]/30',
          label: 'Vitality Tip',
        };
      case 'challenge':
        return {
          icon: Trophy,
          color: 'text-[#FFB020]',
          bg: 'bg-[#FFB020]/15',
          border: 'border-[#FFB020]/30',
          label: 'Challenge',
        };
      case 'alert':
        return {
          icon: AlertTriangle,
          color: 'text-[#FF5C67]',
          bg: 'bg-[#FF5C67]/15',
          border: 'border-[#FF5C67]/30',
          label: 'Notice',
        };
      default:
        return {
          icon: Megaphone,
          color: 'text-[#25D9E6]',
          bg: 'bg-[#25D9E6]/15',
          border: 'border-[#25D9E6]/30',
          label: 'Broadcast',
        };
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Recent';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Popover / Drawer */}
      <div className="fixed top-16 md:top-20 right-2 sm:right-6 md:right-10 w-[95vw] sm:w-[420px] max-h-[85vh] z-50 bg-[#0D101B] border border-[#242A3A] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1D2332] bg-[#111522]/80 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-[#151A29] border border-[#242A3A]">
              <Bell className="w-4 h-4 text-[#C8FF00]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]" />
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#F5F7FC] flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#C8FF00] text-[#080A12]">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-[#70788D]">Admin broadcasts & vitality alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="p-1.5 rounded-lg text-[#A4AABC] hover:text-[#C8FF00] hover:bg-[#151A29] transition-colors text-xs font-semibold flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline text-[11px]">Mark read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Broadcast Quick Banner (if user is Admin) */}
        {user?.role === 'ADMIN' && (
          <div className="px-4 py-2 bg-[#C8FF00]/10 border-b border-[#C8FF00]/20 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#C8FF00] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Admin Control Enabled
            </span>
            <Link
              to="/admin/dashboard?tab=notifications"
              onClick={onClose}
              className="text-[11px] font-black text-[#080A12] bg-[#C8FF00] hover:bg-[#B4E600] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>Manage Broadcasts</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2.5 bg-[#0B0E17] border-b border-[#1D2332] text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#151A29] text-[#F5F7FC] border border-[#242A3A]'
                : 'text-[#70788D] hover:text-[#A4AABC]'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filter === 'unread'
                ? 'bg-[#151A29] text-[#C8FF00] border border-[#C8FF00]/30'
                : 'text-[#70788D] hover:text-[#A4AABC]'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('announcements')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filter === 'announcements'
                ? 'bg-[#151A29] text-[#25D9E6] border border-[#25D9E6]/30'
                : 'text-[#70788D] hover:text-[#A4AABC]'
            }`}
          >
            Broadcasts
          </button>
        </div>

        {/* Notifications Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 max-h-[55vh] scrollbar-thin">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#70788D] space-y-2">
              <div className="w-6 h-6 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Syncing broadcast telemetry...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#70788D] space-y-2">
              <Sparkles className="w-8 h-8 text-[#C8FF00]/40 mx-auto" />
              <p className="font-semibold text-[#F5F7FC]">You're all caught up!</p>
              <p className="text-[11px] text-[#70788D]">No new notifications at this time.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isRead = readIds.includes(n.id);
              const config = getCategoryConfig(n.type);
              const Icon = config.icon;

              return (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                    isRead
                      ? 'bg-[#111522]/50 border-[#1D2332] opacity-75 hover:opacity-100 hover:border-[#242A3A]'
                      : 'bg-[#111522] border-[#242A3A] shadow-md hover:border-[#C8FF00]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${config.bg} ${config.border} border ${config.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </span>
                        <span className="text-[10px] text-[#70788D]">
                          {formatTime(n.createdAt)}
                        </span>
                      </div>

                      <h3
                        className={`text-xs font-bold leading-tight ${
                          isRead ? 'text-[#A4AABC]' : 'text-[#F5F7FC]'
                        }`}
                      >
                        {n.title}
                      </h3>

                      <p className="text-[11px] text-[#70788D] mt-1 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Action Link Button if provided by Admin */}
                      {n.actionLink && (
                        <div className="mt-2.5 pt-2 border-t border-[#1D2332]/60 flex items-center justify-between">
                          <Link
                            to={n.actionLink}
                            onClick={() => {
                              markAsRead(n.id);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#151A29] hover:bg-[#C8FF00] text-[#C8FF00] hover:text-[#080A12] text-[11px] font-bold border border-[#242A3A] hover:border-[#C8FF00] transition-all"
                          >
                            <span>{n.actionText || 'View Details'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          {!isRead && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(n.id);
                              }}
                              className="text-[10px] text-[#70788D] hover:text-[#C8FF00] flex items-center gap-1 font-medium"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" /> Mark read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isRead && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#C8FF00] shadow-[0_0_6px_#C8FF00]" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1D2332] bg-[#111522]/80 backdrop-blur-md flex items-center justify-between text-[11px] text-[#70788D]">
          <span>HAbyTAT Telemetry Dispatch</span>
          <button
            type="button"
            onClick={fetchNotifications}
            className="text-[#A4AABC] hover:text-[#C8FF00] transition-colors font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>
    </>
  );
}
