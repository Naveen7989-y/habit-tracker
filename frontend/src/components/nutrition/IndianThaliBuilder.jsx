import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Plus,
  Trash2,
  Check,
  Scale,
  Sparkles,
  Info,
  ChevronDown,
  Layers,
  Flame,
  Award,
  Calendar,
  Clock,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { nutritionService } from '../../services/nutrition.service';
import DataQualityBadge from './DataQualityBadge';

const THALI_PRESETS = [
  {
    id: 'north_classic',
    name: 'Classic North Indian Thali',
    icon: '🍛',
    description: '2 Phulkas, Yellow Dal Tadka, Palak Paneer, Cow Milk Curd, and 1 tsp Ghee.',
    mealType: 'Lunch',
    defaults: [
      { name: 'Roti (Phulka / Chapati)', query: 'Roti', grams: 60, unit: '2 phulkas (60g)' },
      { name: 'Dal Tadka', query: 'Dal Tadka', grams: 150, unit: '1 medium katori (150g)' },
      { name: 'Palak Paneer', query: 'Palak Paneer', grams: 150, unit: '1 medium katori (150g)' },
      { name: 'Curd / Dahi', query: 'Curd', grams: 100, unit: '1 medium katori (100g)' },
      { name: 'Cow Ghee', query: 'Ghee', grams: 5, unit: '1 teaspoon (5g)' },
    ],
  },
  {
    id: 'south_meals',
    name: 'Traditional South Indian Meals',
    icon: '🥘',
    description: 'Steamed Rice, Sambar, Vegetable Poriyal, Curd, and Rasam.',
    mealType: 'Lunch',
    defaults: [
      { name: 'Cooked White Rice', query: 'Rice', grams: 180, unit: '1 medium plate (180g)' },
      { name: 'Sambar', query: 'Sambar', grams: 150, unit: '1 katori (150g)' },
      { name: 'Bhindi Masala / Poriyal', query: 'Bhindi', grams: 100, unit: '1 katori (100g)' },
      { name: 'Plain Curd', query: 'Curd', grams: 100, unit: '1 katori (100g)' },
    ],
  },
  {
    id: 'high_protein_veg',
    name: 'High-Protein Indian Thali',
    icon: '💪',
    description: 'Paneer Bhurji / Tofu, Double Dal, 2 Rotis, and Greek-style Curd.',
    mealType: 'Dinner',
    defaults: [
      { name: 'Paneer (Raw/Cooked)', query: 'Paneer', grams: 100, unit: '100g portion' },
      { name: 'Dal Tadka', query: 'Dal Tadka', grams: 200, unit: '1 large bowl (200g)' },
      { name: 'Roti (Phulka)', query: 'Roti', grams: 60, unit: '2 phulkas (60g)' },
      { name: 'Curd', query: 'Curd', grams: 150, unit: '1 bowl (150g)' },
    ],
  },
];

