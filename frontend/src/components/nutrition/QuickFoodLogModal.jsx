import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Flame,
  CheckCircle2,
  Sliders,
  Sparkles,
  Star,
  Clock,
  BookOpen,
  Filter,
  Check,
  Utensils,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { nutritionService } from '../../services/nutrition.service';
import confetti from 'canvas-confetti';

const POPULAR_STAPLES = [
  { name: 'Whole Wheat Roti / Chapati', servingUnit: 'piece (35g)', servingSizeGrams: 35, calories: 85, protein: 3.1, carbs: 15.5, fat: 0.8, dietaryType: 'Veg', category: 'Breads' },
  { name: 'Cooked Basmati White Rice', servingUnit: 'katori / bowl (150g)', servingSizeGrams: 150, calories: 195, protein: 4.1, carbs: 43.5, fat: 0.5, dietaryType: 'Veg', category: 'Rice & Grains' },
  { name: 'Yellow Moong / Toor Dal', servingUnit: 'bowl (150g)', servingSizeGrams: 150, calories: 155, protein: 9.2, carbs: 22.0, fat: 3.5, dietaryType: 'Veg', category: 'Dal & Curries' },
  { name: 'Fresh Paneer (Cottage Cheese)', servingUnit: 'portion (100g)', servingSizeGrams: 100, calories: 265, protein: 18.3, carbs: 4.2, fat: 20.8, dietaryType: 'Veg', category: 'Protein & Meat' },
  { name: 'Hard Boiled Whole Eggs (2x)', servingUnit: '2 large eggs (100g)', servingSizeGrams: 100, calories: 155, protein: 12.6, carbs: 1.1, fat: 10.6, dietaryType: 'Egg', category: 'Protein & Meat' },
  { name: 'Grilled Chicken Breast', servingUnit: 'fillet (150g)', servingSizeGrams: 150, calories: 245, protein: 46.5, carbs: 0, fat: 5.2, dietaryType: 'Non-Veg', category: 'Protein & Meat' },
  { name: 'Whey Protein Isolate', servingUnit: '1 scoop (32g)', servingSizeGrams: 32, calories: 125, protein: 25.0, carbs: 2.0, fat: 1.0, dietaryType: 'Veg', category: 'Beverages' },
  { name: 'Rolled Oats Porridge', servingUnit: 'bowl (50g raw)', servingSizeGrams: 50, calories: 190, protein: 6.8, carbs: 32.0, fat: 3.2, dietaryType: 'Vegan', category: 'Breakfast' },
  { name: 'Greek Yogurt / Thick Curd', servingUnit: 'cup (150g)', servingSizeGrams: 150, calories: 105, protein: 11.5, carbs: 6.0, fat: 3.8, dietaryType: 'Veg', category: 'Dairy' },
  { name: 'Ripe Banana', servingUnit: '1 medium (118g)', servingSizeGrams: 118, calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3, dietaryType: 'Vegan', category: 'Fruits' },
];

const DIETARY_FILTERS = ['All', 'Veg', 'Non-Veg', 'Egg', 'Vegan'];

