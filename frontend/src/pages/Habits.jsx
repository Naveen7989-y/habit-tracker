import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { habitService } from '../services/habit.service';
import { completionService } from '../services/completion.service';
import { statisticsService } from '../services/statistics.service';
import DashboardLayout from '../layouts/DashboardLayout';
import MobileModuleToggle from '../components/fitness/MobileModuleToggle';
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
  '#C8FF00', // Neon Lime
  '#8B5CF6', // Electric Violet
  '#25D9E6', // Cyber Cyan
  '#39E58C', // Emerald Green
  '#FF5C67', // Coral Red
  '#FFBF47', // Amber Gold
  '#6366f1', // Indigo
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
    <DashboardLayout>
      {/* Main Content Area */}
      <div className="w-full pt-2 sm:pt-4 pb-6 space-y-6">
        {/* Top Header & Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30 mb-2">
              <Flame className="w-3.5 h-3.5 text-[#C8FF00]" />
              <span>Phase 6 Streak Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#F5F7FC]">
              Habits & Streak Engine
            </h1>
            <p className="text-xs sm:text-sm text-[#70788D] mt-1">
              Backend streak calculations tracking current streaks, best streaks, and completion rates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] text-xs sm:text-sm font-bold shadow-[0_0_12px_rgba(200,255,0,0.25)] flex items-center gap-2 transition-all duration-150 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Habit</span>
            </button>
          </div>
        </div>

        <MobileModuleToggle active="habit" />

        {/* High-Impact Streak Summary Cards */}
        {streakSummary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-[#111522] border border-[#242A3A] rounded-[22px] p-3.5 sm:p-4 md:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-[#70788D] uppercase tracking-wider">
                  Current Best
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00] shrink-0">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#C8FF00] mt-1.5 sm:mt-2">
                {streakSummary.bestCurrentStreak}{' '}
                <span className="text-[10px] sm:text-xs font-normal text-[#70788D]">days</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#70788D] mt-0.5 sm:mt-1 truncate">Active momentum</p>
            </div>

            <div className="bg-[#111522] border border-[#242A3A] rounded-[22px] p-3.5 sm:p-4 md:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-[#70788D] uppercase tracking-wider">
                  Longest Ever
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shrink-0">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#8B5CF6] mt-1.5 sm:mt-2">
                {streakSummary.bestEverStreak}{' '}
                <span className="text-[10px] sm:text-xs font-normal text-[#70788D]">days</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#70788D] mt-0.5 sm:mt-1 truncate">All-time record</p>
            </div>

            <div className="bg-[#111522] border border-[#242A3A] rounded-[22px] p-3.5 sm:p-4 md:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-[#70788D] uppercase tracking-wider">
                  Success Rate
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#39E58C]/15 border border-[#39E58C]/30 flex items-center justify-center text-[#39E58C] shrink-0">
                  <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#39E58C] mt-1.5 sm:mt-2">
                {streakSummary.averageCompletionRate}%
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#70788D] mt-0.5 sm:mt-1 truncate">Avg consistency</p>
            </div>

            <div className="bg-[#111522] border border-[#242A3A] rounded-[22px] p-3.5 sm:p-4 md:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-[#70788D] uppercase tracking-wider">
                  Total Completed
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#25D9E6]/15 border border-[#25D9E6]/30 flex items-center justify-center text-[#25D9E6] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl md:text-3xl font-black text-[#25D9E6] mt-1.5 sm:mt-2">
                {streakSummary.totalCompletions}
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#70788D] mt-0.5 sm:mt-1 truncate">Logged check-ins</p>
            </div>
          </div>

          )}

        {/* Search, Filter & Sort Controls */}
        <div className="bg-[#111522] border border-[#242A3A] rounded-[22px] p-4 space-y-3.5">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#70788D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search habits by name or description..."
                className="w-full pl-10 pr-4 py-2 bg-[#0D101B] border border-[#1D2332] rounded-xl text-[#F5F7FC] placeholder-[#70788D] text-xs sm:text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70788D] hover:text-[#F5F7FC]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Tabs */}
            <div className="flex items-center bg-[#0D101B] border border-[#1D2332] rounded-xl p-1 shrink-0 w-full md:w-auto">
              {['active', 'archived', 'all'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    selectedStatus === status
                      ? 'bg-[#C8FF00] text-[#080A12] font-bold shadow'
                      : 'text-[#A4AABC] hover:text-[#F5F7FC]'
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
                className="w-full md:w-auto px-3.5 py-2 bg-[#0D101B] border border-[#1D2332] rounded-xl text-[#F5F7FC] text-xs font-semibold focus:outline-none focus:border-[#C8FF00] transition-all appearance-none pr-8 cursor-pointer"
              >
                <option value="newest" className="bg-[#0D101B] text-[#F5F7FC]">Sort: Newest</option>
                <option value="oldest" className="bg-[#0D101B] text-[#F5F7FC]">Sort: Oldest</option>
                <option value="name_asc" className="bg-[#0D101B] text-[#F5F7FC]">Sort: Name (A-Z)</option>
                <option value="name_desc" className="bg-[#0D101B] text-[#F5F7FC]">Sort: Name (Z-A)</option>
                <option value="targetCount" className="bg-[#0D101B] text-[#F5F7FC]">Sort: Target Count</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-[#70788D] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/40 font-bold'
                    : 'bg-[#0D101B] text-[#A4AABC] border border-[#1D2332] hover:text-[#F5F7FC] hover:border-[#242A3A]'
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
            <Loader2 className="w-8 h-8 text-[#C8FF00] animate-spin" />
            <p className="text-xs font-semibold text-[#70788D]">Loading habits...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-[#FF5C67]/10 border border-[#FF5C67]/20 rounded-2xl text-[#FF5C67]">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="font-semibold text-xs sm:text-sm">{error}</p>
            <button
              onClick={fetchHabitsAndStreaks}
              className="mt-3 px-3 py-1.5 bg-[#FF5C67]/20 hover:bg-[#FF5C67]/30 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : habits.length === 0 ? (
          <div className="py-16 text-center bg-[#111522] border border-[#242A3A] rounded-[24px] p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 flex items-center justify-center text-[#C8FF00] mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-[#F5F7FC]">No habits found</h3>
              <p className="text-xs text-[#70788D] max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No habits match your active search or category filters.'
                  : 'Start your journey by creating your first daily or weekly habit.'}
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] text-xs sm:text-sm font-bold shadow-[0_0_12px_rgba(200,255,0,0.25)] transition-all"
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
                  className={`relative bg-[#111522] border rounded-[24px] p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col justify-between ${
                    habit.isArchived
                      ? 'border-[#242A3A]/60 opacity-60'
                      : habit.isCompletedToday
                        ? 'border-[#39E58C]/40 bg-[#111522] shadow-[0_0_15px_rgba(57,229,140,0.1)]'
                        : 'border-[#242A3A] hover:border-[#C8FF00]/40'
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30">
                              <Flame className="w-3 h-3 text-[#C8FF00]" />
                              <span>{habit.currentStreak}d streak</span>
                            </span>
                          </div>
                          <h3 className="font-bold text-[#F5F7FC] text-base mt-1 line-clamp-1">
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
                          className="p-1.5 rounded-lg text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === habit.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-[#0D101B] border border-[#242A3A] rounded-xl shadow-2xl py-1 z-20 text-xs animate-scale-in">
                            <button
                              onClick={() => handleOpenHistory(habit)}
                              className="w-full px-3 py-2 text-left text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] flex items-center gap-2"
                            >
                              <HistoryIcon className="w-3.5 h-3.5 text-[#C8FF00]" />
                              <span>View History</span>
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(habit)}
                              className="w-full px-3 py-2 text-left text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#70788D]" />
                              <span>Edit Habit</span>
                            </button>
                            <button
                              onClick={() => handleToggleArchive(habit.id)}
                              className="w-full px-3 py-2 text-left text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] flex items-center gap-2"
                            >
                              {habit.isArchived ? (
                                <>
                                  <ArchiveRestore className="w-3.5 h-3.5 text-[#FFBF47]" />
                                  <span>Unarchive</span>
                                </>
                              ) : (
                                <>
                                  <Archive className="w-3.5 h-3.5 text-[#FFBF47]" />
                                  <span>Archive</span>
                                </>
                              )}
                            </button>
                            <div className="border-t border-[#1D2332] my-1"></div>
                            <button
                              onClick={() => {
                                setDeleteConfirmId(habit.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-[#FF5C67] hover:bg-[#FF5C67]/10 flex items-center gap-2"
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
                      <p className="text-xs text-[#70788D] line-clamp-2 mb-3">
                        {habit.description}
                      </p>
                    )}

                    {/* Streak & Consistency Bar */}
                    <div className="bg-[#0D101B] border border-[#1D2332] rounded-xl p-2.5 mb-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#70788D]">
                        <Trophy className="w-3.5 h-3.5 text-[#FFBF47]" />
                        <span>Best: <strong className="text-[#F5F7FC]">{habit.longestStreak}d</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#70788D]">
                        <Percent className="w-3.5 h-3.5 text-[#C8FF00]" />
                        <span>Rate: <strong className="text-[#F5F7FC]">{habit.completionRate}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Stats & Completion Toggle Button */}
                  <div className="pt-3 border-t border-[#1D2332] space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#70788D]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#70788D]" />
                        <span>{habit.reminderTime || 'Anytime'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Target className="w-3.5 h-3.5 text-[#C8FF00]" />
                        <span>{habit.targetCount} {habit.frequency.toLowerCase()}</span>
                      </div>
                    </div>

                    {/* Completion Action Button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleOpenHistory(habit)}
                        className="text-xs font-semibold text-[#70788D] hover:text-[#F5F7FC] flex items-center gap-1 transition-colors"
                        title="Click to view full completion history"
                      >
                        <HistoryIcon className="w-3.5 h-3.5 text-[#C8FF00]" />
                        <span>{habit.totalCompletions} logs</span>
                      </button>

                      {/* Interactive 1-Click Complete / Undo Button */}
                      <button
                        onClick={() => handleToggleCompletion(habit)}
                        disabled={isToggling || habit.isArchived}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
                          habit.isCompletedToday
                            ? 'bg-[#39E58C]/20 text-[#39E58C] border border-[#39E58C]/40 hover:bg-[#39E58C]/30'
                            : 'bg-[#151A29] text-[#A4AABC] hover:text-[#080A12] hover:bg-[#C8FF00] hover:border-[#C8FF00] border border-[#242A3A]'
                        }`}
                        title={habit.isCompletedToday ? "Click to undo today's completion" : "Click to complete for today"}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : habit.isCompletedToday ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#39E58C]" />
                            <span>Done Today</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-[#70788D]" />
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
      </div>

      {/* Completion History Modal */}
      {historyHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D101B] border border-[#242A3A] rounded-[24px] max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1D2332] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C8FF00] tracking-wider">
                  Completion History
                </span>
                <h2 className="text-base sm:text-lg font-bold text-[#F5F7FC] mt-0.5">
                  {historyHabit.name}
                </h2>
              </div>
              <button
                onClick={() => setHistoryHabit(null)}
                className="p-1 rounded-lg text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {historyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-[#C8FF00] animate-spin" />
                  <p className="text-xs text-[#70788D]">Loading history records...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="py-12 text-center text-[#70788D] text-xs">
                  No completions recorded yet for this habit.
                </div>
              ) : (
                historyData.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#111522] border border-[#1D2332] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#39E58C]/15 border border-[#39E58C]/30 text-[#39E58C] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#F5F7FC]">{c.completedDate}</p>
                        {c.note ? (
                          <p className="text-[11px] text-[#A4AABC] italic">"{c.note}"</p>
                        ) : (
                          <p className="text-[10px] text-[#70788D]">
                            Logged at {new Date(c.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-[#39E58C] bg-[#39E58C]/15 px-2.5 py-0.5 rounded-full border border-[#39E58C]/30 shrink-0">
                      Completed
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#1D2332] pt-3 flex justify-end">
              <button
                onClick={() => setHistoryHabit(null)}
                className="px-4 py-2 rounded-xl bg-[#151A29] hover:bg-[#1D2332] text-[#F5F7FC] text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D101B] border border-[#242A3A] rounded-[24px] max-w-lg w-full p-4 sm:p-6 md:p-8 shadow-2xl space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1D2332] pb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#F5F7FC]">
                {editingHabit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-[#FF5C67]/10 border border-[#FF5C67]/20 rounded-xl text-[#FF5C67] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A4AABC] uppercase tracking-wider mb-1.5">
                  Habit Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Read Books, Drink Water, Yoga"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#151A29] border border-[#242A3A] rounded-xl text-[#F5F7FC] placeholder-[#70788D] text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A4AABC] uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your motivation or specifics..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-[#151A29] border border-[#242A3A] rounded-xl text-[#F5F7FC] placeholder-[#70788D] text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]/50 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A4AABC] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#151A29] border border-[#242A3A] rounded-xl text-[#F5F7FC] text-sm focus:outline-none focus:border-[#C8FF00] transition-all cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0D101B] text-[#F5F7FC]">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A4AABC] uppercase tracking-wider mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#151A29] border border-[#242A3A] rounded-xl text-[#F5F7FC] text-sm focus:outline-none focus:border-[#C8FF00] transition-all cursor-pointer"
                  >
                    <option value="Daily" className="bg-[#0D101B] text-[#F5F7FC]">Daily</option>
                    <option value="Weekly" className="bg-[#0D101B] text-[#F5F7FC]">Weekly</option>
                    <option value="Specific Days" className="bg-[#0D101B] text-[#F5F7FC]">Specific Days</option>
                    <option value="Custom" className="bg-[#0D101B] text-[#F5F7FC]">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#A4AABC] uppercase tracking-wider mb-1.5">
                    Target Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.targetCount}
                    onChange={(e) => setFormData({ ...formData, targetCount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#151A29] border border-[#242A3A] rounded-xl text-[#F5F7FC] text-sm focus:outline-none focus:border-[#C8FF00] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A4AABC] uppercase tracking-wider mb-1.5">
                    Reminder Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={formData.reminderTime || ''}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#151A29] border border-[#242A3A] rounded-xl text-[#F5F7FC] text-sm focus:outline-none focus:border-[#C8FF00] transition-all"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#A4AABC] uppercase tracking-wider mb-2">
                  Theme Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-xl transition-all duration-200 ${
                        formData.color === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#080A12] scale-110'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#A4AABC] uppercase tracking-wider mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                  {Object.entries(ICONS).map(([name, IconComp]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: name })}
                      className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                        formData.icon === name
                          ? 'bg-[#C8FF00]/20 border-[#C8FF00] text-[#C8FF00]'
                          : 'border-[#242A3A] text-[#70788D] hover:text-[#F5F7FC] hover:bg-[#151A29]'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1D2332]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] text-xs font-bold shadow-[0_0_12px_rgba(200,255,0,0.25)] flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D101B] border border-[#242A3A] rounded-[24px] max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-[#FF5C67]/15 border border-[#FF5C67]/30 flex items-center justify-center text-[#FF5C67] mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#F5F7FC]">Delete this habit?</h3>
              <p className="text-xs text-[#70788D]">
                This will permanently remove the habit and all of its logged completions. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteHabit(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-[#FF5C67] hover:bg-[#FF5C67]/90 text-white text-xs font-bold shadow-lg shadow-[#FF5C67]/30 transition-all"
              >
                Delete Habit
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
