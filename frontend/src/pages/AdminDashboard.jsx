import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/admin.service';
import {
  Shield,
  Users,
  LayoutTemplate,
  Utensils,
  BarChart3,
  ExternalLink,
  LogOut,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Megaphone,
  Sparkles,
  Layers,
  Image,
  Tag,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';
import Logo from '../components/Logo';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('cms'); // 'cms' | 'users' | 'foods' | 'telemetry'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Platform Telemetry State
  const [overview, setOverview] = useState(null);

  // CMS Content State
  const [contentForm, setContentForm] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroCtaText: '',
    heroCtaLink: '',
    announcementText: '',
    announcementActive: false,
    announcementType: 'info',
  });
  const [adsList, setAdsList] = useState([]);
  const [newAdModal, setNewAdModal] = useState(false);
  const [adForm, setAdForm] = useState({
    title: '',
    badge: 'Special',
    description: '',
    imageUrl: '',
    ctaText: 'Learn More',
    ctaLink: '/register',
    active: true,
  });

  // Users Management State
  const [usersList, setUsersList] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [usersLoading, setUsersLoading] = useState(false);

  // Food Catalogue State
  const [foodsList, setFoodsList] = useState([]);
  const [foodsTotal, setFoodsTotal] = useState(0);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('All');
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    regionalName: '',
    category: 'Breakfast',
    cuisine: 'Pan-Indian',
    dietaryType: 'Veg',
    servingUnit: '100g',
    servingSizeGrams: 100,
    calories: 150,
    protein: 5,
    carbs: 20,
    fat: 5,
    fiber: 2,
    isVerified: true,
  });

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [telemetry, siteContent] = await Promise.all([
        adminService.getOverview().catch(() => null),
        adminService.getContent().catch(() => null),
      ]);

      if (telemetry) setOverview(telemetry);
      if (siteContent) {
        setContentForm({
          heroTitle: siteContent.heroTitle || '',
          heroSubtitle: siteContent.heroSubtitle || '',
          heroCtaText: siteContent.heroCtaText || '',
          heroCtaLink: siteContent.heroCtaLink || '',
          announcementText: siteContent.announcementText || '',
          announcementActive: Boolean(siteContent.announcementActive),
          announcementType: siteContent.announcementType || 'info',
        });
        try {
          const parsedAds = JSON.parse(siteContent.adsJson || '[]');
          setAdsList(Array.isArray(parsedAds) ? parsedAds : []);
        } catch {
          setAdsList([]);
        }
      }
    } catch (err) {
      setErrorMessage('Failed to initialize administrator control data.');
    } finally {
      setLoading(false);
    }
  };

  // Notification Banner Helper
  const flashSuccess = (msg) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // 1. Save CMS & Site Content
  const handleSaveCMS = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      await adminService.updateContent({
        ...contentForm,
        adsJson: JSON.stringify(adsList),
      });
      flashSuccess('Website content, landing page copy, and ads saved successfully! Live visitors will see these updates immediately.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update site content.');
    } finally {
      setSaving(false);
    }
  };

  // Ad Management Handlers
  const handleAddAd = () => {
    if (!adForm.title || !adForm.description) return;
    const newAd = {
      id: `ad-${Date.now()}`,
      ...adForm,
    };
    const updated = [newAd, ...adsList];
    setAdsList(updated);
    setNewAdModal(false);
    setAdForm({
      title: '',
      badge: 'Special',
      description: '',
      imageUrl: '',
      ctaText: 'Learn More',
      ctaLink: '/register',
      active: true,
    });
    flashSuccess('Promotional ad card added. Click "Save Website Changes" to publish live.');
  };

  const handleDeleteAd = (adId) => {
    const updated = adsList.filter((a) => a.id !== adId);
    setAdsList(updated);
    flashSuccess('Ad card removed. Click "Save Website Changes" to finalize.');
  };

  const handleToggleAdStatus = (adId) => {
    const updated = adsList.map((a) => (a.id === adId ? { ...a, active: !a.active } : a));
    setAdsList(updated);
  };

  // 2. Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await adminService.getUsers({
        search: userSearch,
        role: userRoleFilter,
        limit: 50,
      });
      setUsersList(data.users || []);
      setUsersTotal(data.totalCount || 0);
    } catch (err) {
      setErrorMessage('Could not load users list.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userRoleFilter]);

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmPrompt = window.confirm(
      `Are you sure you want to change ${targetUser.name}'s role to ${newRole}?`
    );
    if (!confirmPrompt) return;

    try {
      await adminService.updateUserRole(targetUser.id, newRole);
      flashSuccess(`Successfully updated ${targetUser.name} to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const confirmPrompt = window.confirm(
      `DANGER: Are you sure you want to completely delete user "${targetUser.name}" (${targetUser.email}) and all their habits, food logs, and workouts? This action cannot be undone.`
    );
    if (!confirmPrompt) return;

    try {
      await adminService.deleteUser(targetUser.id);
      flashSuccess(`User account ${targetUser.email} has been permanently deleted.`);
      fetchUsers();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
    }
  };

  // 3. Fetch Foods
  const fetchFoods = async () => {
    setFoodsLoading(true);
    try {
      const data = await adminService.getCatalogueFoods({
        search: foodSearch,
        category: foodCategoryFilter,
        limit: 50,
      });
      setFoodsList(data.foods || []);
      setFoodsTotal(data.totalCount || 0);
    } catch (err) {
      setErrorMessage('Could not load foods catalogue.');
    } finally {
      setFoodsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'foods') {
      fetchFoods();
    }
  }, [activeTab, foodCategoryFilter]);

  const handleSaveFood = async (e) => {
    e.preventDefault();
    try {
      if (editingFood) {
        await adminService.updateCatalogueFood(editingFood.id, foodForm);
        flashSuccess(`Updated "${foodForm.name}" in catalogue.`);
      } else {
        await adminService.createCatalogueFood(foodForm);
        flashSuccess(`Added "${foodForm.name}" as official catalogue food.`);
      }
      setFoodModalOpen(false);
      setEditingFood(null);
      fetchFoods();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteFood = async (food) => {
    const confirmPrompt = window.confirm(
      `Delete "${food.name}" from the Indian nutrition catalogue?`
    );
    if (!confirmPrompt) return;

    try {
      await adminService.deleteCatalogueFood(food.id);
      flashSuccess(`Deleted "${food.name}".`);
      fetchFoods();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div
      className="min-h-screen bg-[#080A12] text-[#F5F7FC] flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0D101B]/90 backdrop-blur-md border-b border-[#242A3A] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo variant="dark" className="h-7 w-auto object-contain" />
          <div className="h-4 w-px bg-[#242A3A] hidden sm:block" />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#C8FF00]/10 text-[#C8FF00] border border-[#C8FF00]/30">
            <Shield className="w-3 h-3 text-[#C8FF00]" />
            Administration Console
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#A4AABC] hover:text-[#F5F7FC] px-3 py-1.5 rounded-xl bg-[#111522] border border-[#242A3A] transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151A29] border border-[#242A3A]">
            <div className="w-2 h-2 rounded-full bg-[#39E58C]" />
            <span className="text-xs font-semibold text-[#F5F7FC] truncate max-w-[130px]">
              {user?.name || 'Administrator'}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl bg-[#151A29] hover:bg-[#FF5C67]/20 text-[#A4AABC] hover:text-[#FF5C67] transition-colors border border-[#242A3A]"
            title="Sign out of Admin Console"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Success / Error Alerts */}
        {successBanner && (
          <div className="p-3.5 rounded-2xl bg-[#39E58C]/15 border border-[#39E58C]/30 text-xs sm:text-sm text-[#39E58C] font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button onClick={() => setSuccessBanner(null)} className="text-[#39E58C] hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#FF5C67]/15 border border-[#FF5C67]/30 text-xs sm:text-sm text-[#FF5C67] font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-[#FF5C67] hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 border-b border-[#242A3A] pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: 'cms', label: 'Pages & Content CMS', icon: LayoutTemplate },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'foods', label: 'Food Catalogue CMS', icon: Utensils },
            { id: 'telemetry', label: 'Platform Telemetry', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#C8FF00] text-[#080A12] shadow-[0_0_15px_rgba(200,255,0,0.2)]'
                    : 'bg-[#111522] text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29] border border-[#242A3A]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#080A12]' : 'text-[#A4AABC]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: WEBSITE CONTENT & CMS */}
        {activeTab === 'cms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#F5F7FC]">
                  Website Copy, Pages & Advertisement CMS
                </h2>
                <p className="text-xs text-[#70788D] mt-0.5">
                  Modify the landing page headline, subheadings, CTA buttons, announcements, and promotional cards in real-time.
                </p>
              </div>
              <button
                onClick={handleSaveCMS}
                disabled={saving}
                className="py-2.5 px-5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(200,255,0,0.25)] transition-all cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Publishing Changes...' : 'Save Website Changes'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Landing Page Hero Copy */}
              <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#242A3A] pb-3">
                  <Sparkles className="w-4 h-4 text-[#C8FF00]" />
                  <h3 className="text-sm font-bold text-[#F5F7FC]">Landing Page Hero Copy</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Hero Headline (Title)
                    </label>
                    <input
                      type="text"
                      value={contentForm.heroTitle}
                      onChange={(e) => setContentForm({ ...contentForm, heroTitle: e.target.value })}
                      placeholder="Where dreams rise through the silence."
                      className="w-full bg-[#0D101B] border border-[#242A3A] focus:border-[#C8FF00] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F7FC] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Hero Subtitle / Mission Statement
                    </label>
                    <textarea
                      rows={3}
                      value={contentForm.heroSubtitle}
                      onChange={(e) => setContentForm({ ...contentForm, heroSubtitle: e.target.value })}
                      placeholder="We're designing tools for deep thinkers..."
                      className="w-full bg-[#0D101B] border border-[#242A3A] focus:border-[#C8FF00] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F7FC] outline-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                        CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={contentForm.heroCtaText}
                        onChange={(e) => setContentForm({ ...contentForm, heroCtaText: e.target.value })}
                        placeholder="Start Journey"
                        className="w-full bg-[#0D101B] border border-[#242A3A] focus:border-[#C8FF00] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F7FC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                        CTA Destination Link
                      </label>
                      <input
                        type="text"
                        value={contentForm.heroCtaLink}
                        onChange={(e) => setContentForm({ ...contentForm, heroCtaLink: e.target.value })}
                        placeholder="/register"
                        className="w-full bg-[#0D101B] border border-[#242A3A] focus:border-[#C8FF00] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F7FC] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Announcement System */}
              <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#FFBF47]" />
                    <h3 className="text-sm font-bold text-[#F5F7FC]">Global Announcement Bar</h3>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={contentForm.announcementActive}
                      onChange={(e) => setContentForm({ ...contentForm, announcementActive: e.target.checked })}
                      className="sr-only"
                    />
                    <span className="text-[11px] text-[#A4AABC]">
                      {contentForm.announcementActive ? 'Enabled' : 'Disabled'}
                    </span>
                    {contentForm.announcementActive ? (
                      <ToggleRight className="w-6 h-6 text-[#C8FF00]" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-[#70788D]" />
                    )}
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Announcement Text / Update Alert
                    </label>
                    <input
                      type="text"
                      value={contentForm.announcementText}
                      onChange={(e) => setContentForm({ ...contentForm, announcementText: e.target.value })}
                      placeholder="🔥 New Release: Indian Macro & Calorie Tracker is now live!"
                      className="w-full bg-[#0D101B] border border-[#242A3A] focus:border-[#C8FF00] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F7FC] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#A4AABC] block mb-1">
                      Banner Tone / Color Style
                    </label>
                    <select
                      value={contentForm.announcementType}
                      onChange={(e) => setContentForm({ ...contentForm, announcementType: e.target.value })}
                      className="w-full bg-[#0D101B] border border-[#242A3A] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F7FC] outline-none cursor-pointer"
                    >
                      <option value="info">Info / Neutral (Cyan / Slate)</option>
                      <option value="promo">Special Promotion (Neon Lime)</option>
                      <option value="alert">System Notice / Warning (Amber)</option>
                    </select>
                  </div>

                  {contentForm.announcementActive && contentForm.announcementText && (
                    <div className="pt-2">
                      <p className="text-[11px] text-[#70788D] mb-1.5">Live Banner Preview:</p>
                      <div className="p-2.5 rounded-xl bg-[#C8FF00]/10 border border-[#C8FF00]/30 text-xs font-semibold text-[#C8FF00] text-center">
                        {contentForm.announcementText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Promotional Advertisements & Banners Manager */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#8B5CF6]" />
                  <h3 className="text-sm font-bold text-[#F5F7FC]">
                    Promotional Advertisements & Banners ({adsList.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewAdModal(true)}
                  className="py-1.5 px-3 rounded-xl bg-[#151A29] hover:bg-[#1D2332] text-xs font-semibold text-[#C8FF00] border border-[#C8FF00]/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Ad Card</span>
                </button>
              </div>

              {adsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#70788D] rounded-2xl bg-[#0D101B] border border-dashed border-[#242A3A]">
                  No promotional ad cards configured. Click "Create Ad Card" to add custom marketing banners to the website.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adsList.map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-[#0D101B] border border-[#242A3A] rounded-2xl overflow-hidden flex flex-col justify-between"
                    >
                      {ad.imageUrl && (
                        <div className="h-32 w-full overflow-hidden relative">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#080A12]/80 text-[#C8FF00] border border-[#C8FF00]/40 backdrop-blur-md">
                            {ad.badge || 'Ad'}
                          </span>
                        </div>
                      )}
                      <div className="p-4 space-y-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#F5F7FC]">{ad.title}</h4>
                          <button
                            onClick={() => handleToggleAdStatus(ad.id)}
                            className="text-xs"
                            title="Toggle Ad Active State"
                          >
                            {ad.active ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#39E58C]/20 text-[#39E58C] font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#70788D]/20 text-[#70788D] font-bold">
                                Paused
                              </span>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-[#A4AABC] leading-relaxed line-clamp-2">
                          {ad.description}
                        </p>
                      </div>
                      <div className="p-3 bg-[#111522] border-t border-[#1D2332] flex items-center justify-between text-xs">
                        <span className="text-[#70788D] text-[11px] truncate max-w-[150px]">
                          Target: {ad.ctaLink}
                        </span>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1.5 rounded-lg text-[#70788D] hover:text-[#FF5C67] hover:bg-[#FF5C67]/10 transition-colors"
                          title="Delete Ad Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#F5F7FC]">
                  Registered User Accounts ({usersTotal})
                </h2>
                <p className="text-xs text-[#70788D]">
                  Search, review active habit completions, promote to administrator, or delete accounts.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#70788D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    placeholder="Search name or email..."
                    className="w-full bg-[#111522] border border-[#242A3A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F7FC] outline-none"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-xs text-[#F5F7FC] outline-none cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">Standard Users</option>
                  <option value="ADMIN">Administrators</option>
                </select>
                <button
                  onClick={fetchUsers}
                  className="p-2 rounded-xl bg-[#151A29] border border-[#242A3A] text-[#A4AABC] hover:text-[#F5F7FC]"
                  title="Refresh Users"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D101B] border-b border-[#242A3A] text-[#70788D] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Habits</th>
                      <th className="p-4">Completions</th>
                      <th className="p-4">Food Logs</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D2332]">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#70788D]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#C8FF00] mx-auto mb-2" />
                          <span>Loading users directory...</span>
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#70788D]">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-[#151A29]/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1D2332] text-[#F5F7FC] flex items-center justify-center font-bold text-xs uppercase border border-[#242A3A]">
                                {u.name ? u.name.charAt(0) : 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-[#F5F7FC]">{u.name}</p>
                                <p className="text-[11px] text-[#70788D]">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/40">
                                <Shield className="w-3 h-3" />
                                ADMIN
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#242A3A] text-[#A4AABC]">
                                USER
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-[#F5F7FC] font-semibold">{u._count?.habits || 0}</td>
                          <td className="p-4 text-[#F5F7FC] font-semibold">{u._count?.completions || 0}</td>
                          <td className="p-4 text-[#F5F7FC] font-semibold">{u._count?.foodLogs || 0}</td>
                          <td className="p-4 text-[#70788D]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRoleToggle(u)}
                                className="px-2.5 py-1 rounded-lg bg-[#151A29] hover:bg-[#1D2332] text-[11px] font-semibold text-[#A4AABC] hover:text-[#F5F7FC] border border-[#242A3A] transition-colors"
                              >
                                {u.role === 'ADMIN' ? 'Demote to User' : 'Make Admin'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg bg-[#151A29] hover:bg-[#FF5C67]/20 text-[#70788D] hover:text-[#FF5C67] transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FOOD & NUTRITION CATALOGUE CMS */}
        {activeTab === 'foods' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#F5F7FC]">
                  Official Food & Calorie Catalogue ({foodsTotal})
                </h2>
                <p className="text-xs text-[#70788D]">
                  Manage Indian food database (ICMR-NIN IFCT), customize portion sizes, macros, and regional aliases.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#70788D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={foodSearch}
                    onChange={(e) => setFoodSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchFoods()}
                    placeholder="Search dishes or ingredients..."
                    className="w-full bg-[#111522] border border-[#242A3A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F5F7FC] outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingFood(null);
                    setFoodForm({
                      name: '',
                      regionalName: '',
                      category: 'Breakfast',
                      cuisine: 'Pan-Indian',
                      dietaryType: 'Veg',
                      servingUnit: '100g',
                      servingSizeGrams: 100,
                      calories: 150,
                      protein: 5,
                      carbs: 20,
                      fat: 5,
                      fiber: 2,
                      isVerified: true,
                    });
                    setFoodModalOpen(true);
                  }}
                  className="py-2 px-3 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(200,255,0,0.2)] whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Food</span>
                </button>
              </div>
            </div>

            {/* Foods Table */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D101B] border-b border-[#242A3A] text-[#70788D] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Dish / Food Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Portion</th>
                      <th className="p-4">Calories</th>
                      <th className="p-4">Protein</th>
                      <th className="p-4">Carbs</th>
                      <th className="p-4">Fat</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D2332]">
                    {foodsLoading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-[#70788D]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#C8FF00] mx-auto mb-2" />
                          <span>Searching catalogue...</span>
                        </td>
                      </tr>
                    ) : foodsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-[#70788D]">
                          No food items matched your query.
                        </td>
                      </tr>
                    ) : (
                      foodsList.map((f) => (
                        <tr key={f.id} className="hover:bg-[#151A29]/50 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-[#F5F7FC]">{f.name}</p>
                              {f.regionalName && (
                                <p className="text-[10px] text-[#70788D] line-clamp-1">{f.regionalName}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-[#A4AABC]">{f.category}</td>
                          <td className="p-4 text-[#A4AABC]">{f.servingUnit} ({f.servingSizeGrams}g)</td>
                          <td className="p-4 font-bold text-[#C8FF00]">{f.calories} kcal</td>
                          <td className="p-4 font-semibold text-[#8B5CF6]">{f.protein}g</td>
                          <td className="p-4 font-semibold text-[#25D9E6]">{f.carbs}g</td>
                          <td className="p-4 font-semibold text-[#FFBF47]">{f.fat}g</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingFood(f);
                                  setFoodForm({
                                    name: f.name,
                                    regionalName: f.regionalName || '',
                                    category: f.category,
                                    cuisine: f.cuisine || 'Pan-Indian',
                                    dietaryType: f.dietaryType || 'Veg',
                                    servingUnit: f.servingUnit,
                                    servingSizeGrams: f.servingSizeGrams,
                                    calories: f.calories,
                                    protein: f.protein,
                                    carbs: f.carbs,
                                    fat: f.fat,
                                    fiber: f.fiber || 0,
                                    isVerified: f.isVerified,
                                  });
                                  setFoodModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-[#151A29] hover:bg-[#1D2332] text-[#A4AABC] hover:text-[#F5F7FC] transition-colors"
                                title="Edit food details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteFood(f)}
                                className="p-1.5 rounded-lg bg-[#151A29] hover:bg-[#FF5C67]/20 text-[#70788D] hover:text-[#FF5C67] transition-colors"
                                title="Delete food"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PLATFORM TELEMETRY OVERVIEW */}
        {activeTab === 'telemetry' && overview && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#F5F7FC]">
                Platform Health & Live Counters
              </h2>
              <p className="text-xs text-[#70788D] mt-0.5">
                Real-time usage metrics across all HAbyTAT modules.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Total Users', value: overview.metrics?.totalUsers, color: '#C8FF00' },
                { label: 'Active Habits', value: overview.metrics?.totalHabits, color: '#8B5CF6' },
                { label: 'Habit Completions', value: overview.metrics?.totalCompletions, color: '#39E58C' },
                { label: 'Catalogue Foods', value: overview.metrics?.totalFoods, color: '#25D9E6' },
                { label: 'Workouts Logged', value: overview.metrics?.totalWorkouts, color: '#FFBF47' },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="bg-[#111522] border border-[#242A3A] rounded-2xl p-4 sm:p-5 text-center space-y-1.5"
                >
                  <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: card.color }}>
                    {card.value ?? '—'}
                  </p>
                  <p className="text-xs font-semibold text-[#A4AABC]">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Today's Momentum Card */}
            <div className="bg-[#111522] border border-[#242A3A] rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#F5F7FC]">Today's Activity Momentum</h3>
                <p className="text-xs text-[#70788D] mt-0.5">
                  Live user engagement logged today across all timezones.
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-lg font-bold text-[#C8FF00]">
                    {overview.metrics?.todayCompletions || 0}
                  </span>
                  <span className="text-xs text-[#A4AABC] block">Habits Checked</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-[#25D9E6]">
                    {overview.metrics?.todayFoodLogs || 0}
                  </span>
                  <span className="text-xs text-[#A4AABC] block">Meals Logged</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE AD CARD MODAL */}
      {newAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0D101B] border border-[#242A3A] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
              <h3 className="text-sm font-bold text-[#F5F7FC]">Create Promotional Ad Card</h3>
              <button onClick={() => setNewAdModal(false)} className="text-[#70788D] hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#A4AABC] block mb-1">Ad Title</label>
                <input
                  type="text"
                  value={adForm.title}
                  onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                  placeholder="HAbyTAT Pro Athlete Pass"
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-xs text-[#F5F7FC] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A4AABC] block mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={adForm.badge}
                  onChange={(e) => setAdForm({ ...adForm, badge: e.target.value })}
                  placeholder="Special Offer / New"
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-xs text-[#F5F7FC] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A4AABC] block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={adForm.description}
                  onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                  placeholder="Unlock 3D fitness telemetry, advanced macro analytics..."
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-xs text-[#F5F7FC] outline-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A4AABC] block mb-1">Banner Image URL</label>
                <input
                  type="text"
                  value={adForm.imageUrl}
                  onChange={(e) => setAdForm({ ...adForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-xs text-[#F5F7FC] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1">Button Text</label>
                  <input
                    type="text"
                    value={adForm.ctaText}
                    onChange={(e) => setAdForm({ ...adForm, ctaText: e.target.value })}
                    placeholder="Claim Offer"
                    className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-xs text-[#F5F7FC] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#A4AABC] block mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={adForm.ctaLink}
                    onChange={(e) => setAdForm({ ...adForm, ctaLink: e.target.value })}
                    placeholder="/register"
                    className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-xs text-[#F5F7FC] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewAdModal(false)}
                className="py-2 px-4 rounded-xl bg-[#151A29] text-xs font-semibold text-[#A4AABC] hover:text-[#F5F7FC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAd}
                className="py-2 px-4 rounded-xl bg-[#C8FF00] text-xs font-bold text-[#080A12] hover:bg-[#B4E600]"
              >
                Add Ad Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FOOD MODAL */}
      {foodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form
            onSubmit={handleSaveFood}
            className="bg-[#0D101B] border border-[#242A3A] rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
              <h3 className="text-sm font-bold text-[#F5F7FC]">
                {editingFood ? `Edit "${editingFood.name}"` : 'Add Official Food Item'}
              </h3>
              <button
                type="button"
                onClick={() => setFoodModalOpen(false)}
                className="text-[#70788D] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="font-semibold text-[#A4AABC] block mb-1">Food / Dish Name</label>
                <input
                  type="text"
                  required
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  placeholder="Paneer Butter Masala"
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-[#F5F7FC] outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-[#A4AABC] block mb-1">Regional Names (Hindi / Telugu / Tamil)</label>
                <input
                  type="text"
                  value={foodForm.regionalName}
                  onChange={(e) => setFoodForm({ ...foodForm, regionalName: e.target.value })}
                  placeholder="Hindi: Paneer Makhani"
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-[#F5F7FC] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#A4AABC] block mb-1">Category</label>
                <select
                  value={foodForm.category}
                  onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-[#F5F7FC] outline-none"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Breads">Breads</option>
                  <option value="Rice & Grains">Rice & Grains</option>
                  <option value="Dal & Curries">Dal & Curries</option>
                  <option value="Protein & Meat">Protein & Meat</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Snacks & Street Food">Snacks & Street Food</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Sweets & Desserts">Sweets & Desserts</option>
                  <option value="Staples & Ingredients">Staples & Ingredients</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#A4AABC] block mb-1">Serving Unit</label>
                <input
                  type="text"
                  value={foodForm.servingUnit}
                  onChange={(e) => setFoodForm({ ...foodForm, servingUnit: e.target.value })}
                  placeholder="100g, 1 katori (150g)"
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-[#F5F7FC] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#A4AABC] block mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  required
                  value={foodForm.calories}
                  onChange={(e) => setFoodForm({ ...foodForm, calories: Number(e.target.value) })}
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-[#F5F7FC] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#A4AABC] block mb-1">Protein (g)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={foodForm.protein}
                  onChange={(e) => setFoodForm({ ...foodForm, protein: Number(e.target.value) })}
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-[#F5F7FC] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#A4AABC] block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={foodForm.carbs}
                  onChange={(e) => setFoodForm({ ...foodForm, carbs: Number(e.target.value) })}
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-[#F5F7FC] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#A4AABC] block mb-1">Fat (g)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={foodForm.fat}
                  onChange={(e) => setFoodForm({ ...foodForm, fat: Number(e.target.value) })}
                  className="w-full bg-[#111522] border border-[#242A3A] rounded-xl px-3 py-2 text-[#F5F7FC] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1D2332]">
              <button
                type="button"
                onClick={() => setFoodModalOpen(false)}
                className="py-2 px-4 rounded-xl bg-[#151A29] text-xs font-semibold text-[#A4AABC] hover:text-[#F5F7FC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-[#C8FF00] text-xs font-bold text-[#080A12] hover:bg-[#B4E600]"
              >
                {editingFood ? 'Save Modifications' : 'Add to Catalogue'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
