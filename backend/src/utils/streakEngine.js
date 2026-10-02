/**
 * HAbyTAT Streak Engine
 * Computes Current Streak, Longest Streak, Total Completions, and Completion Rate.
 */

/**
 * Format a Date object to YYYY-MM-DD
 */
export const formatDateString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Add / subtract days from a YYYY-MM-DD string
 */
export const offsetDateString = (dateStr, daysOffset) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysOffset);
  return formatDateString(date);
};

/**
 * Calculate difference in days between two YYYY-MM-DD dates (d2 - d1)
 */
export const daysDifference = (dateStr1, dateStr2) => {
  const [y1, m1, d1] = dateStr1.split('-').map(Number);
  const [y2, m2, d2] = dateStr2.split('-').map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
};

/**
 * Core Streak Calculation for a Single Habit
 *
 * @param {Array<string|Object>} completions - List of completion dates strings or completion objects
 * @param {Date|string} startDate - When the habit was started
 * @param {Date|string|null} endDate - When the habit ended (if applicable)
 * @param {Date|string} [referenceDate] - The reference date (defaults to today)
 * @returns {Object} { currentStreak, longestStreak, totalCompletions, completionRate, isCompletedToday }
 */
export const calculateHabitStreaks = (
  completions = [],
  startDate = new Date(),
  endDate = null,
  referenceDate = new Date()
) => {
  const todayStr = formatDateString(referenceDate);
  const yesterdayStr = offsetDateString(todayStr, -1);

  // Extract unique date strings sorted ascending
  const rawDates = completions.map((c) => (typeof c === 'string' ? c : c.completedDate));
  const uniqueDatesSet = new Set(rawDates.filter(Boolean));
  const sortedDates = Array.from(uniqueDatesSet).sort();

  const totalCompletions = uniqueDatesSet.size;
  const isCompletedToday = uniqueDatesSet.has(todayStr);

  if (sortedDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      completionRate: 0,
      isCompletedToday: false,
    };
  }

  // 1. Calculate Longest Streak
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    if (!prevDate) {
      currentRun = 1;
    } else {
      const diff = daysDifference(prevDate, dateStr);
      if (diff === 1) {
        currentRun += 1;
      } else if (diff > 1) {
        currentRun = 1;
      }
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDate = dateStr;
  }

  // 2. Calculate Current Streak
  // If completed today: count backwards starting from today
  // If not completed today, but completed yesterday: count backwards starting from yesterday
  // If neither today nor yesterday completed: streak is 0
  let currentStreak = 0;
  let checkDate = null;

  if (isCompletedToday) {
    checkDate = todayStr;
  } else if (uniqueDatesSet.has(yesterdayStr)) {
    checkDate = yesterdayStr;
  }

  if (checkDate) {
    while (uniqueDatesSet.has(checkDate)) {
      currentStreak += 1;
      checkDate = offsetDateString(checkDate, -1);
    }
  }

  // 3. Calculate Completion Rate (%)
  const habitStartStr = formatDateString(startDate);
  const effectiveEndStr = endDate && formatDateString(endDate) < todayStr
    ? formatDateString(endDate)
    : todayStr;

  const totalDaysSpan = Math.max(1, daysDifference(habitStartStr, effectiveEndStr) + 1);
  const completionRate = Math.min(100, Math.round((totalCompletions / totalDaysSpan) * 100));

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate,
    isCompletedToday,
  };
};
