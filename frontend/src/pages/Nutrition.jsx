import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { nutritionService } from '../services/nutrition.service';
import { workoutService } from '../services/workout.service';
import DashboardLayout from '../layouts/DashboardLayout';
import WaterTrackerCard from '../components/nutrition/WaterTrackerCard';
import MacroBreakdownCard from '../components/nutrition/MacroBreakdownCard';
import QuickFoodLogModal from '../components/nutrition/QuickFoodLogModal';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Sparkles,
  Target,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Scale,
  Flame,
  PieChart as PieIcon,
  Trash2,
  Copy,
  Star,
  Clock,
  BookOpen,
  Filter,
  Check,
  AlertCircle,
  Loader2,
  X,
  Edit2,
  ChevronDown,
  Info,
  TrendingUp,
  Award,
  Zap,
  Camera,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

const MEAL_ICONS = {
  Breakfast: '🌅',
  'Morning Snack': '☕',
  Lunch: '🍛',
  'Evening Snack': '🫖',
  Dinner: '🍲',
  Custom: '🍽️',
};

const CATEGORIES = [
  'All',
  'Breakfast',
  'Breads',
  'Rice & Grains',
  'Dal & Curries',
  'Protein & Meat',
  'Vegetables',
  'Snacks & Street Food',
  'Beverages',
  'Sweets & Desserts',
  'Staples & Ingredients',
];

const DIETARY_TYPES = ['All', 'Veg', 'Non-Veg', 'Egg', 'Vegan'];
const CUISINES = ['All', 'South Indian', 'North Indian', 'Andhra/Telangana', 'Pan-Indian', 'Street Food', 'Bengali'];