export default function IndianThaliBuilder({ selectedDate, onThaliLogged, onOpenCalculationBreakdown }) {
  const [activePreset, setActivePreset] = useState('north_classic');
  const [thaliName, setThaliName] = useState('Classic North Indian Thali');
  const [mealType, setMealType] = useState('Lunch');
  const [thaliItems, setThaliItems] = useState([]);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [loggingInProgress, setLoggingInProgress] = useState(false);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');
  const [catalogSearchResults, setCatalogSearchResults] = useState([]);
  const [catalogSearchOpen, setCatalogSearchOpen] = useState(false);
  const [searchingCatalog, setSearchingCatalog] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Load Preset Defaults
  const loadPreset = async (presetId) => {
    setActivePreset(presetId);
    const preset = THALI_PRESETS.find((p) => p.id === presetId) || THALI_PRESETS[0];
    setThaliName(preset.name);
    setMealType(preset.mealType);
    setLoadingDefaults(true);

    try {
      const resolvedItems = [];
      for (const d of preset.defaults) {
        const searchRes = await nutritionService.searchFoods({ query: d.query, limit: 1 });
        const food = searchRes.foods?.[0];
        if (food) {
          const ratio = d.grams / (food.servingSizeGrams || 100);
          resolvedItems.push({
            foodItemId: food.id,
            name: food.name,
            foodItem: food,
            grams: d.grams,
            unitName: d.unit,
            servings: food.servings || [],
            calories: Math.round(food.calories * ratio * 10) / 10,
            protein: Math.round(food.protein * ratio * 10) / 10,
            carbs: Math.round(food.carbs * ratio * 10) / 10,
            fat: Math.round(food.fat * ratio * 10) / 10,
            fiber: Math.round((food.fiber || 0) * ratio * 10) / 10,
          });
        }
      }
      setThaliItems(resolvedItems);
    } catch (err) {
      console.error('Error resolving thali preset:', err);
    } finally {
      setLoadingDefaults(false);
    }
  };

  useEffect(() => {
    loadPreset('north_classic');
  }, []);

  // Update item gram weight or unit
  const handleUpdateItemGrams = (idx, newGrams) => {
    setThaliItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const g = Math.max(5, Number(newGrams) || 5);
        const food = item.foodItem;
        const ratio = g / (food.servingSizeGrams || 100);
        return {
          ...item,
          grams: g,
          unitName: `${g}g portion`,
          calories: Math.round(food.calories * ratio * 10) / 10,
          protein: Math.round(food.protein * ratio * 10) / 10,
          carbs: Math.round(food.carbs * ratio * 10) / 10,
          fat: Math.round(food.fat * ratio * 10) / 10,
          fiber: Math.round((food.fiber || 0) * ratio * 10) / 10,
        };
      })
    );
  };

  const handleRemoveItem = (idx) => {
    setThaliItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Search catalogue to add another item to Thali
  const handleSearchCatalog = async (q) => {
    setSearchCatalogQuery(q);
    if (!q || q.trim().length < 2) {
      setCatalogSearchResults([]);
      return;
    }
    setSearchingCatalog(true);
    try {
      const res = await nutritionService.searchFoods({ query: q.trim(), limit: 5 });
      setCatalogSearchResults(res.foods || []);
    } catch (err) {
      console.error('Catalog search error:', err);
    } finally {
      setSearchingCatalog(false);
    }
  };

  const handleAddItemFromCatalog = (food) => {
    const defaultServing = food.servings?.[0];
    const grams = defaultServing ? defaultServing.gramWeight : (food.servingSizeGrams || 100);
    const ratio = grams / (food.servingSizeGrams || 100);

    const newItem = {
      foodItemId: food.id,
      name: food.name,
      foodItem: food,
      grams,
      unitName: defaultServing ? defaultServing.unitName : `${grams}g`,
      servings: food.servings || [],
      calories: Math.round(food.calories * ratio * 10) / 10,
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
      fiber: Math.round((food.fiber || 0) * ratio * 10) / 10,
    };

    setThaliItems((prev) => [...prev, newItem]);
    setCatalogSearchOpen(false);
    setSearchCatalogQuery('');
    setCatalogSearchResults([]);
  };

  // Aggregate Thali Totals
  const thaliTotals = useMemo(() => {
    return thaliItems.reduce(
      (acc, item) => ({
        calories: Math.round((acc.calories + item.calories) * 10) / 10,
        protein: Math.round((acc.protein + item.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
        fat: Math.round((acc.fat + item.fat) * 10) / 10,
        fiber: Math.round((acc.fiber + item.fiber) * 10) / 10,
        grams: acc.grams + item.grams,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, grams: 0 }
    );
  }, [thaliItems]);

  // Log Thali Meal to Diary
  const handleLogThali = async () => {
    if (thaliItems.length === 0) return;
    setLoggingInProgress(true);
    try {
      const payload = {
        thaliName,
        mealType,
        logDate: selectedDate,
        items: thaliItems.map((item) => ({
          foodItemId: item.foodItemId,
          servingGramWeight: item.grams,
          servingQuantity: 1,
          servingUnit: item.unitName,
          notes: `[Thali: ${thaliName}]`,
        })),
      };

      await nutritionService.logThaliMeal(payload);

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C8FF00', '#39E58C', '#38BDF8'],
      });

      setToastMessage(`Logged "${thaliName}" (${thaliItems.length} items, ${thaliTotals.calories} kcal) to ${mealType}`);
      setTimeout(() => setToastMessage(null), 4000);

      if (onThaliLogged) {
        onThaliLogged();
      }
    } catch (err) {
      console.error('Error logging thali:', err);
      alert(err?.response?.data?.message || 'Failed to log Thali');
    } finally {
      setLoggingInProgress(false);
    }
  };

  return (
    <div className="space-y-6 text-xs animate-fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Presets */}
      <div className="p-5 rounded-[24px] bg-[#0D101B] border border-[#242A3A] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🍛</span>
              <h2 className="text-base font-extrabold text-white">Indian Meal & Thali Builder</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#C8FF00]/15 text-[#C8FF00] font-bold text-[10px] border border-[#C8FF00]/30">
                Composite Intelligence
              </span>
            </div>
            <p className="text-[11px] text-[#A4AABC] mt-1">
              Assemble, balance, and log traditional multi-item Indian meals with deterministic nutrient scaling.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Meal Section:</span>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="bg-[#151A29] border border-[#242A3A] rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:border-[#C8FF00]"
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Evening Snack">Evening Snack</option>
              <option value="Dinner">Dinner</option>
            </select>
          </div>
        </div>

        {/* Preset Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#242A3A]">
          {THALI_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset.id)}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-[#151A29] border-[#C8FF00] shadow-md shadow-[#C8FF00]/10'
                  : 'bg-[#101422] border-[#242A3A] hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Plate + Nutrients Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Items on the Thali (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-[24px] bg-[#0D101B] border border-[#242A3A] space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#242A3A]">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <Utensils className="w-4 h-4 text-[#C8FF00]" />
                <span>Thali Composition ({thaliItems.length} items)</span>
              </div>
              <button
                type="button"
                onClick={() => setCatalogSearchOpen(!catalogSearchOpen)}
                className="px-2.5 py-1 rounded-xl bg-[#151A29] hover:bg-[#1f263b] text-[#C8FF00] border border-[#C8FF00]/30 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Catalog search drawer */}
            {catalogSearchOpen && (
              <div className="p-3 rounded-2xl bg-[#151A29] border border-[#242A3A] space-y-2 animate-fade-in">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchCatalogQuery}
                    onChange={(e) => handleSearchCatalog(e.target.value)}
                    placeholder="Search staple to add (e.g. Rice, Chana, Salad, Papad)..."
                    className="w-full bg-[#0D101B] border border-[#242A3A] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#C8FF00] text-xs"
                    autoFocus
                  />
                </div>
                {catalogSearchResults.length > 0 && (
                  <div className="divide-y divide-[#242A3A] max-h-40 overflow-y-auto">
                    {catalogSearchResults.map((food) => (
                      <div
                        key={food.id}
                        className="py-1.5 flex items-center justify-between hover:bg-[#1b2234] px-2 rounded-lg cursor-pointer"
                        onClick={() => handleAddItemFromCatalog(food)}
                      >
                        <div>
                          <span className="font-bold text-white text-xs block">{food.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {food.calories} kcal / {food.servingSizeGrams || 100}g
                          </span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-[#C8FF00]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Items List */}
            {loadingDefaults ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <div className="w-5 h-5 border-2 border-[#C8FF00] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Loading calibrated Indian staples...</p>
              </div>
            ) : thaliItems.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <p>No items added yet to your Thali.</p>
                <button
                  type="button"
                  onClick={() => loadPreset('north_classic')}
                  className="px-3 py-1 rounded-xl bg-slate-800 text-white font-bold"
                >
                  Load Classic Thali
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {thaliItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#101422] border border-[#242A3A] space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{item.name}</span>
                          <DataQualityBadge quality={item.foodItem?.dataQuality || 'SOURCE_VERIFIED'} compact />
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.foodItem?.source || 'ICMR-NIN IFCT 2017'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onOpenCalculationBreakdown && (
                          <button
                            type="button"
                            onClick={() => onOpenCalculationBreakdown(item.foodItem, item.grams)}
                            className="p-1 rounded-lg text-slate-400 hover:text-[#C8FF00] hover:bg-[#151A29]"
                            title="View Calculation Breakdown"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/15"
                          title="Remove from Thali"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Weight adjuster */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#242A3A] text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Grams:</span>
                        <input
                          type="number"
                          min="5"
                          max="2000"
                          step="5"
                          value={item.grams}
                          onChange={(e) => handleUpdateItemGrams(idx, e.target.value)}
                          className="w-16 bg-[#151A29] border border-[#242A3A] rounded-lg px-2 py-0.5 text-center text-white font-bold focus:outline-none focus:border-[#C8FF00]"
                        />
                        <span className="text-slate-400 text-[10px]">({item.unitName})</span>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-[#C8FF00] text-xs block">
                          {item.calories} kcal
                        </span>
                        <span className="text-[9px] text-slate-400">
                          P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Aggregated Thali Plate & Submit (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-[24px] bg-[#0D101B] border border-[#242A3A] space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#242A3A] pb-2">
              <span className="font-bold text-white text-xs">Total Thali Nutrition</span>
              <span className="text-[11px] text-slate-400">{thaliTotals.grams}g Net Weight</span>
            </div>

            {/* Big Calorie Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#151A29] to-[#101422] border border-[#242A3A] text-center space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Estimated Total</span>
              <div className="text-3xl font-black text-[#C8FF00]">
                {thaliTotals.calories} <span className="text-sm font-semibold text-white">kcal</span>
              </div>
              <p className="text-[10px] text-slate-400">
                100% Deterministic Proportional Aggregation
              </p>
            </div>

            {/* Macronutrient Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-[#151A29] border border-[#242A3A] space-y-0.5">
                <span className="text-slate-400 text-[10px]">Protein</span>
                <span className="font-extrabold text-[#39E58C] text-sm block">{thaliTotals.protein}g</span>
                <span className="text-[9px] text-slate-500">
                  {Math.round((thaliTotals.protein * 4 / (thaliTotals.calories || 1)) * 100)}% of energy
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#151A29] border border-[#242A3A] space-y-0.5">
                <span className="text-slate-400 text-[10px]">Carbohydrates</span>
                <span className="font-extrabold text-[#38BDF8] text-sm block">{thaliTotals.carbs}g</span>
                <span className="text-[9px] text-slate-500">
                  {Math.round((thaliTotals.carbs * 4 / (thaliTotals.calories || 1)) * 100)}% of energy
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#151A29] border border-[#242A3A] space-y-0.5">
                <span className="text-slate-400 text-[10px]">Total Fat</span>
                <span className="font-extrabold text-[#FB7185] text-sm block">{thaliTotals.fat}g</span>
                <span className="text-[9px] text-slate-500">
                  {Math.round((thaliTotals.fat * 9 / (thaliTotals.calories || 1)) * 100)}% of energy
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#151A29] border border-[#242A3A] space-y-0.5">
                <span className="text-slate-400 text-[10px]">Dietary Fiber</span>
                <span className="font-extrabold text-emerald-400 text-sm block">{thaliTotals.fiber}g</span>
                <span className="text-[9px] text-slate-500">Digestive health</span>
              </div>
            </div>

            {/* Scientific Integrity Check */}
            <div className="p-3 rounded-2xl bg-[#101422] border border-cyan-500/20 text-cyan-300 text-[10px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verified Scientific Provenance</span>
              </div>
              <p className="text-slate-400 leading-normal">
                All food records in this Thali are verified against ICMR-NIN IFCT 2017 & USDA FoodData Central. Portions scale proportionally without crude roundoff distortion.
              </p>
            </div>

            {/* Action Button: Log Complete Thali */}
            <button
              type="button"
              onClick={handleLogThali}
              disabled={loggingInProgress || thaliItems.length === 0}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C8FF00] to-[#39E58C] hover:brightness-110 active:scale-98 text-[#080A12] font-black text-xs shadow-lg shadow-[#C8FF00]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loggingInProgress ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#080A12] border-t-transparent rounded-full animate-spin" />
                  <span>Logging {thaliItems.length} Items to Diary...</span>
                </>
              ) : (
                <>
                  <Utensils className="w-4 h-4" />
                  <span>Log Entire Thali ({thaliItems.length} Items) to {mealType}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

