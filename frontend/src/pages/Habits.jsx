import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { habitService } from '../services/habit.service';
import { completionService } from '../services/completion.service';
import { statisticsService } from '../services/statistics.service';
import {
  Flame,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Calendar as CalendarIcon,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit2,
  MoreVertical,
  Activity,
  Dumbbell,
  BookOpen,
  Brain,
  Sparkles,
  Droplets,
  Heart,
  Smile,
  Moon,
  Sun,
  Apple,
  Target,
  Zap,
  Coffee,
  X,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  History as HistoryIcon,
  Trophy,
  Percent,
  TrendingUp,
  LogOut,
  Settings as SettingsIcon,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Health',
  'Fitness',
  'Study',
  'Work',
  'Personal',
  'Finance',
  'Mindfulness',
  'Sleep',
  'Nutrition',
  'Other',
];

const ICONS = {
  Activity,
  Dumbbell,
  BookOpen,
  Brain,
  Sparkles,
  Droplets,
  Heart,
  Smile,
  Moon,
  Apple,
  Target,
  Zap,
  Coffee,
};

const COLOR_PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

export default function Habits() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [habits, setHabits] = useState([]);
  const [streakSummary, setStreakSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('active'); // 'active', 'archived', 'all'
  const [sortBy, setSortBy] = useState('newest');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // History Drawer State
  const [historyHabit, setHistoryHabit] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Health',
    color: '#6366f1',
    icon: 'Activity',
    frequency: 'Daily',
    targetCount: 1,
    reminderTime: '08:00',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Toggling state per habit ID
  const [togglingHabitId, setTogglingHabitId] = useState(null);

  const fetchHabitsAndStreaks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [habitsData, streaksData] = await Promise.all([
        habitService.getHabits({
          search: searchQuery,
          category: selectedCategory,
          status: selectedStatus,
          sortBy,
        }),
        statisticsService.getStreakStats().catch(() => null),
      ]);
      setHabits(habitsData);
      if (streaksData) {
        setStreakSummary(streaksData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitsAndStreaks();
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Handle 1-click Completion / Undo Toggle
  const handleToggleCompletion = async (habit) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isCurrentlyDone = habit.isCompletedToday;
    setTogglingHabitId(habit.id);

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habit.id) {
          const newCurrentStreak = isCurrentlyDone
            ? Math.max(0, h.currentStreak - 1)
            : h.currentStreak + 1;
          const newLongestStreak = Math.max(h.longestStreak, newCurrentStreak);
          const newTotal = isCurrentlyDone
            ? Math.max(0, h.totalCompletions - 1)
            : h.totalCompletions + 1;

          return {
            ...h,
            isCompletedToday: !isCurrentlyDone,
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            totalCompletions: newTotal,
          };
        }
        return h;
      })
    );

    try {
      if (isCurrentlyDone) {
        await completionService.undoCompletion(habit.id, todayStr);
      } else {
        await completionService.completeHabit(habit.id, { completedDate: todayStr });
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.8 },
          colors: [habit.color, '#10b981', '#ffffff'],
        });
      }
      // Re-sync exact backend calculations in background
      const updatedStreaks = await statisticsService.getStreakStats().catch(() => null);
      if (updatedStreaks) setStreakSummary(updatedStreaks);
    } catch (err) {
      console.error('Failed to toggle completion:', err);
      fetchHabitsAndStreaks();
    } finally {
      setTogglingHabitId(null);
    }
  };

  // Open History Modal
  const handleOpenHistory = async (habit) => {
    setHistoryHabit(habit);
    setActiveMenuId(null);
    setHistoryLoading(true);
    try {
      const res = await completionService.getHabitCompletions(habit.id);
      setHistoryData(res.completions || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingHabit(null);
    setFormData({
      name: '',
      description: '',
      category: 'Health',
      color: '#6366f1',
      icon: 'Activity',
      frequency: 'Daily',
      targetCount: 1,
      reminderTime: '08:00',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      description: habit.description || '',
      category: habit.category || 'Other',
      color: habit.color || '#6366f1',
      icon: habit.icon || 'Activity',
      frequency: habit.frequency || 'Daily',
      targetCount: habit.targetCount || 1,
      reminderTime: habit.reminderTime || '',
    });
    setFormError(null);
    setIsModalOpen(true);
    setActiveMenuId(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Habit name is required');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingHabit) {
        await habitService.updateHabit(editingHabit.id, formData);
      } else {
        await habitService.createHabit(formData);
      }
      setIsModalOpen(false);
      fetchHabitsAndStreaks();
    } catch (err) {
      setFormError(err.message || 'Failed to save habit');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleArchive = async (habitId) => {
    try {
      await habitService.toggleArchive(habitId);
      setActiveMenuId(null);
      fetchHabitsAndStreaks();
    } catch (err) {
      alert(err.message || 'Failed to update archive status');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await habitService.deleteHabit(habitId);
      setDeleteConfirmId(null);
      setActiveMenuId(null);
      fetchHabitsAndStreaks();
    } catch (err) {
      alert(err.message || 'Failed to delete habit');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg text-white">HAbyTAT</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/statistics"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/calendar"
              className="px-3.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calendar</span>
            </Link>
            <button
              onClick={handleOpenCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>New Habit</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <Link
              to="/settings"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
              title="Account Settings"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{user?.name}</span>
            </Link>
            <button
              onClick={logout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Top Header & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>Phase 6 Streak Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Habits & Streak Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Backend streak calculations tracking current streaks, best streaks, and completion rates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create Habit</span>
            </button>
          </div>
        </div>

        {/* High-Impact Streak Summary Cards */}
        {streakSummary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Current Best
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">
                {streakSummary.bestCurrentStreak}{' '}
                <span className="text-xs font-normal text-slate-400">days</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Active consecutive momentum</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Longest Ever
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-2">
                {streakSummary.bestEverStreak}{' '}
                <span className="text-xs font-normal text-slate-400">days</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">All-time record streak</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Success Rate
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
                {streakSummary.averageCompletionRate}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Average consistency</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Completed
                </span>
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-violet-400 mt-2">
                {streakSummary.totalCompletions}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Logged check-ins</p>
            </div>
          </div>
        )}

        {/* Search, Filter & Sort Controls */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search habits by name or description..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 shrink-0 w-full md:w-auto">
              {['active', 'archived', 'all'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedStatus === status
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="relative shrink-0 w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full md:w-auto px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none pr-8 cursor-pointer"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="name_asc">Sort: Name (A-Z)</option>
                <option value="name_desc">Sort: Name (Z-A)</option>
                <option value="targetCount">Sort: Target Count</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                    : 'bg-slate-950/50 text-slate-400 border border-slate-800/80 hover:text-white hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Habit Card Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading habits...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchHabitsAndStreaks}
              className="mt-3 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : habits.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No habits found</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No habits match your active search or category filters.'
                  : 'Start your journey by creating your first daily or weekly habit.'}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => {
              const IconComponent = ICONS[habit.icon] || Activity;
              const isToggling = togglingHabitId === habit.id;

              return (
                <div
                  key={habit.id}
                  className={`relative bg-slate-900/80 border rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-slate-950/50 flex flex-col justify-between ${
                    habit.isArchived
                      ? 'border-slate-800/60 opacity-60'
                      : habit.isCompletedToday
                      ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 to-slate-900/80'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar: Icon, Category & Actions */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md shrink-0"
                          style={{
                            backgroundColor: `${habit.color}15`,
                            color: habit.color,
                            border: `1px solid ${habit.color}35`,
                          }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${habit.color}15`,
                                color: habit.color,
                                border: `1px solid ${habit.color}30`,
                              }}
                            >
                              {habit.category}
                            </span>
                            {/* Streak Badge */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Flame className="w-3 h-3 text-amber-400" />
                              <span>{habit.currentStreak}d streak</span>
                            </span>
                          </div>
                          <h3 className="font-bold text-white text-base mt-1 line-clamp-1">
                            {habit.name}
                          </h3>
                        </div>
                      </div>

                      {/* Dropdown Menu Toggle */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === habit.id ? null : habit.id)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === habit.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1 z-20 text-xs animate-scale-in">
                            <button
                              onClick={() => handleOpenHistory(habit)}
                              className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                            >
                              <HistoryIcon className="w-3.5 h-3.5 text-indigo-400" />
                              <span>View History</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(habit)}
                              className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Edit Habit</span>
                            </button>
                            <button
                              onClick={() => handleToggleArchive(habit.id)}
                              className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                            >
                              {habit.isArchived ? (
                                <>
                                  <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Unarchive</span>
                                </>
                              ) : (
                                <>
                                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Archive</span>
                                </>
                              )}
                            </button>
                            <div className="border-t border-slate-800 my-1"></div>
                            <button
                              onClick={() => {
                                setDeleteConfirmId(habit.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {habit.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {habit.description}
                      </p>
                    )}

                    {/* Streak & Consistency Bar */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Best: <strong className="text-white">{habit.longestStreak}d</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Percent className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Rate: <strong className="text-white">{habit.completionRate}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Completion Toggle Button */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{habit.reminderTime || 'Anytime'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Target className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{habit.targetCount} {habit.frequency.toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Completion Action Button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleOpenHistory(habit)}
                        className="text-xs font-semibold text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        title="Click to view full completion history"
                      >
                        <HistoryIcon className="w-3.5 h-3.5" />
                        <span>{habit.totalCompletions} logs</span>
                      </button>

                      {/* Interactive 1-Click Complete / Undo Button */}
                      <button
                        onClick={() => handleToggleCompletion(habit)}
                        disabled={isToggling || habit.isArchived}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                          habit.isCompletedToday
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                        }`}
                        title={habit.isCompletedToday ? 'Click to undo today\'s completion' : 'Click to complete for today'}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : habit.isCompletedToday ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Done Today</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-slate-400" />
                            <span>Mark Done</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Completion History Modal */}
      {historyHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                  Completion History
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  {historyHabit.name}
                </h2>
              </div>
              <button
                onClick={() => setHistoryHabit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {historyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-400">Loading history records...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No completions recorded yet for this habit.
                </div>
              ) : (
                historyData.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{c.completedDate}</p>
                        {c.note ? (
                          <p className="text-[11px] text-slate-400 italic">"{c.note}"</p>
                        ) : (
                          <p className="text-[10px] text-slate-500">
                            Logged at {new Date(c.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      Completed
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setHistoryHabit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Read Books, Drink Water, Yoga"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your motivation or specifics..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Specific Days">Specific Days</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.targetCount}
                    onChange={(e) => setFormData({ ...formData, targetCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Reminder Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={formData.reminderTime || ''}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-xl transition-all duration-200 ${
                        formData.color === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(ICONS).map(([name, IconComp]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: name })}
                      className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                        formData.icon === name
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                          : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingHabit ? 'Save Changes' : 'Create Habit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete this habit?</h3>
              <p className="text-xs text-slate-400">
                This will permanently remove the habit and all of its logged completions. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteHabit(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-all"
              >
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        HAbyTAT SaaS • Built with React, Express, Prisma & PostgreSQL
      </footer>
    </div>
  );
}