// Custom Glassmorphic Tooltip for Recharts
function NutritionChartTooltip({ active, payload, label, unit = '' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0D101B]/95 border border-[#242A3A] p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1">
        <p className="font-bold text-[#F5F7FC] border-b border-[#242A3A] pb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-[#A4AABC] font-medium">{entry.name}:</span>
            <span className="font-extrabold text-[#F5F7FC]">
              {entry.value} {unit}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const THEME_GAUGE_CONFIG = {
  'fresh-sky': { track: '#1D2332', progress: '#C8FF00', grid: '#242A3A' },
  'soft-sunrise': { track: '#1D2332', progress: '#C8FF00', grid: '#242A3A' },
  'warm-horizon': { track: '#1D2332', progress: '#C8FF00', grid: '#242A3A' },
  'midnight-sea': { track: '#1D2332', progress: '#C8FF00', grid: '#242A3A' },
};

export default function Nutrition() {
  const { user } = useAuth();
  const { isDark, theme } = useTheme();
  const gaugeConfig = THEME_GAUGE_CONFIG[theme] || THEME_GAUGE_CONFIG['midnight-sea'];

  // State: Selected date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewTab, setViewTab] = useState('diary'); // 'diary' | 'analytics'

  // Data states
  const [diaryData, setDiaryData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [workoutCaloriesBurned, setWorkoutCaloriesBurned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [quickLogModalOpen, setQuickLogModalOpen] = useState(false);
  const [quickLogMeal, setQuickLogMeal] = useState('Breakfast');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [targetMealForSearch, setTargetMealForSearch] = useState('Breakfast');
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [recipesModalOpen, setRecipesModalOpen] = useState(false);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);

  // Food Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [searchDietary, setSearchDietary] = useState('All');
  const [searchCuisine, setSearchCuisine] = useState('All');
  const [searchTab, setSearchTab] = useState('catalogue'); // 'catalogue' | 'favorites' | 'recent' | 'custom'
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [selectedServingUnit, setSelectedServingUnit] = useState('');
  const [servingQuantity, setServingQuantity] = useState(1);
  const [customServingGrams, setCustomServingGrams] = useState(100);
  const [foodLogNotes, setFoodLogNotes] = useState('');
  const [loggingInProgress, setLoggingInProgress] = useState(false);
  const [stagedFoods, setStagedFoods] = useState([]);

  // Custom Food Form state
  const [customFoodForm, setCustomFoodForm] = useState({
    name: '',
    category: 'Breakfast',
    cuisine: 'Pan-Indian',
    dietaryType: 'Veg',
    servingUnit: 'portion (100g)',
    servingSizeGrams: 100,
    calories: 150,
    protein: 5,
    carbs: 20,
    fat: 5,
    fiber: 2,
  });

  // AI Parser & Vision state
  const [aiHubTab, setAiHubTab] = useState('photo'); // 'photo' | 'text'
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoHint, setPhotoHint] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoAnalysisResult, setPhotoAnalysisResult] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiParsedResults, setAiParsedResults] = useState(null);
  const [aiMealType, setAiMealType] = useState('Lunch');

  // TDEE Preview calculation state
  const [tdeePreview, setTdeePreview] = useState(null);
  const [tdeeCalculating, setTdeeCalculating] = useState(false);

  // Recipes state
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [recipeCreating, setRecipeCreating] = useState(false);
  const [newRecipeForm, setNewRecipeForm] = useState({
    name: '',
    description: '',
    servings: 2,
    cookedWeightGrams: '',
    notes: '',
    ingredients: [],
  });

  // Goals Modal Form
  const [goalsForm, setGoalsForm] = useState({
    dailyCalories: 2000,
    proteinGrams: 125,
    carbsGrams: 225,
    fatGrams: 65,
    fiberGrams: 30,
    waterTargetMl: 2500,
    age: 28,
    gender: 'male',
    heightCm: 175,
    currentWeightKg: 72,
    fitnessGoal: 'maintenance',
    activityLevel: 'moderate',
    dietaryPreference: 'Veg',
  });

  // Weight form
  const [weightFormInput, setWeightFormInput] = useState('');
  const [weightNoteInput, setWeightNoteInput] = useState('');

  // 1. Fetch Daily Diary Data
  const fetchDiary = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const data = await nutritionService.getDailyLogs(date);
      setDiaryData(data);
      if (data?.goals) {
        setGoalsForm((prev) => ({
          ...prev,
          ...data.goals,
          dailyCalories: data.goals.dailyCalories || 2000,
          proteinGrams: data.goals.proteinGrams || 125,
          carbsGrams: data.goals.carbsGrams || 225,
          fatGrams: data.goals.fatGrams || 65,
          fiberGrams: data.goals.fiberGrams || 30,
        }));
      }
    } catch (err) {
      console.error('Error fetching nutrition diary:', err);
      setError(err.message || 'Failed to load nutrition logs');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Analytics Data
  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await nutritionService.getAnalytics(7);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, []);

  // 3. Fetch Workout Burned Calories for the selected date
  const fetchWorkoutCalories = useCallback(async (date) => {
    try {
      const res = await workoutService.getWorkouts({ date });
      const list = res?.workouts || (Array.isArray(res) ? res : []);
      const totalBurn = list.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      setWorkoutCaloriesBurned(Math.round(totalBurn));
    } catch (err) {
      console.warn('Could not load workout calories for energy balance:', err);
    }
  }, []);

  // Initial mount & date change
  useEffect(() => {
    fetchDiary(selectedDate);
    fetchWorkoutCalories(selectedDate);
    if (viewTab === 'analytics') {
      fetchAnalytics();
    }
  }, [selectedDate, viewTab, fetchDiary, fetchAnalytics, fetchWorkoutCalories]);

  // Date Navigation handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Format Date for Display
  const formattedDisplayDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      const todayStr = new Date().toISOString().split('T')[0];
      const isToday = selectedDate === todayStr;

      const formatted = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return isToday ? `Today, ${formatted}` : formatted;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // 3. Search Foods Effect
  useEffect(() => {
    if (!searchModalOpen) return;

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        if (searchTab === 'favorites') {
          const favs = await nutritionService.getFavorites();
          setSearchResults(favs);
        } else if (searchTab === 'recent') {
          const recents = await nutritionService.getRecentFoods(15);
          setSearchResults(recents);
        } else if (searchTab === 'catalogue') {
          const data = await nutritionService.searchFoods({
            query: searchQuery,
            category: searchCategory,
            dietaryType: searchDietary,
            cuisine: searchCuisine,
            limit: 25,
          });
          setSearchResults(data?.foods || []);
        }
      } catch (err) {
        console.error('Error searching foods:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchModalOpen, searchQuery, searchCategory, searchDietary, searchCuisine, searchTab]);

  // When a food item is clicked in search list
  const handleSelectFoodItem = (food) => {
    setSelectedFoodItem(food);
    const defaultServing = food.servings?.find((s) => s.isDefault) || food.servings?.[0];
    setSelectedServingUnit(defaultServing ? defaultServing.unitName : '100g');
    setCustomServingGrams(defaultServing ? defaultServing.gramWeight : food.servingSizeGrams || 100);
    setServingQuantity(1);
    setFoodLogNotes('');
  };

  // Toggle favorite for food item
  const handleToggleFavorite = async (foodItem, e) => {
    e.stopPropagation();
    try {
      await nutritionService.toggleFavorite(foodItem.id);
      // update item favorite state locally
      setSearchResults((prev) =>
        prev.map((f) => (f.id === foodItem.id ? { ...f, isFavorite: !f.isFavorite } : f))
      );
      if (selectedFoodItem?.id === foodItem.id) {
        setSelectedFoodItem((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Stage current configured food item
  const handleStageCurrentFood = () => {
    if (!selectedFoodItem) return;
    const totalGrams = customServingGrams * servingQuantity;
    const ratio = totalGrams / (selectedFoodItem.servingSizeGrams || 100);

    const stagedItem = {
      id: `${selectedFoodItem.id}_${Date.now()}_${Math.random()}`,
      foodItemId: selectedFoodItem.id,
      foodName: selectedFoodItem.name,
      mealType: targetMealForSearch,
      logDate: selectedDate,
      servingQuantity,
      servingUnit: selectedServingUnit,
      servingGramWeight: customServingGrams,
      notes: foodLogNotes,
      totalGrams: Math.round(totalGrams),
      calories: Math.round(selectedFoodItem.calories * ratio),
      protein: Math.round(selectedFoodItem.protein * ratio * 10) / 10,
      carbs: Math.round(selectedFoodItem.carbs * ratio * 10) / 10,
      fat: Math.round(selectedFoodItem.fat * ratio * 10) / 10,
      dietaryType: selectedFoodItem.dietaryType,
    };

    setStagedFoods((prev) => [...prev, stagedItem]);
    setSelectedFoodItem(null);
  };

  // Quick add 1 standard serving directly from search card
  const handleQuickStageFood = (food) => {
    const defaultServing = food.servings?.find((s) => s.isDefault) || food.servings?.[0];
    const unitName = defaultServing ? defaultServing.unitName : food.servingUnit || '100g';
    const gramWeight = defaultServing ? defaultServing.gramWeight : food.servingSizeGrams || 100;
    const ratio = gramWeight / (food.servingSizeGrams || 100);

    const stagedItem = {
      id: `${food.id}_${Date.now()}_${Math.random()}`,
      foodItemId: food.id,
      foodName: food.name,
      mealType: targetMealForSearch,
      logDate: selectedDate,
      servingQuantity: 1,
      servingUnit: unitName,
      servingGramWeight: gramWeight,
      totalGrams: gramWeight,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
      dietaryType: food.dietaryType,
    };

    setStagedFoods((prev) => [...prev, stagedItem]);
  };

  // Remove single staged food from tray
  const handleRemoveStagedFood = (indexToRemove) => {
    setStagedFoods((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit all staged foods to diary in one batch
  const handleLogAllStagedFoods = async () => {
    if (!stagedFoods.length) return;
    setLoggingInProgress(true);
    try {
      await nutritionService.logMultipleFoods({
        mealType: targetMealForSearch,
        logDate: selectedDate,
        items: stagedFoods.map((item) => ({
          foodItemId: item.foodItemId,
          foodName: item.foodName,
          mealType: item.mealType || targetMealForSearch,
          logDate: selectedDate,
          servingQuantity: item.servingQuantity,
          servingUnit: item.servingUnit,
          servingGramWeight: item.servingGramWeight,
          notes: item.notes,
        })),
      });

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.75 },
      });

      setStagedFoods([]);
      setSelectedFoodItem(null);
      setSearchModalOpen(false);
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error logging multiple foods:', err);
      alert(err.message || 'Failed to log multiple foods');
    } finally {
      setLoggingInProgress(false);
    }
  };

  // Submit Food Log (handles both single item and staged batch)
  const handleLogFoodSubmit = async () => {
    if (!selectedFoodItem && !stagedFoods.length) return;
    setLoggingInProgress(true);
    try {
      const itemsToLog = [];

      for (const item of stagedFoods) {
        itemsToLog.push({
          foodItemId: item.foodItemId,
          foodName: item.foodName,
          mealType: item.mealType || targetMealForSearch,
          logDate: selectedDate,
          servingQuantity: item.servingQuantity,
          servingUnit: item.servingUnit,
          servingGramWeight: item.servingGramWeight,
          notes: item.notes,
        });
      }

      if (selectedFoodItem) {
        itemsToLog.push({
          foodItemId: selectedFoodItem.id,
          foodName: selectedFoodItem.name,
          mealType: targetMealForSearch,
          logDate: selectedDate,
          servingQuantity,
          servingUnit: selectedServingUnit,
          servingGramWeight: customServingGrams,
          notes: foodLogNotes,
        });
      }

      if (itemsToLog.length === 1) {
        await nutritionService.logFood(itemsToLog[0]);
      } else {
        await nutritionService.logMultipleFoods({
          mealType: targetMealForSearch,
          logDate: selectedDate,
          items: itemsToLog,
        });
      }

      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.8 },
      });

      setStagedFoods([]);
      setSelectedFoodItem(null);
      setSearchModalOpen(false);
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error logging food:', err);
      alert(err.message || 'Failed to log food');
    } finally {
      setLoggingInProgress(false);
    }
  };

  // Delete Food Log
  const handleDeleteFoodLog = async (logId) => {
    if (!window.confirm('Are you sure you want to remove this logged food?')) return;
    try {
      await nutritionService.deleteFoodLog(logId);
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error deleting food log:', err);
    }
  };

  // Duplicate Food Log
  const handleDuplicateFoodLog = async (logId, targetMeal) => {
    try {
      await nutritionService.duplicateFoodLog(logId, {
        targetMealType: targetMeal,
        targetDate: selectedDate,
      });
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error duplicating food log:', err);
    }
  };

  // Water Hydration Quick Logs
  const handleLogWater = async (amountMl) => {
    try {
      await nutritionService.logWater({ logDate: selectedDate, amountMl });
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error logging water:', err);
    }
  };

  // Natural Language AI Parsing
  const handleParseAiMeal = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const result = await nutritionService.parseNaturalLanguage(aiPrompt);
      setAiParsedResults(result);
    } catch (err) {
      console.error('Error parsing AI meal:', err);
      alert(err.message || 'Failed to parse natural language food');
    } finally {
      setAiLoading(false);
    }
  };

  // AI Food Photo Upload & Sample Handlers
  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Photo must be less than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setPhotoPreview(dataUrl);
      setPhotoBase64(dataUrl);
      setPhotoAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSamplePhoto = (sampleType) => {
    const samples = {
      idli: {
        hint: 'idli and sambar with coconut chutney',
        preview: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      },
      dosa: {
        hint: 'plain dosa with chutney and sambar',
        preview: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
      },
      biryani: {
        hint: 'chicken biryani with boiled egg',
        preview: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      },
      thali: {
        hint: 'roti with dal tadka and curd',
        preview: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
      },
    };

    const s = samples[sampleType];
    if (s) {
      setPhotoHint(s.hint);
      setPhotoPreview(s.preview);
      setPhotoBase64('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAopt/AAAAAElFTkSuQmCC');
      setPhotoAnalysisResult(null);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!photoBase64 && !photoHint) {
      alert('Please upload a food photo or enter a meal description hint');
      return;
    }

    setPhotoLoading(true);
    try {
      const result = await nutritionService.recognizePhoto({
        imageBase64: photoBase64 || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAopt/AAAAAElFTkSuQmCC',
        optionalHint: photoHint,
        mealType: aiMealType,
      });
      setPhotoAnalysisResult(result);
    } catch (err) {
      console.error('Error analyzing photo:', err);
      alert(err.response?.data?.message || err.message || 'Failed to analyze food photograph');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleUpdatePhotoCandidate = (index, updates) => {
    if (!photoAnalysisResult?.items) return;
    const items = [...photoAnalysisResult.items];
    const target = { ...items[index], ...updates };

    const qty = Number(target.quantity) || 1;
    const singleWeight = Number(target.servingGramWeight) || 100;
    const totalGrams = Math.round(singleWeight * qty * 10) / 10;
    const prevGrams = target.totalGrams || 100;

    const calPerGram = target.calories / prevGrams;
    const pPerGram = target.protein / prevGrams;
    const cPerGram = target.carbs / prevGrams;
    const fPerGram = target.fat / prevGrams;

    target.totalGrams = totalGrams;
    target.calories = Math.round(calPerGram * totalGrams * 10) / 10;
    target.protein = Math.round(pPerGram * totalGrams * 10) / 10;
    target.carbs = Math.round(cPerGram * totalGrams * 10) / 10;
    target.fat = Math.round(fPerGram * totalGrams * 10) / 10;

    items[index] = target;

    const newTotals = items.reduce(
      (acc, it) => ({
        calories: Math.round((acc.calories + it.calories) * 10) / 10,
        protein: Math.round((acc.protein + it.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + it.carbs) * 10) / 10,
        fat: Math.round((acc.fat + it.fat) * 10) / 10,
        fiber: Math.round((acc.fiber + (it.fiber || 0)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    setPhotoAnalysisResult({
      ...photoAnalysisResult,
      items,
      estimatedTotals: newTotals,
    });
  };

  const handleRemovePhotoCandidate = (index) => {
    if (!photoAnalysisResult?.items) return;
    const items = photoAnalysisResult.items.filter((_, idx) => idx !== index);
    const newTotals = items.reduce(
      (acc, it) => ({
        calories: Math.round((acc.calories + it.calories) * 10) / 10,
        protein: Math.round((acc.protein + it.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + it.carbs) * 10) / 10,
        fat: Math.round((acc.fat + it.fat) * 10) / 10,
        fiber: Math.round((acc.fiber + (it.fiber || 0)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
    setPhotoAnalysisResult({
      ...photoAnalysisResult,
      items,
      estimatedTotals: newTotals,
    });
  };

  const handleConfirmPhotoMeal = async () => {
    if (!photoAnalysisResult?.items?.length) return;
    setPhotoLoading(true);
    try {
      const itemsToLog = photoAnalysisResult.items.map((item) => ({
        foodItemId: item.foodItemId,
        foodName: item.foodName,
        mealType: aiMealType,
        logDate: selectedDate,
        servingQuantity: item.quantity,
        servingUnit: item.servingUnit,
        servingGramWeight: item.servingGramWeight,
      }));

      await nutritionService.logMultipleFoods({
        items: itemsToLog,
        mealType: aiMealType,
        logDate: selectedDate,
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });

      setAiModalOpen(false);
      setPhotoAnalysisResult(null);
      setPhotoPreview(null);
      setPhotoBase64(null);
      setPhotoHint('');
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error logging photo meal:', err);
      alert(err.response?.data?.message || err.message || 'Failed to log photo meal');
    } finally {
      setPhotoLoading(false);
    }
  };

  // TDEE Preview Handlers
  const handleCalculateTdeePreview = async () => {
    setTdeeCalculating(true);
    try {
      const preview = await nutritionService.calculateTdee({
        age: goalsForm.age || 28,
        gender: goalsForm.gender || 'male',
        heightCm: goalsForm.heightCm || 175,
        currentWeightKg: goalsForm.currentWeightKg || 72,
        activityLevel: goalsForm.activityLevel || 'moderate',
        fitnessGoal: goalsForm.fitnessGoal || 'maintenance',
      });
      setTdeePreview(preview);
    } catch (err) {
      console.error('Error calculating TDEE preview:', err);
      alert(err.response?.data?.message || err.message || 'Failed to calculate TDEE preview');
    } finally {
      setTdeeCalculating(false);
    }
  };

  const handleApplyTdeePreview = () => {
    if (!tdeePreview) return;
    setGoalsForm((prev) => ({
      ...prev,
      dailyCalories: tdeePreview.targetCalories,
      proteinGrams: tdeePreview.proteinGrams,
      carbsGrams: tdeePreview.carbsGrams,
      fatGrams: tdeePreview.fatGrams,
      fiberGrams: tdeePreview.fiberGrams,
      waterTargetMl: tdeePreview.waterTargetMl,
    }));
  };

  // Log all AI items to Diary (via atomic bulk endpoint)
  const handleLogAllAiItems = async () => {
    if (!aiParsedResults || !aiParsedResults.items?.length) return;
    setAiLoading(true);
    try {
      const itemsToLog = aiParsedResults.items.map((item) => ({
        foodItemId: item.foodItemId,
        foodName: item.foodName,
        mealType: aiMealType,
        logDate: selectedDate,
        servingQuantity: item.quantity,
        servingUnit: item.servingUnit,
        servingGramWeight: item.servingGramWeight,
      }));

      await nutritionService.logMultipleFoods({
        items: itemsToLog,
        mealType: aiMealType,
        logDate: selectedDate,
      });

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.75 },
      });

      setAiModalOpen(false);
      setAiParsedResults(null);
      setAiPrompt('');
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error logging parsed items:', err);
      alert(err.response?.data?.message || err.message || 'Failed to log some or all items');
    } finally {
      setAiLoading(false);
    }
  };

  // Weight Logging
  const handleSaveWeight = async (e) => {
    e.preventDefault();
    if (!weightFormInput) return;
    try {
      await nutritionService.logWeight({
        logDate: selectedDate,
        weightKg: parseFloat(weightFormInput),
        note: weightNoteInput,
      });
      setWeightModalOpen(false);
      setWeightFormInput('');
      setWeightNoteInput('');
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error saving weight:', err);
      alert(err.message || 'Failed to save weight');
    }
  };

  // Goals Save & Mifflin-St Jeor TDEE
  const handleSaveGoals = async (autoCalc = false) => {
    try {
      await nutritionService.updateGoals({
        ...goalsForm,
        autoCalculateFromStats: autoCalc,
      });
      setGoalsModalOpen(false);
      await fetchDiary(selectedDate);
    } catch (err) {
      console.error('Error updating goals:', err);
      alert(err.message || 'Failed to update goals');
    }
  };

  // Open food search for a specific meal
  const openSearchForMeal = (mealType) => {
    setTargetMealForSearch(mealType);
    setSelectedFoodItem(null);
    setSearchQuery('');
    setSearchTab('catalogue');
    setStagedFoods([]);
    setSearchModalOpen(true);
  };

  // Pre-calculated metrics for UI
  const totals = diaryData?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const goals = diaryData?.goals || { dailyCalories: 2000, proteinGrams: 125, carbsGrams: 225, fatGrams: 65, fiberGrams: 30 };
  const percentage = diaryData?.percentage || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const remaining = diaryData?.remaining || { calories: 2000, protein: 125, carbs: 225, fat: 65, fiber: 30 };

  // Calculate Radial Gauge values
  const caloriePercentClamped = Math.min(100, percentage.calories || 0);
  const strokeDashoffset = 283 - (283 * caloriePercentClamped) / 100;

  return (
    <DashboardLayout>
      <div className="w-full pt-2 sm:pt-4 pb-6 space-y-6 sm:space-y-8 animate-fade-in">
        {/* ================================================= */}
        {/* HEADER: Title, Date Navigator & Quick Action Bar */}
        {/* ================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#C8FF00]/15 text-[#C8FF00] flex items-center justify-center border border-[#C8FF00]/30 shadow-[0_0_12px_rgba(200,255,0,0.15)]">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-[#F5F7FC]' : 'text-[#0F172A]'}`}>
                  <span>Nutrition & Macro Studio</span>
                  <span className="text-xl">🥗</span>
                </h1>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-[#A4AABC]' : 'text-slate-600'}`}>
                  Caloric energy balance, macro targets, and smart hydration tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setQuickLogMeal('Breakfast');
                setQuickLogModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#C8FF00] to-[#39E58C] hover:brightness-110 text-[#080A12] text-xs font-black shadow-md shadow-[#C8FF00]/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-[#080A12]" />
              <span>+ Quick Staple</span>
            </button>

            <button
              onClick={() => openSearchForMeal('Breakfast')}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#151A29] border-[#242A3A] text-[#F5F7FC] hover:bg-[#1D2332]'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#C8FF00]" />
              <span>Food Database</span>
            </button>

            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#8B5CF6] border border-[#8B5CF6]/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>AI Log</span>
            </button>

            <button
              onClick={() => setGoalsModalOpen(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#151A29] hover:bg-[#1D2332] text-[#F5F7FC] border-[#242A3A]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-[#FFBF47]" />
              <span>Goals & TDEE</span>
            </button>
          </div>
        </div>

        {/* Date Selector & View Switcher Bar */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[20px] border shadow-lg transition-all ${
          isDark ? 'bg-[#111522] border-[#242A3A]' : 'bg-white border-slate-200'
        }`}>
          {/* Day Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevDay}
              className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                isDark
                  ? 'bg-[#0D101B] hover:bg-[#151A29] text-[#A4AABC] hover:text-[#F5F7FC] border-[#242A3A]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              isDark ? 'bg-[#0D101B] border-[#242A3A]' : 'bg-slate-50 border-slate-200'
            }`}>
              <CalendarIcon className="w-3.5 h-3.5 text-[#C8FF00]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer ${
                  isDark ? 'text-[#F5F7FC]' : 'text-slate-900'
                }`}
              />
              <span className={`text-xs hidden sm:inline ${isDark ? 'text-[#A4AABC]' : 'text-slate-500'}`}>
                ({formattedDisplayDate})
              </span>
            </div>

            <button
              onClick={handleNextDay}
              className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                isDark
                  ? 'bg-[#0D101B] hover:bg-[#151A29] text-[#A4AABC] hover:text-[#F5F7FC] border-[#242A3A]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
              }`}
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#C8FF00] hover:bg-[#C8FF00]/10 transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>

          {/* View Tab Toggle */}
          <div className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-[#0D101B] border-[#242A3A]' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setViewTab('diary')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewTab === 'diary'
                  ? 'bg-[#C8FF00] text-[#080A12] font-bold shadow-sm'
                  : isDark ? 'text-[#A4AABC] hover:text-[#F5F7FC]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Diary
            </button>
            <button
              onClick={() => setViewTab('analytics')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewTab === 'analytics'
                  ? 'bg-[#C8FF00] text-[#080A12] font-bold shadow-sm'
                  : isDark ? 'text-[#A4AABC] hover:text-[#F5F7FC]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trends & Analytics
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-9 h-9 text-[#C8FF00] animate-spin" />
            <p className="text-sm text-[#A4AABC] font-medium">Fetching nutrition records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400">
            <AlertCircle className="w-7 h-7 mx-auto mb-2" />
            <p className="font-bold">{error}</p>
            <button
              onClick={() => fetchDiary(selectedDate)}
              className="mt-3 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        ) : viewTab === 'diary' ? (
          <>
            {/* ================================================= */}
            {/* TOP METRICS: Calorie Progress & Macronutrients   */}
            {/* ================================================= */}
            <MacroBreakdownCard
              totals={totals}
              goals={goals}
              percentage={percentage}
              workoutCaloriesBurned={workoutCaloriesBurned}
            />

            {/* Hydration & Body Weight Station */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Hydration Station (8 cols) */}
              <div className="lg:col-span-8">
                <WaterTrackerCard
                  waterData={diaryData?.water}
                  onLogWater={handleLogWater}
                />
              </div>

              {/* Body Weight Log (4 cols) */}
              <div
                className={`lg:col-span-4 rounded-[26px] p-5 sm:p-6 border transition-all shadow-xl flex flex-col justify-between ${
                  isDark
                    ? 'bg-[#111522]/90 backdrop-blur-xl border-[#242A3A]'
                    : 'bg-white border-[#E2E8F0]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                        <Scale className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#A4AABC]' : 'text-slate-500'}`}>
                          Body Weight Log
                        </h3>
                        <p className={`text-[10px] ${isDark ? 'text-[#70788D]' : 'text-slate-400'}`}>Daily Weigh-in</p>
                      </div>
                    </div>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                      diaryData?.weight
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        : isDark
                        ? 'bg-[#151A29] text-[#70788D] border-[#242A3A]'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {diaryData?.weight ? 'Logged Today' : 'Pending'}
                    </span>
                  </div>

                  <div className="my-3 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-black ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>
                        {diaryData?.weight ? `${diaryData.weight}` : '--'}
                      </span>
                      <span className={`text-sm font-bold ${isDark ? 'text-[#A4AABC]' : 'text-slate-500'}`}>kg</span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-slate-500'}`}>
                      Goal Target: <strong className={isDark ? 'text-[#F5F7FC]' : 'text-slate-800'}>{goals.targetWeightKg ? `${goals.targetWeightKg} kg` : 'Maintain Current'}</strong>
                    </p>
                  </div>
                </div>

                <div className={`pt-3 border-t mt-4 ${isDark ? 'border-[#242A3A]/60' : 'border-slate-100'}`}>
                  <button
                    onClick={() => setWeightModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 text-xs font-bold border border-purple-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Scale className="w-4 h-4" />
                    <span>{diaryData?.weight ? 'Update Weigh-in' : '+ Record Weight'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* DAILY FOOD DIARY: Meal Sections                   */}
            {/* ================================================= */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-extrabold flex items-center gap-2 ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>
                  <span>Daily Meal Diary</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                    isDark ? 'bg-[#151A29] text-[#A4AABC] border-[#242A3A]' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {diaryData?.meals?.reduce((acc, m) => acc + m.itemCount, 0) || 0} items logged
                  </span>
                </h2>

                <button
                  onClick={() => openSearchForMeal('Breakfast')}
                  className="text-xs font-bold text-[#C8FF00] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Custom Item</span>
                </button>
              </div>

              {/* Meal Cards */}
              <div className="grid grid-cols-1 gap-4">
                {(diaryData?.meals || []).map((meal) => {
                  const icon = MEAL_ICONS[meal.mealType] || '🍽️';
                  const hasItems = meal.items && meal.items.length > 0;

                  return (
                    <div
                      key={meal.mealType}
                      className={`rounded-[24px] p-4 sm:p-5 shadow-lg border transition-all ${
                        isDark
                          ? 'bg-[#111522] border-[#242A3A] hover:border-[#C8FF00]/40'
                          : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {/* Meal Card Header */}
                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3 ${
                        isDark ? 'border-[#242A3A]' : 'border-slate-100'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{icon}</span>
                          <div>
                            <h3 className={`text-sm font-bold ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>{meal.mealType}</h3>
                            <p className={`text-xs font-medium ${isDark ? 'text-[#A4AABC]' : 'text-slate-500'}`}>
                              Subtotal: <strong className={isDark ? 'text-[#F5F7FC]' : 'text-slate-800'}>{meal.subtotal.calories} kcal</strong>
                              {hasItems && (
                                <span className={`text-[11px] ml-2 ${isDark ? 'text-[#70788D]' : 'text-slate-400'}`}>
                                  (P: {meal.subtotal.protein}g · C: {meal.subtotal.carbs}g · F: {meal.subtotal.fat}g)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => {
                              setQuickLogMeal(meal.mealType);
                              setQuickLogModalOpen(true);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                              isDark
                                ? 'bg-[#C8FF00]/15 hover:bg-[#C8FF00]/25 text-[#C8FF00] border border-[#C8FF00]/30'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                            title="Quick 1-tap staple logging"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Quick Staple</span>
                          </button>

                          <button
                            onClick={() => openSearchForMeal(meal.mealType)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                              isDark
                                ? 'bg-[#0D101B] hover:bg-[#151A29] border-[#242A3A] text-[#F5F7FC]'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5 text-[#C8FF00]" />
                            <span>Search Food</span>
                          </button>
                        </div>
                      </div>

                      {/* Items List */}
                      {hasItems ? (
                        <div className={`divide-y ${isDark ? 'divide-[#242A3A]/60' : 'divide-slate-100'}`}>
                          {meal.items.map((item) => (
                            <div
                              key={item.id}
                              className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h4 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-[#F5F7FC]' : 'text-slate-800'}`}>{item.foodName}</h4>
                                  {item.foodItem?.dietaryType && (
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                        item.foodItem.dietaryType === 'Non-Veg'
                                          ? 'bg-rose-500/20 text-rose-300'
                                          : item.foodItem.dietaryType === 'Egg'
                                          ? 'bg-amber-500/20 text-amber-300'
                                          : 'bg-emerald-500/20 text-emerald-400'
                                      }`}
                                    >
                                      {item.foodItem.dietaryType}
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs ${isDark ? 'text-[#A4AABC]' : 'text-slate-500'}`}>
                                  {item.servingQuantity} × {item.servingUnit} ({item.totalGrams}g)
                                  {item.notes && <span className={`italic ml-1.5 ${isDark ? 'text-[#70788D]' : 'text-slate-400'}`}>"{item.notes}"</span>}
                                </p>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                {/* Macros Pill */}
                                <div className="text-right">
                                  <span className={`text-xs font-extrabold block ${isDark ? 'text-[#F5F7FC]' : 'text-slate-900'}`}>
                                    {item.calories} kcal
                                  </span>
                                  <span className={`text-[10px] ${isDark ? 'text-[#70788D]' : 'text-slate-400'}`}>
                                    P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                                  </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDuplicateFoodLog(item.id, meal.mealType)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isDark ? 'text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title="Duplicate food item"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFoodLog(item.id)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title="Remove food item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={`py-4 text-center border border-dashed rounded-xl ${
                          isDark ? 'border-[#242A3A] bg-[#0D101B]/50' : 'border-slate-200 bg-slate-50/50'
                        }`}>
                          <p className={`text-xs ${isDark ? 'text-[#70788D]' : 'text-slate-400'}`}>No dishes logged for {meal.mealType} yet.</p>
                          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                            <span className={`text-[11px] ${isDark ? 'text-[#70788D]' : 'text-slate-400'}`}>Quick suggestions:</span>
                            {['Idli', 'Plain Dosa', 'Phulka', 'Dal Tadka', 'Sprouts'].map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => {
                                  setTargetMealForSearch(meal.mealType);
                                  setSearchQuery(suggestion);
                                  setSearchModalOpen(true);
                                }}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                                  isDark
                                    ? 'bg-[#151A29] hover:bg-[#1D2332] text-[#C8FF00] border-[#242A3A]'
                                    : 'bg-white hover:bg-slate-100 text-emerald-700 border-slate-200 shadow-xs'
                                }`}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* ================================================= */
          /* ANALYTICS & TRENDS VIEW                           */
          /* ================================================= */
          <div className="space-y-6">
            <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#242A3A] pb-3">
                <div>
                  <h2 className="text-base font-extrabold text-[#F5F7FC] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#C8FF00]" />
                    <span>7-Day Calorie Intake vs. Target</span>
                  </h2>
                  <p className="text-xs text-[#A4AABC]">
                    Consistent tracking leads to lasting body composition results.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#A4AABC]">Consistency:</span>
                  <span className="text-sm font-black text-[#C8FF00] ml-1.5">
                    {analyticsData?.consistencyPercentage || 0}%
                  </span>
                </div>
              </div>

              {/* Calorie Bar Chart */}
              <div className="h-64 w-full">
                {analyticsData?.dailyTrend?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gaugeConfig.grid} />
                      <XAxis dataKey="date" stroke="#70788D" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#70788D" tick={{ fontSize: 10 }} />
                      <Tooltip content={<NutritionChartTooltip unit="kcal" />} />
                      <ReferenceLine
                        y={goals.dailyCalories}
                        stroke="#FF5C67"
                        strokeDasharray="4 4"
                        label={{ value: 'Target', fill: '#FF5C67', fontSize: 10 }}
                      />
                      <Bar dataKey="calories" fill={gaugeConfig.progress} radius={[6, 6, 0, 0]} name="Calories Eaten" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#A4AABC]">
                    Loading trend points...
                  </div>
                )}
              </div>
            </div>

            {/* Averages Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 text-center">
                <span className="text-xs font-semibold text-[#A4AABC] block">Avg Daily Calories</span>
                <span className="text-xl font-black text-[#F5F7FC] mt-1 block">
                  {analyticsData?.averages?.calories || 0} kcal
                </span>
                <span className="text-[10px] text-[#70788D]">Target: {goals.dailyCalories} kcal</span>
              </div>
              <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 text-center">
                <span className="text-xs font-semibold text-[#39E58C] block">Avg Protein</span>
                <span className="text-xl font-black text-[#F5F7FC] mt-1 block">
                  {analyticsData?.averages?.protein || 0} g
                </span>
                <span className="text-[10px] text-[#70788D]">Target: {goals.proteinGrams} g</span>
              </div>
              <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 text-center">
                <span className="text-xs font-semibold text-[#FFBF47] block">Avg Carbs</span>
                <span className="text-xl font-black text-[#F5F7FC] mt-1 block">
                  {analyticsData?.averages?.carbs || 0} g
                </span>
                <span className="text-[10px] text-[#70788D]">Target: {goals.carbsGrams} g</span>
              </div>
              <div className="bg-[#111522] border border-[#242A3A] rounded-[24px] p-4 text-center">
                <span className="text-xs font-semibold text-[#FF5C67] block">Avg Fat</span>
                <span className="text-xl font-black text-[#F5F7FC] mt-1 block">
                  {analyticsData?.averages?.fat || 0} g
                </span>
                <span className="text-[10px] text-[#70788D]">Target: {goals.fatGrams} g</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* MODAL 1: FOOD SEARCH & PORTION SELECTOR MODAL     */}
        {/* ================================================= */}
        {searchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#080A12]/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0D101B] border border-[#242A3A] w-full max-w-2xl max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-4 border-b border-[#242A3A] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F7FC] flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-[#C8FF00]" />
                    <span>Search Indian Foods for {targetMealForSearch}</span>
                  </h3>
                  <p className="text-[11px] text-[#A4AABC]">
                    Includes South Indian, North Indian, Street Foods & verified ICMR-NIN items
                  </p>
                </div>
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="p-1.5 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Tabs */}
              <div
                className="flex border-b px-4 pt-2 gap-2 text-xs transition-colors bg-[#0D101B] border-[#242A3A]"
              >
                <button
                  onClick={() => { setSearchTab('catalogue'); setSelectedFoodItem(null); }}
                  className={`pb-2 px-2 font-bold border-b-2 transition-all ${
                    searchTab === 'catalogue'
                      ? 'border-[#C8FF00] text-[#C8FF00]'
                      : 'border-transparent text-[#A4AABC] hover:text-[#F5F7FC]'
                  }`}
                >
                  Indian Catalogue
                </button>
                <button
                  onClick={() => { setSearchTab('favorites'); setSelectedFoodItem(null); }}
                  className={`pb-2 px-2 font-bold border-b-2 transition-all ${
                    searchTab === 'favorites'
                      ? 'border-[#C8FF00] text-[#C8FF00]'
                      : 'border-transparent text-[#A4AABC] hover:text-[#F5F7FC]'
                  }`}
                >
                  ⭐ Favorites
                </button>
                <button
                  onClick={() => { setSearchTab('recent'); setSelectedFoodItem(null); }}
                  className={`pb-2 px-2 font-bold border-b-2 transition-all ${
                    searchTab === 'recent'
                      ? 'border-[#C8FF00] text-[#C8FF00]'
                      : 'border-transparent text-[#A4AABC] hover:text-[#F5F7FC]'
                  }`}
                >
                  🕒 Recent
                </button>
                <button
                  onClick={() => { setSearchTab('custom'); setSelectedFoodItem(null); }}
                  className={`pb-2 px-2 font-bold border-b-2 transition-all ${
                    searchTab === 'custom'
                      ? 'border-[#C8FF00] text-[#C8FF00]'
                      : 'border-transparent text-[#A4AABC] hover:text-[#F5F7FC]'
                  }`}
                >
                  ➕ Create Custom Food
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {searchTab !== 'custom' ? (
                  <>
                    {/* Search Input Bar */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#A4AABC] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search dish name, regional transliteration (e.g. dosa, idli, dal, biryani)..."
                        className="w-full bg-[#151A29] border border-[#242A3A] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#F5F7FC] placeholder-[#70788D] focus:outline-none focus:border-[#C8FF00]"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-3 text-[#A4AABC] hover:text-[#F5F7FC]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-[#A4AABC] mr-1">Category:</span>
                      {['All', 'Breakfast', 'Breads', 'Dal & Curries', 'Protein & Meat', 'Beverages'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSearchCategory(cat)}
                          className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                            searchCategory === cat
                              ? 'bg-[#C8FF00] text-[#080A12] font-bold'
                              : 'bg-[#151A29] text-[#A4AABC] hover:text-[#F5F7FC] border border-[#242A3A]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Food Items List */}
                    {searchLoading ? (
                      <div className="py-12 flex justify-center">
                        <Loader2 className="w-6 h-6 text-[#C8FF00] animate-spin" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                        {searchResults.map((food) => {
                          const isSelected = selectedFoodItem?.id === food.id;
                          return (
                            <div
                              key={food.id}
                              onClick={() => handleSelectFoodItem(food)}
                              className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-[#C8FF00]/10 border-[#C8FF00] ring-1 ring-[#C8FF00]/50'
                                  : 'bg-[#151A29] border-[#242A3A] hover:border-[#C8FF00]/40 hover:bg-[#1D2332]'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#F5F7FC]">{food.name}</span>
                                  <span
                                    className={`text-[9px] px-1 rounded font-bold uppercase ${
                                      food.dietaryType === 'Non-Veg'
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : food.dietaryType === 'Egg'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-emerald-500/20 text-emerald-300'
                                    }`}
                                  >
                                    {food.dietaryType}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 truncate max-w-sm">
                                  {food.regionalName || food.aliases || food.cuisine}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <span className="font-extrabold text-[#F5F7FC] block">
                                    {food.calories} kcal
                                  </span>
                                  <span className="text-[10px] text-[#70788D]">
                                    per {food.servingUnit || '100g'}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickStageFood(food);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#C8FF00]/15 hover:bg-[#C8FF00] text-[#C8FF00] hover:text-[#080A12] font-bold text-[11px] flex items-center gap-1 transition-all"
                                  title="Quick add 1 serving to meal tray"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </button>

                                <button
                                  onClick={(e) => handleToggleFavorite(food, e)}
                                  className={`p-1 rounded-lg transition-colors ${
                                    food.isFavorite ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                                  }`}
                                  title="Toggle favorite"
                                >
                                  <Star className={`w-4 h-4 ${food.isFavorite ? 'fill-amber-400' : ''}`} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No dishes found matching "{searchQuery}". Try selecting "Create Custom Food" tab.
                      </div>
                    )}

                    {/* Selected Food Item Portion Configurator */}
                    {selectedFoodItem && (
                      <div
                        className="p-4 rounded-2xl border space-y-3 mt-3 animate-fade-in shadow-sm"
                        style={{
                          backgroundColor: isDark ? '#161616' : themeCardBg,
                          borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : themeCardBorder,
                        }}
                      >
                        <div
                          className="flex items-center justify-between pb-2"
                          style={{
                            borderBottom: `1px solid ${isDark ? '#1e293b' : themeCardBorder}`,
                          }}
                        >
                          <div>
                            <span
                              className="text-[11px] font-bold uppercase tracking-wider"
                              style={{ color: themeAccent }}
                            >
                              Configure Portion
                            </span>
                            <h4 className="text-sm font-black" style={{ color: themeTextPrimary }}>
                              {selectedFoodItem.name}
                            </h4>
                          </div>
                          <span className="text-xs font-bold" style={{ color: themeTextSecondary }}>
                            Meal: <strong style={{ color: themeAccent }}>{targetMealForSearch}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Portion Unit Picker */}
                          <div>
                            <label className="font-medium block mb-1" style={{ color: themeTextSecondary }}>
                              Serving Unit
                            </label>
                            <select
                              value={selectedServingUnit}
                              onChange={(e) => {
                                const unit = e.target.value;
                                setSelectedServingUnit(unit);
                                const matched = selectedFoodItem.servings?.find((s) => s.unitName === unit);
                                if (matched) {
                                  setCustomServingGrams(matched.gramWeight);
                                }
                              }}
                              className="w-full rounded-xl px-3 py-2 focus:outline-none"
                              style={{
                                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#334155' : themeCardBorder}`,
                                color: themeTextPrimary,
                              }}
                            >
                              {selectedFoodItem.servings?.map((s) => (
                                <option key={s.id} value={s.unitName}>
                                  {s.unitName} ({s.gramWeight}g)
                                </option>
                              ))}
                              <option value="custom grams">Custom Grams</option>
                            </select>
                          </div>

                          {/* Quantity Multiplier */}
                          <div>
                            <label className="font-medium block mb-1" style={{ color: themeTextSecondary }}>
                              Quantity
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setServingQuantity((q) => Math.max(0.5, q - 0.5))}
                                className="w-8 h-8 rounded-lg font-bold transition-colors"
                                style={{
                                  backgroundColor: isDark ? '#1e293b' : '#FFFFFF',
                                  border: `1px solid ${isDark ? '#334155' : themeCardBorder}`,
                                  color: themeTextPrimary,
                                }}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={servingQuantity}
                                onChange={(e) => setServingQuantity(Math.max(0.25, parseFloat(e.target.value) || 1))}
                                className="flex-1 rounded-lg py-1.5 text-center font-bold"
                                style={{
                                  backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                  border: `1px solid ${isDark ? '#334155' : themeCardBorder}`,
                                  color: themeTextPrimary,
                                }}
                              />
                              <button
                                onClick={() => setServingQuantity((q) => q + 0.5)}
                                className="w-8 h-8 rounded-lg font-bold transition-colors"
                                style={{
                                  backgroundColor: isDark ? '#1e293b' : '#FFFFFF',
                                  border: `1px solid ${isDark ? '#334155' : themeCardBorder}`,
                                  color: themeTextPrimary,
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Live Calculated Nutrients Preview */}
                        {(() => {
                          const totalGrams = customServingGrams * servingQuantity;
                          const ratio = totalGrams / (selectedFoodItem.servingSizeGrams || 100);
                          const calcCalories = Math.round(selectedFoodItem.calories * ratio);
                          const calcProtein = Math.round(selectedFoodItem.protein * ratio * 10) / 10;
                          const calcCarbs = Math.round(selectedFoodItem.carbs * ratio * 10) / 10;
                          const calcFat = Math.round(selectedFoodItem.fat * ratio * 10) / 10;
                          const calcFiber = Math.round(selectedFoodItem.fiber * ratio * 10) / 10;

                          return (
                            <div
                              className="p-2.5 rounded-xl flex items-center justify-between text-xs"
                              style={{
                                backgroundColor: isDark ? '#111111' : '#FFFFFF',
                                border: `1px solid ${isDark ? '#1e293b' : themeCardBorder}`,
                              }}
                            >
                              <div>
                                <span className="block text-[11px]" style={{ color: themeTextSecondary }}>
                                  Total Weight: {totalGrams}g
                                </span>
                                <span className="text-base font-extrabold" style={{ color: themeTextPrimary }}>
                                  {calcCalories} kcal
                                </span>
                              </div>
                              <div className="text-right text-[11px]" style={{ color: themeTextSecondary }}>
                                <span>P: {calcProtein}g</span> · <span>C: {calcCarbs}g</span> · <span>F: {calcFat}g</span>
                                {calcFiber > 0 && <span> · Fiber: {calcFiber}g</span>}
                              </div>
                            </div>
                          );
                        })()}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleStageCurrentFood}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm bg-[#151A29] border border-[#242A3A] text-[#F5F7FC] hover:border-[#C8FF00]"
                          >
                            <Plus className="w-4 h-4 text-[#C8FF00]" />
                            <span>Add to Meal Tray</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleLogFoodSubmit}
                            disabled={loggingInProgress}
                            className="flex-1 py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] disabled:opacity-50 text-[#080A12] text-xs font-bold shadow-[0_0_12px_rgba(200,255,0,0.25)] flex items-center justify-center gap-1.5 transition-all"
                          >
                            {loggingInProgress ? (
                              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FFFFFF' }} />
                            ) : (
                              <Check className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                            )}
                            <span style={{ color: '#FFFFFF' }}>
                              {stagedFoods.length > 0
                                ? `Log All (${stagedFoods.length + 1} Items)`
                                : `Log to ${targetMealForSearch}`}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Custom Food Form */
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const created = await nutritionService.createCustomFood(customFoodForm);
                        handleSelectFoodItem(created);
                        setSearchTab('catalogue');
                      } catch (err) {
                        alert(err.message || 'Failed to create custom food');
                      }
                    }}
                    className="space-y-3 text-xs"
                  >
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">Food / Dish Name *</label>
                      <input
                        type="text"
                        required
                        value={customFoodForm.name}
                        onChange={(e) => setCustomFoodForm({ ...customFoodForm, name: e.target.value })}
                        placeholder="e.g. Grandma's Besan Chilla"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-medium block mb-1">Category</label>
                        <select
                          value={customFoodForm.category}
                          onChange={(e) => setCustomFoodForm({ ...customFoodForm, category: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                        >
                          {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-1">Dietary Type</label>
                        <select
                          value={customFoodForm.dietaryType}
                          onChange={(e) => setCustomFoodForm({ ...customFoodForm, dietaryType: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                        >
                          {DIETARY_TYPES.filter((d) => d !== 'All').map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1">Calories (kcal)</label>
                        <input
                          type="number"
                          required
                          value={customFoodForm.calories}
                          onChange={(e) => setCustomFoodForm({ ...customFoodForm, calories: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1">Protein (g)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={customFoodForm.protein}
                          onChange={(e) => setCustomFoodForm({ ...customFoodForm, protein: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1">Carbs (g)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={customFoodForm.carbs}
                          onChange={(e) => setCustomFoodForm({ ...customFoodForm, carbs: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1">Fat (g)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={customFoodForm.fat}
                          onChange={(e) => setCustomFoodForm({ ...customFoodForm, fat: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] font-bold mt-2 shadow-[0_0_12px_rgba(200,255,0,0.25)]"
                    >
                      Save Custom Food & Select
                    </button>
                  </form>
                )}
              </div>

              {/* Persistent Multi-Item Staged Tray Footer */}
              {stagedFoods.length > 0 && (
                <div
                  className="p-3.5 border-t backdrop-blur-md space-y-2.5 shrink-0 animate-fade-in shadow-lg"
                  style={{
                    backgroundColor: themeCardBg,
                    borderColor: themeCardBorder,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🍽️</span>
                      <span className="text-xs font-bold" style={{ color: themeTextPrimary }}>
                        Staged for {targetMealForSearch} ({stagedFoods.length} {stagedFoods.length === 1 ? 'dish' : 'dishes'})
                      </span>
                      <span className="text-xs font-extrabold" style={{ color: themeAccent }}>
                        {stagedFoods.reduce((sum, item) => sum + (item.calories || 0), 0)} kcal
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStagedFoods([])}
                      className="text-[11px] font-medium hover:text-rose-500 transition-colors"
                      style={{ color: themeTextSecondary }}
                    >
                      Clear tray
                    </button>
                  </div>

                  {/* Horizontal Scroll of Staged Food Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                    {stagedFoods.map((staged, idx) => (
                      <div
                        key={staged.id || idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs shrink-0 shadow-sm transition-all"
                        style={{
                          backgroundColor: isDark ? '#222222' : '#FFFFFF',
                          border: `1px solid ${isDark ? '#333333' : themeCardBorder}`,
                        }}
                      >
                        <span className="font-semibold" style={{ color: themeTextPrimary }}>
                          {staged.foodName}
                        </span>
                        <span className="text-[11px]" style={{ color: themeTextSecondary }}>
                          {staged.servingQuantity}× ({staged.calories} kcal)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedFood(idx)}
                          className="p-0.5 rounded transition-colors hover:text-rose-500"
                          style={{ color: themeTextSecondary }}
                          title="Remove item"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Primary Action */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5"
                    style={{
                      borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                    }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: themeTextSecondary }}>
                      Total: P: {Math.round(stagedFoods.reduce((sum, i) => sum + (i.protein || 0), 0) * 10) / 10}g · C:{' '}
                      {Math.round(stagedFoods.reduce((sum, i) => sum + (i.carbs || 0), 0) * 10) / 10}g · F:{' '}
                      {Math.round(stagedFoods.reduce((sum, i) => sum + (i.fat || 0), 0) * 10) / 10}g
                    </span>
                    <button
                      type="button"
                      onClick={handleLogAllStagedFoods}
                      disabled={loggingInProgress}
                      className="px-4 py-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] disabled:opacity-50 text-xs font-bold text-[#080A12] shadow-[0_0_12px_rgba(200,255,0,0.25)] flex items-center justify-center gap-1.5 transition-all"
                    >
                      {loggingInProgress ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#FFFFFF' }} />
                      ) : (
                        <Check className="w-3.5 h-3.5" style={{ color: '#FFFFFF' }} />
                      )}
                      <span style={{ color: '#FFFFFF' }}>
                        Log All ({stagedFoods.length}) to {targetMealForSearch}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* MODAL 2: AI FOOD INTELLIGENCE HUB (VISION + TEXT) */}
        {/* ================================================= */}
        {aiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#080A12]/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0D101B] border border-[#242A3A] w-full max-w-xl max-h-[92vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#242A3A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F7FC]">AI Food Intelligence Hub</h3>
                    <p className="text-[10px] text-slate-400">Vision Photo Recognition & Natural Language Diary</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAiModalOpen(false);
                    setPhotoAnalysisResult(null);
                    setAiParsedResults(null);
                  }}
                  className="p-1.5 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-Tabs: Photo vs Natural Language */}
              <div className="flex border-b border-[#242A3A] bg-[#0A0D16] px-4 pt-2 gap-4 text-xs font-bold">
                <button
                  onClick={() => setAiHubTab('photo')}
                  className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
                    aiHubTab === 'photo'
                      ? 'border-[#8B5CF6] text-[#8B5CF6]'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snap Food Photo</span>
                </button>
                <button
                  onClick={() => setAiHubTab('text')}
                  className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
                    aiHubTab === 'text'
                      ? 'border-[#8B5CF6] text-[#8B5CF6]'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Natural Language Prompt</span>
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 text-xs">
                {/* Target Meal Selector */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#151A29] border border-[#242A3A]">
                  <span className="text-slate-300 font-semibold">Log to Meal Section:</span>
                  <select
                    value={aiMealType}
                    onChange={(e) => setAiMealType(e.target.value)}
                    className="bg-[#0D101B] border border-[#242A3A] rounded-lg px-2.5 py-1 text-[#F5F7FC] font-bold focus:outline-none focus:border-[#C8FF00]"
                  >
                    {['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* TAB 1: PHOTO RECOGNITION */}
                {aiHubTab === 'photo' && (
                  <div className="space-y-4">
                    {/* Photo Upload Box */}
                    <div className="border-2 border-dashed border-[#242A3A] hover:border-[#8B5CF6]/50 rounded-2xl p-4 text-center space-y-2 bg-[#101422] transition-colors relative">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Upload or snap a food photo"
                      />
                      <div className="w-10 h-10 mx-auto rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-200">
                        Take a photo or tap to browse
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Supports JPG, PNG up to 8MB • Visual portions are estimated with uncertainty disclosure
                      </p>
                    </div>

                    {/* Quick Sample Photos for instant testing */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400">Or try a sample meal:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'idli', label: 'Idli & Sambar' },
                          { id: 'dosa', label: 'Plain Dosa Plate' },
                          { id: 'biryani', label: 'Chicken Biryani' },
                          { id: 'thali', label: 'Roti & Dal Thali' },
                        ].map((sample) => (
                          <button
                            key={sample.id}
                            type="button"
                            onClick={() => handleLoadSamplePhoto(sample.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-all"
                          >
                            🍽️ {sample.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photo Preview & Context Hint */}
                    {photoPreview && (
                      <div className="p-3 rounded-2xl bg-[#151A29] border border-[#242A3A] space-y-3">
                        <div className="relative rounded-xl overflow-hidden max-h-48 bg-black flex items-center justify-center">
                          <img
                            src={photoPreview}
                            alt="Food preview"
                            className="object-cover w-full max-h-48"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoPreview(null);
                              setPhotoBase64(null);
                              setPhotoAnalysisResult(null);
                            }}
                            className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-black"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Meal hint / description (optional):
                          </label>
                          <input
                            type="text"
                            value={photoHint}
                            onChange={(e) => setPhotoHint(e.target.value)}
                            placeholder="e.g. 2 idlis with sambar and coconut chutney"
                            className="w-full bg-[#0D101B] border border-[#242A3A] rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleAnalyzePhoto}
                          disabled={photoLoading}
                          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                        >
                          {photoLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Scanning Photo & Estimating Portions...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4" />
                              <span>Analyze Photo & Estimate Nutrition</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Candidate Detection Review (Mandatory Verification) */}
                    {photoAnalysisResult && (
                      <div className="border border-purple-500/40 rounded-2xl p-4 bg-purple-950/20 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-purple-300">
                              Detected {photoAnalysisResult.items?.length || 0} Food Item(s)
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-white">
                            Total: ~{photoAnalysisResult.estimatedTotals?.calories} kcal
                          </span>
                        </div>

                        {/* Uncertainty Notice */}
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Mandatory Portion Review</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {photoAnalysisResult.disclaimer}
                          </p>
                        </div>

                        {/* Editable candidate items */}
                        <div className="space-y-2">
                          {photoAnalysisResult.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl border border-slate-800 bg-[#0B0E18] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-white text-xs">{item.foodName}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                                      {item.source}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      ~{item.totalGrams}g total
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemovePhotoCandidate(idx)}
                                  className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/15"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Interactive Portion Stepper */}
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">Qty:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePhotoCandidate(idx, { quantity: Math.max(0.25, item.quantity - 0.5) })}
                                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-bold text-white text-xs">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdatePhotoCandidate(idx, { quantity: item.quantity + 0.5 })}
                                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Serving unit selector */}
                                {item.availableServings?.length > 0 && (
                                  <select
                                    value={item.servingUnit}
                                    onChange={(e) => {
                                      const matched = item.availableServings.find((s) => s.unitName === e.target.value);
                                      handleUpdatePhotoCandidate(idx, {
                                        servingUnit: e.target.value,
                                        servingGramWeight: matched ? matched.gramWeight : item.servingGramWeight,
                                      });
                                    }}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-[10px] text-white"
                                  >
                                    {item.availableServings.map((s, sIdx) => (
                                      <option key={sIdx} value={s.unitName}>
                                        {s.unitName}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                <div className="text-right">
                                  <span className="font-extrabold text-[#C8FF00] block text-xs">
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

                        {/* Confirmation Button */}
                        <button
                          type="button"
                          onClick={handleConfirmPhotoMeal}
                          disabled={photoLoading || !photoAnalysisResult.items?.length}
                          className="w-full py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(200,255,0,0.25)] cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirm & Log All to {aiMealType} Diary</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: NATURAL LANGUAGE PROMPT */}
                {aiHubTab === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">Describe what you ate:</label>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. I had two dosas with coconut chutney and one cup sambar..."
                    className="w-full bg-[#151A29] border border-[#242A3A] rounded-xl p-3 text-[#F5F7FC] placeholder-[#70788D] focus:outline-none focus:border-[#C8FF00] text-xs"
                  />
                </div>

                {/* Example prompt chips */}
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Click to try examples:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '2 dosas with coconut chutney and 1 cup sambar',
                      '3 phulkas with 1 katori dal tadka and curd',
                      '2 boiled eggs and 1 cup filter coffee',
                      '1 plate chicken dum biryani and chaas',
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setAiPrompt(example)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] text-left transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Log to:</span>
                    <select
                      value={aiMealType}
                      onChange={(e) => setAiMealType(e.target.value)}
                      className="bg-[#151A29] border border-[#242A3A] rounded-lg px-2.5 py-1 text-[#F5F7FC] font-bold focus:outline-none focus:border-[#C8FF00]"
                    >
                      {['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleParseAiMeal}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Parse Meal</span>
                  </button>
                </div>

                {/* Parsed items preview */}
                {aiParsedResults && (
                  <div className="border border-purple-500/30 rounded-2xl p-4 bg-purple-950/20 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300">
                        Detected {aiParsedResults.parsedCount} Dish(es)
                      </span>
                      <span className="text-xs font-extrabold text-white">
                        Total ~{aiParsedResults.estimatedTotals?.calories} kcal
                      </span>
                    </div>

                    <div className="space-y-2">
                      {aiParsedResults.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border flex items-center justify-between"
                          style={{
                            backgroundColor: isDark ? 'rgba(2, 6, 23, 0.7)' : '#FFFFFF',
                            borderColor: isDark ? '#1e293b' : themeCardBorder,
                          }}
                        >
                          <div>
                            <p className="font-bold" style={{ color: themeTextPrimary }}>
                              {item.quantity}× {item.foodName}
                            </p>
                            <p className="text-[10px]" style={{ color: themeTextSecondary }}>
                              {item.servingUnit} ({item.totalGrams}g)
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold block" style={{ color: themeTextPrimary }}>
                              {item.calories} kcal
                            </span>
                            <span className="text-[10px]" style={{ color: themeTextSecondary }}>
                              P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleLogAllAiItems}
                      disabled={aiLoading}
                      className="w-full py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(200,255,0,0.25)]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Add All to {aiMealType} Diary</span>
                    </button>
                  </div>
                )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* MODAL 3: NUTRITION GOALS & TDEE CALCULATOR        */}
        {/* ================================================= */}
        {goalsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#080A12]/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#0D101B] border border-[#242A3A] w-full max-w-xl max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#242A3A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#FFBF47]" />
                  <h3 className="text-sm font-bold text-[#F5F7FC]">Personalized Calorie & Macro Goals</h3>
                </div>
                <button
                  onClick={() => setGoalsModalOpen(false)}
                  className="p-1.5 rounded-xl text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 text-xs">
                {/* Mifflin-St Jeor Parameters */}
                <div
                  className="p-3.5 rounded-2xl border space-y-3"
                  style={{
                    backgroundColor: isDark ? '#020617' : themeCardBg,
                    borderColor: isDark ? '#1e293b' : themeCardBorder,
                  }}
                >
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                    Mifflin-St Jeor TDEE Calculator
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Age</label>
                      <input
                        type="number"
                        value={goalsForm.age || 28}
                        onChange={(e) => setGoalsForm({ ...goalsForm, age: parseInt(e.target.value) || 28 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Gender</label>
                      <select
                        value={goalsForm.gender || 'male'}
                        onChange={(e) => setGoalsForm({ ...goalsForm, gender: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={goalsForm.heightCm || 175}
                        onChange={(e) => setGoalsForm({ ...goalsForm, heightCm: parseFloat(e.target.value) || 175 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={goalsForm.currentWeightKg || 72}
                        onChange={(e) => setGoalsForm({ ...goalsForm, currentWeightKg: parseFloat(e.target.value) || 72 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Fitness Goal</label>
                      <select
                        value={goalsForm.fitnessGoal || 'maintenance'}
                        onChange={(e) => setGoalsForm({ ...goalsForm, fitnessGoal: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                      >
                        <option value="weight_loss">Weight Loss (Mild Deficit)</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="weight_gain">Lean Muscle Gain (Surplus)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Activity Level</label>
                      <select
                        value={goalsForm.activityLevel || 'moderate'}
                        onChange={(e) => setGoalsForm({ ...goalsForm, activityLevel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                      >
                        <option value="sedentary">Sedentary (Desk Job)</option>
                        <option value="light">Light (1-3 days/wk)</option>
                        <option value="moderate">Moderate (3-5 days/wk)</option>
                        <option value="very_active">Very Active (6-7 days/wk)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCalculateTdeePreview}
                      disabled={tdeeCalculating}
                      className="flex-1 py-2 rounded-xl bg-amber-600/25 hover:bg-amber-600/40 text-amber-300 font-bold border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {tdeeCalculating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>⚡ Preview Mifflin-St Jeor</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveGoals(true)}
                      className="flex-1 py-2 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] font-bold transition-all shadow-[0_0_12px_rgba(200,255,0,0.25)] cursor-pointer"
                    >
                      Calculate & Apply Now
                    </button>
                  </div>

                  {/* Live Calculation Preview Card */}
                  {tdeePreview && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                        <span>Clinical TDEE Assessment</span>
                        <span>{tdeePreview.targetCalories} kcal/day target</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="p-1.5 rounded-lg bg-black/40">
                          <span className="text-slate-400 block text-[9px]">Basal BMR</span>
                          <span className="font-extrabold text-white">{tdeePreview.bmr} kcal</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-black/40">
                          <span className="text-slate-400 block text-[9px]">Total TDEE</span>
                          <span className="font-extrabold text-white">{tdeePreview.tdee} kcal</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-black/40">
                          <span className="text-slate-400 block text-[9px]">Hydration</span>
                          <span className="font-extrabold text-cyan-300">{tdeePreview.waterTargetMl} ml</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-300 pt-1 border-t border-amber-500/20">
                        <span>Macros:</span>
                        <span>P: {tdeePreview.proteinGrams}g • C: {tdeePreview.carbsGrams}g • F: {tdeePreview.fatGrams}g • Fiber: {tdeePreview.fiberGrams}g</span>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">
                        {tdeePreview.notes}
                      </p>
                      <button
                        type="button"
                        onClick={handleApplyTdeePreview}
                        className="w-full py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] hover:bg-amber-400 transition-all cursor-pointer"
                      >
                        ✓ Copy Values to Manual Target Inputs Below
                      </button>
                    </div>
                  )}
                </div>

                {/* Target Inputs */}
                <div className="space-y-3">
                  <span className="text-slate-400 font-bold block">Or Customize Daily Targets Manually:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Calories (kcal)</label>
                      <input
                        type="number"
                        value={goalsForm.dailyCalories}
                        onChange={(e) => setGoalsForm({ ...goalsForm, dailyCalories: parseInt(e.target.value) || 2000 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-emerald-400 text-[10px] block mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={goalsForm.proteinGrams}
                        onChange={(e) => setGoalsForm({ ...goalsForm, proteinGrams: parseInt(e.target.value) || 125 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-amber-400 text-[10px] block mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        value={goalsForm.carbsGrams}
                        onChange={(e) => setGoalsForm({ ...goalsForm, carbsGrams: parseInt(e.target.value) || 225 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-rose-400 text-[10px] block mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={goalsForm.fatGrams}
                        onChange={(e) => setGoalsForm({ ...goalsForm, fatGrams: parseInt(e.target.value) || 65 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-teal-400 text-[10px] block mb-1">Fiber (g)</label>
                      <input
                        type="number"
                        value={goalsForm.fiberGrams}
                        onChange={(e) => setGoalsForm({ ...goalsForm, fiberGrams: parseInt(e.target.value) || 30 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-cyan-400 text-[10px] block mb-1">Water Target (ml)</label>
                      <input
                        type="number"
                        value={goalsForm.waterTargetMl}
                        onChange={(e) => setGoalsForm({ ...goalsForm, waterTargetMl: parseInt(e.target.value) || 2500 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSaveGoals(false)}
                  className="w-full py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] font-bold transition-all shadow-[0_0_12px_rgba(200,255,0,0.25)]"
                >
                  Save Goals
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* MODAL 4: WEIGHT LOG MODAL                         */}
        {/* ================================================= */}
        {weightModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
            <div className={`border w-full max-w-sm rounded-[24px] shadow-2xl p-5 space-y-4 text-xs ${
              isDark ? 'bg-[#0D101B] border-[#242A3A] text-[#F5F7FC]' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-[#242A3A]' : 'border-slate-100'}`}>
                <h3 className="font-bold flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-500" />
                  <span>Log Body Weight</span>
                </h3>
                <button
                  onClick={() => setWeightModalOpen(false)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-[#A4AABC] hover:text-[#F5F7FC] hover:bg-[#151A29]' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveWeight} className="space-y-3">
                <div>
                  <label className={`block mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 focus:outline-none focus:border-[#C8FF00] ${
                      isDark ? 'bg-[#151A29] border-[#242A3A] text-[#F5F7FC]' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Weight in kilograms (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    required
                    placeholder="e.g. 72.5"
                    value={weightFormInput}
                    onChange={(e) => setWeightFormInput(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 font-bold text-base focus:outline-none focus:border-[#C8FF00] ${
                      isDark ? 'bg-[#151A29] border-[#242A3A] text-[#F5F7FC]' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Notes (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning empty stomach"
                    value={weightNoteInput}
                    onChange={(e) => setWeightNoteInput(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 ${
                      isDark ? 'bg-[#151A29] border-[#242A3A] text-[#F5F7FC]' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#C8FF00] hover:bg-[#B4E600] text-[#080A12] font-bold shadow-[0_0_12px_rgba(200,255,0,0.25)] transition-all cursor-pointer active:scale-98"
                >
                  Record Weigh-in
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Quick Food Staple 1-Tap Log Modal */}
        <QuickFoodLogModal
          isOpen={quickLogModalOpen}
          onClose={() => setQuickLogModalOpen(false)}
          targetMeal={quickLogMeal}
          selectedDate={selectedDate}
          onFoodLogged={() => fetchDiary(selectedDate)}
        />
      </div>
    </DashboardLayout>
  );
}