export default function QuickFoodLogModal({
  isOpen,
  onClose,
  targetMeal = 'Breakfast',
  selectedDate,
  onFoodLogged,
}) {
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'search' | 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('All');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Selected item to configure portion
  const [activeFood, setActiveFood] = useState(null);
  const [servingQuantity, setServingQuantity] = useState(1);
  const [servingGrams, setServingGrams] = useState(100);
  const [notes, setNotes] = useState('');

  // Staging tray (for multi-item batch logging)
  const [stagedTray, setStagedTray] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Custom Food state
  const [customForm, setCustomForm] = useState({
    name: '',
    calories: 180,
    protein: 10,
    carbs: 25,
    fat: 5,
    servingUnit: 'portion (100g)',
    servingSizeGrams: 100,
    dietaryType: 'Veg',
  });

  // Search effect
  useEffect(() => {
    if (!isOpen || activeTab !== 'search') return;
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const data = await nutritionService.searchFoods({
          query: searchQuery,
          dietaryType: dietaryFilter === 'All' ? undefined : dietaryFilter,
          limit: 30,
        });
        setSearchResults(data?.foods || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, dietaryFilter, activeTab]);

  if (!isOpen) return null;

  const handleSelectFood = (food) => {
    setActiveFood(food);
    const defServing = food.servings?.find((s) => s.isDefault) || food.servings?.[0];
    const grams = defServing ? defServing.gramWeight : food.servingSizeGrams || 100;
    setServingGrams(grams);
    setServingQuantity(1);
    setNotes('');
  };

  // Recalculated macros based on quantity/grams
  const baseGrams = activeFood?.servingSizeGrams || 100;
  const currentTotalGrams = servingGrams * servingQuantity;
  const ratio = currentTotalGrams / (baseGrams || 100);

  const liveCalories = Math.round((activeFood?.calories || 0) * ratio);
  const liveProtein = Math.round((activeFood?.protein || 0) * ratio * 10) / 10;
  const liveCarbs = Math.round((activeFood?.carbs || 0) * ratio * 10) / 10;
  const liveFat = Math.round((activeFood?.fat || 0) * ratio * 10) / 10;

  // Add active food to staging tray
  const handleStageActive = () => {
    if (!activeFood) return;
    const item = {
      id: `${activeFood.id || activeFood.name}_${Date.now()}`,
      foodItemId: activeFood.id,
      foodName: activeFood.name,
      mealType: targetMeal,
      logDate: selectedDate,
      servingQuantity,
      servingUnit: activeFood.servingUnit || 'portion',
      servingGramWeight: servingGrams,
      totalGrams: currentTotalGrams,
      calories: liveCalories,
      protein: liveProtein,
      carbs: liveCarbs,
      fat: liveFat,
      dietaryType: activeFood.dietaryType,
      notes,
    };
    setStagedTray((prev) => [...prev, item]);
    setActiveFood(null);
  };

  // Immediate log single item
  const handleLogSingleDirectly = async (food) => {
    try {
      setSubmitting(true);
      const ratio = 1;
      await nutritionService.logFood({
        foodItemId: food.id,
        foodName: food.name,
        mealType: targetMeal,
        logDate: selectedDate,
        servingQuantity: 1,
        servingUnit: food.servingUnit || 'portion',
        servingGramWeight: food.servingSizeGrams || 100,
      });

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      if (onFoodLogged) onFoodLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log food:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit all staged items
  const handleSubmitBatch = async () => {
    if (!stagedTray.length && !activeFood) return;
    try {
      setSubmitting(true);
      const allItems = [...stagedTray];
      if (activeFood) {
        allItems.push({
          foodItemId: activeFood.id,
          foodName: activeFood.name,
          mealType: targetMeal,
          logDate: selectedDate,
          servingQuantity,
          servingUnit: activeFood.servingUnit || 'portion',
          servingGramWeight: servingGrams,
          notes,
        });
      }

      await nutritionService.logMultipleFoods({
        mealType: targetMeal,
        logDate: selectedDate,
        items: allItems,
      });

      confetti({ particleCount: 65, spread: 80, origin: { y: 0.7 } });
      setStagedTray([]);
      setActiveFood(null);
      if (onFoodLogged) onFoodLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log staged items:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Create custom food and log
  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customForm.name.trim()) return;
    try {
      setSubmitting(true);
      const newFood = await nutritionService.createCustomFood(customForm);
      await nutritionService.logFood({
        foodItemId: newFood?.id,
        foodName: customForm.name,
        mealType: targetMeal,
        logDate: selectedDate,
        servingQuantity: 1,
        servingUnit: customForm.servingUnit,
        servingGramWeight: customForm.servingSizeGrams,
      });

      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
      if (onFoodLogged) onFoodLogged();
      onClose();
    } catch (err) {
      console.error('Failed to create custom food:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-[28px] overflow-hidden shadow-2xl space-y-4 border max-h-[92vh] flex flex-col transition-all ${
          isDark
            ? 'bg-[#111522] border-[#242A3A] text-[#F5F7FC]'
            : 'bg-white border-[#E2E8F0] text-[#0F172A]'
        }`}
      >
        {/* Top Header */}
        <div className={`p-5 pb-3 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#1D2332]' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30 flex items-center justify-center shadow-md">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Log to {targetMeal}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/30">
                  {selectedDate}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                Pick quick fitness staples, search the catalogue, or customize portions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#151A29] border-[#242A3A] text-[#70788D] hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 flex items-center justify-between gap-2 shrink-0">
          <div className={`flex items-center p-1 rounded-2xl border ${
            isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-100 border-[#E2E8F0]'
          }`}>
            <button
              type="button"
              onClick={() => { setActiveTab('popular'); setActiveFood(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'popular'
                  ? 'bg-[#C8FF00] text-[#080A12] shadow-sm font-black'
                  : isDark ? 'text-[#70788D] hover:text-[#F5F7FC]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Popular Staples
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('search'); setActiveFood(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-[#C8FF00] text-[#080A12] shadow-sm font-black'
                  : isDark ? 'text-[#70788D] hover:text-[#F5F7FC]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Food Database
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('custom'); setActiveFood(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[#C8FF00] text-[#080A12] shadow-sm font-black'
                  : isDark ? 'text-[#70788D] hover:text-[#F5F7FC]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Food
            </button>
          </div>

          {stagedTray.length > 0 && (
            <span className="text-xs font-black text-[#C8FF00] px-2.5 py-1 rounded-xl bg-[#C8FF00]/15 border border-[#C8FF00]/30 animate-pulse">
              {stagedTray.length} Staged in Tray
            </span>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="px-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Popular Staples */}
          {activeTab === 'popular' && (
            <div className="space-y-3">
              <p className={`text-xs font-semibold ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                1-Tap Quick Staples (Click to configure portion, or click '+' to log standard serving directly):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {POPULAR_STAPLES.map((food, idx) => {
                  const isSelected = activeFood?.name === food.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectFood(food)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                        isSelected
                          ? isDark
                            ? 'bg-[#151A29] border-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.2)]'
                            : 'bg-emerald-50 border-emerald-500 shadow-sm'
                          : isDark
                          ? 'bg-[#0D101B] border-[#1D2332] hover:border-[#242A3A] hover:bg-[#151A29]/70'
                          : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-bold truncate ${
                            isSelected
                              ? isDark ? 'text-[#F5F7FC]' : 'text-emerald-900 font-black'
                              : isDark ? 'text-[#F5F7FC]' : 'text-slate-900'
                          }`}>
                            {food.name}
                          </p>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                            food.dietaryType === 'Veg' ? 'bg-emerald-500/15 text-emerald-400' :
                            food.dietaryType === 'Non-Veg' ? 'bg-rose-500/15 text-rose-400' :
                            food.dietaryType === 'Egg' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-teal-500/15 text-teal-400'
                          }`}>
                            {food.dietaryType}
                          </span>
                        </div>
                        <p className={`text-[10px] mt-0.5 ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                          {food.servingUnit} • <span className="text-[#C8FF00] font-bold">{food.calories} kcal</span> • {food.protein}g P • {food.carbs}g C • {food.fat}g F
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogSingleDirectly(food);
                        }}
                        className="w-7 h-7 rounded-xl bg-[#C8FF00] hover:bg-[#b8eb00] text-[#080A12] flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
                        title="Log 1 serving immediately"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Search Database */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              {/* Search input + Dietary pills */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70788D]" />
                  <input
                    type="text"
                    placeholder="Search by food name, Hindi/regional name (e.g. Biryani, Dosa, Paneer, Egg)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs font-semibold border transition-colors outline-none ${
                      isDark
                        ? 'bg-[#0D101B] border-[#1D2332] text-[#F5F7FC] placeholder-[#70788D] focus:border-[#C8FF00]'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {DIETARY_FILTERS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDietaryFilter(d)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        dietaryFilter === d
                          ? 'bg-[#C8FF00] text-[#080A12] font-black'
                          : isDark
                          ? 'bg-[#0D101B] text-[#70788D] hover:text-[#F5F7FC] border border-[#1D2332]'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {loadingSearch ? (
                  <p className="text-center text-xs text-[#70788D] py-6">Searching food library...</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-center text-xs text-[#70788D] py-6">
                    {searchQuery ? 'No foods found. Try a different query or create a custom food.' : 'Type a food name above to search.'}
                  </p>
                ) : (
                  searchResults.map((food) => (
                    <div
                      key={food.id}
                      onClick={() => handleSelectFood(food)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        activeFood?.id === food.id
                          ? isDark
                            ? 'bg-[#151A29] border-[#C8FF00]'
                            : 'bg-emerald-50 border-emerald-500'
                          : isDark
                          ? 'bg-[#0D101B] border-[#1D2332] hover:border-[#242A3A]'
                          : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-bold truncate ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>
                            {food.name}
                          </p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#39E58C]/15 text-[#39E58C]">
                            {food.dietaryType}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#70788D] mt-0.5">
                          {food.calories} kcal • {food.protein}g P • {food.carbs}g C • {food.fat}g F (per {food.servingSizeGrams || 100}g)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogSingleDirectly(food);
                        }}
                        className="w-7 h-7 rounded-xl bg-[#C8FF00] hover:bg-[#b8eb00] text-[#080A12] flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
                        title="Log 1 serving immediately"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Custom Food */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCreateCustom} className="space-y-3">
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>Food Name</label>
                <input
                  type="text"
                  placeholder="e.g. Grandma's Special Besan Ladoo"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${
                    isDark ? 'bg-[#0D101B] border-[#1D2332] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#FFBF47]">Calories (kcal)</label>
                  <input
                    type="number"
                    value={customForm.calories}
                    onChange={(e) => setCustomForm({ ...customForm, calories: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-2 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-[#0D101B] border-[#1D2332] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#39E58C]">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customForm.protein}
                    onChange={(e) => setCustomForm({ ...customForm, protein: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-2 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-[#0D101B] border-[#1D2332] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#FFBF47]">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customForm.carbs}
                    onChange={(e) => setCustomForm({ ...customForm, carbs: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-2 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-[#0D101B] border-[#1D2332] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#FF5C67]">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customForm.fat}
                    onChange={(e) => setCustomForm({ ...customForm, fat: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-2 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                      isDark ? 'bg-[#0D101B] border-[#1D2332] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#b8eb00] text-[#080A12] text-xs font-black shadow-md transition-all cursor-pointer"
              >
                Save & Log Custom Food
              </button>
            </form>
          )}

          {/* ACTIVE FOOD PORTION SLIDER & LIVE MACRO DISPLAY */}
          {activeFood && (
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#151A29] border-[#C8FF00]/40' : 'bg-emerald-50/70 border-emerald-300'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-black ${isDark ? 'text-[#F5F7FC]' : 'text-emerald-950'}`}>
                    Configure Portion: {activeFood.name}
                  </h4>
                  <p className="text-[10px] text-[#70788D]">Adjust servings or exact gram weight</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFood(null)}
                  className="text-xs text-[#70788D] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Serving Slider & Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={isDark ? 'text-[#A4AABC]' : 'text-slate-600'}>Portion Weight:</span>
                  <span className="text-[#C8FF00] font-black">{currentTotalGrams} grams</span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="500"
                  step="5"
                  value={servingGrams}
                  onChange={(e) => setServingGrams(parseFloat(e.target.value))}
                  className="w-full accent-[#C8FF00] cursor-pointer"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#70788D]">Serving Multiplier:</span>
                  {[0.5, 1, 1.5, 2].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setServingQuantity(m)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                        servingQuantity === m
                          ? 'bg-[#C8FF00] text-[#080A12] font-black'
                          : isDark
                          ? 'bg-[#0D101B] border-[#1D2332] text-[#A4AABC]'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Macros calculated */}
              <div className="grid grid-cols-4 gap-2 text-center p-2 rounded-xl bg-black/20">
                <div>
                  <p className="text-[9px] uppercase font-bold text-[#FFBF47]">Calories</p>
                  <p className="text-sm font-black text-[#F5F7FC]">{liveCalories} kcal</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-[#39E58C]">Protein</p>
                  <p className="text-sm font-black text-[#39E58C]">{liveProtein}g</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-[#FFBF47]">Carbs</p>
                  <p className="text-sm font-black text-[#FFBF47]">{liveCarbs}g</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-[#FF5C67]">Fat</p>
                  <p className="text-sm font-black text-[#FF5C67]">{liveFat}g</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleStageActive}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isDark ? 'bg-[#0D101B] border-[#1D2332] text-[#C8FF00]' : 'bg-white border-slate-200 text-emerald-700'
                  }`}
                >
                  + Add to Tray
                </button>
                <button
                  type="button"
                  onClick={handleSubmitBatch}
                  className="px-4 py-1.5 rounded-xl bg-[#C8FF00] text-[#080A12] text-xs font-black shadow-md cursor-pointer hover:brightness-110"
                >
                  Log Now ({liveCalories} kcal)
                </button>
              </div>
            </div>
          )}

          {/* Staged Items Tray Preview */}
          {stagedTray.length > 0 && (
            <div className={`p-3 rounded-2xl border space-y-2 ${
              isDark ? 'bg-[#0D101B] border-[#1D2332]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#A4AABC]">
                  Staged Tray ({stagedTray.length} items ready to log)
                </span>
                <span className="text-xs font-black text-[#C8FF00]">
                  Total: {stagedTray.reduce((sum, item) => sum + item.calories, 0)} kcal
                </span>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {stagedTray.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-black/10">
                    <span className="font-bold truncate">{item.foodName} ({item.totalGrams}g)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#C8FF00] font-black">{item.calories} kcal</span>
                      <button
                        type="button"
                        onClick={() => setStagedTray((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-[#70788D] hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'border-[#1D2332]' : 'border-slate-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDark ? 'bg-[#151A29] text-[#70788D] hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancel
          </button>

          {stagedTray.length > 0 && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitBatch}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#C8FF00] to-[#39E58C] text-[#080A12] text-xs font-black shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-[#080A12]" />
              <span>Log All {stagedTray.length} Staged Items</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
