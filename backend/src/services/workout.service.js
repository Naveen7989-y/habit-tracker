import prisma from '../config/prisma.js';

class WorkoutService {
  /**
   * Get all workouts for a user with optional filtering
   */
  async getWorkouts(userId, { limit = 20, offset = 0, activityType = null, date = null } = {}) {
    const where = { userId };
    if (activityType && activityType !== 'All') {
      where.activityType = activityType;
    }
    if (date) {
      where.loggedDate = date;
    }

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.workout.count({ where }),
    ]);

    return { workouts, total };
  }

  /**
   * Get a single workout by ID
   */
  async getWorkoutById(userId, workoutId) {
    const workout = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });
    if (!workout) {
      const error = new Error('Workout not found');
      error.statusCode = 404;
      throw error;
    }
    return workout;
  }

  /**
   * Create / Log a completed or active workout
   */
  async createWorkout(userId, data) {
    const todayStr = new Date().toISOString().split('T')[0];

    const workout = await prisma.workout.create({
      data: {
        userId,
        title: data.title || `${data.activityType || 'Fitness'} Workout`,
        activityType: data.activityType || 'Running',
        durationSeconds: Math.max(0, parseInt(data.durationSeconds || 0, 10)),
        distanceKm: data.distanceKm ? parseFloat(data.distanceKm) : null,
        caloriesBurned: data.caloriesBurned ? parseFloat(data.caloriesBurned) : null,
        avgPace: data.avgPace || null,
        avgHeartRate: data.avgHeartRate ? parseInt(data.avgHeartRate, 10) : null,
        routeCoordinates: typeof data.routeCoordinates === 'string'
          ? data.routeCoordinates
          : (data.routeCoordinates ? JSON.stringify(data.routeCoordinates) : null),
        status: data.status || 'COMPLETED',
        notes: data.notes || null,
        startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
        completedAt: data.completedAt ? new Date(data.completedAt) : new Date(),
        loggedDate: data.loggedDate || todayStr,
      },
    });

    return workout;
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(userId, workoutId) {
    const existing = await prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });
    if (!existing) {
      const error = new Error('Workout not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.workout.delete({
      where: { id: workoutId },
    });

    return { message: 'Workout deleted successfully' };
  }

  /**
   * Aggregated workout stats for dashboard and analytics
   */
  async getWorkoutStats(userId) {
    const workouts = await prisma.workout.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { startedAt: 'desc' },
    });

    const totalWorkouts = workouts.length;
    let totalDurationSeconds = 0;
    let totalDistanceKm = 0;
    let totalCaloriesBurned = 0;
    let longestRunKm = 0;
    let longestRunDate = null;
    let mostCaloriesWorkout = 0;
    let mostCaloriesDate = null;

    for (const w of workouts) {
      totalDurationSeconds += w.durationSeconds || 0;
      const dist = w.distanceKm || 0;
      totalDistanceKm += dist;
      const cals = w.caloriesBurned || 0;
      totalCaloriesBurned += cals;

      if (dist > longestRunKm) {
        longestRunKm = dist;
        longestRunDate = w.loggedDate;
      }

      if (cals > mostCaloriesWorkout) {
        mostCaloriesWorkout = cals;
        mostCaloriesDate = w.loggedDate;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayWorkouts = workouts.filter((w) => w.loggedDate === todayStr);
    const todayDurationSeconds = todayWorkouts.reduce((acc, w) => acc + (w.durationSeconds || 0), 0);
    const todayDistanceKm = todayWorkouts.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
    const todayCaloriesBurned = todayWorkouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
    const todaySteps = Math.round(todayDistanceKm * 1350);

    // Compute weekly breakdown (Mon - Sun of current week)
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const weeklySeries = dayLabels.map((day, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dStr = d.toISOString().split('T')[0];
      const dayWorkouts = workouts.filter((w) => w.loggedDate === dStr);
      const cals = dayWorkouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
      const timeMin = Math.round(dayWorkouts.reduce((acc, w) => acc + (w.durationSeconds || 0), 0) / 60);
      const dist = dayWorkouts.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
      const steps = Math.round(dist * 1350);

      return {
        day,
        date: dStr,
        steps,
        calories: Math.round(cals),
        time: timeMin,
      };
    });

    // Compute monthly breakdown (4 weeks)
    const monthlySeries = ['W1', 'W2', 'W3', 'W4'].map((wLabel, wIdx) => {
      const daysBackStart = 28 - (wIdx * 7);
      const daysBackEnd = daysBackStart - 7;
      const startD = new Date(now);
      startD.setDate(now.getDate() - daysBackStart);
      const endD = new Date(now);
      endD.setDate(now.getDate() - daysBackEnd);

      const weekWorkouts = workouts.filter((w) => {
        if (!w.loggedDate) return false;
        const wDate = new Date(w.loggedDate);
        return wDate >= startD && wDate <= endD;
      });

      const cals = weekWorkouts.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
      const timeMin = Math.round(weekWorkouts.reduce((acc, w) => acc + (w.durationSeconds || 0), 0) / 60);
      const dist = weekWorkouts.reduce((acc, w) => acc + (w.distanceKm || 0), 0);
      const steps = Math.round(dist * 1350);

      return {
        day: wLabel,
        steps,
        calories: Math.round(cals),
        time: timeMin,
      };
    });

    return {
      totalWorkouts,
      totalActiveMinutes: Math.round(totalDurationSeconds / 60),
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalCaloriesBurned: Math.round(totalCaloriesBurned),
      today: {
        activeMinutes: Math.round(todayDurationSeconds / 60),
        distanceKm: Math.round(todayDistanceKm * 10) / 10,
        caloriesBurned: Math.round(todayCaloriesBurned),
        steps: todaySteps,
        count: todayWorkouts.length,
      },
      personalRecords: {
        mostSteps: {
          value: longestRunKm > 0 ? `${Math.round(longestRunKm * 1350)}` : '0',
          date: longestRunKm > 0 ? longestRunDate : '--',
        },
        longestRun: {
          value: longestRunKm > 0 ? `${longestRunKm} km` : '0 km',
          date: longestRunKm > 0 ? longestRunDate : '--',
        },
        mostCalories: {
          value: mostCaloriesWorkout > 0 ? `${Math.round(mostCaloriesWorkout)} Kcal` : '0 Kcal',
          date: mostCaloriesWorkout > 0 ? mostCaloriesDate : '--',
        },
      },
      weeklySeries,
      monthlySeries,
      recentWorkouts: workouts.slice(0, 5),
    };
  }
}

export const workoutService = new WorkoutService();
