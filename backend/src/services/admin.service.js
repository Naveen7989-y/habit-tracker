import prisma from '../config/prisma.js';

export const adminService = {
  /**
   * High-Level Telemetry & Platform Overview
   */
  async getPlatformOverview() {
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalUsers,
      totalHabits,
      totalCompletions,
      totalFoods,
      totalWorkouts,
      todayCompletions,
      todayFoodLogs,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.habit.count(),
      prisma.habitCompletion.count(),
      prisma.foodItem.count(),
      prisma.workout.count(),
      prisma.habitCompletion.count({ where: { completedDate: todayStr } }),
      prisma.foodLog.count({ where: { logDate: todayStr } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: { habits: true, foodLogs: true, workouts: true },
          },
        },
      }),
    ]);

    return {
      metrics: {
        totalUsers,
        totalHabits,
        totalCompletions,
        totalFoods,
        totalWorkouts,
        todayCompletions,
        todayFoodLogs,
      },
      recentUsers,
    };
  },

  /**
   * User Management: List with pagination & search
   */
  async getUsers({ page = 1, limit = 20, search = '', role = 'ALL' }) {
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (role && role !== 'ALL') {
      where.role = role;
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          timezone: true,
          createdAt: true,
          _count: {
            select: {
              habits: true,
              completions: true,
              foodLogs: true,
              workouts: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      totalCount,
      page: Number(page),
      totalPages: Math.ceil(totalCount / take) || 1,
    };
  },

  /**
   * Change User Role (Promote to ADMIN / Demote to USER)
   */
  async updateUserRole(targetUserId, newRole, requestingAdminId) {
    if (!['USER', 'ADMIN'].includes(newRole)) {
      const error = new Error('Invalid role specified');
      error.statusCode = 400;
      throw error;
    }

    if (targetUserId === requestingAdminId && newRole !== 'ADMIN') {
      const error = new Error('Administrators cannot revoke their own admin privileges.');
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return updated;
  },

  /**
   * Delete User Account
   */
  async deleteUser(targetUserId, requestingAdminId) {
    if (targetUserId === requestingAdminId) {
      const error = new Error('You cannot delete your own administrator account.');
      error.statusCode = 400;
      throw error;
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return { message: 'User account and all associated records deleted successfully.' };
  },

  /**
   * Site Content & CMS Management
   */
  async getSiteContent() {
    let content = await prisma.siteContent.findUnique({
      where: { id: 'default' },
    });

    if (!content) {
      content = await prisma.siteContent.create({
        data: {
          id: 'default',
          heroTitle: 'Where dreams rise through the silence.',
          heroSubtitle: "We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.",
          heroCtaText: 'Start Journey',
          heroCtaLink: '/register',
          announcementText: '🔥 New Release: Indian Macro & Calorie Tracker is now live! Track 95+ regional dishes.',
          announcementActive: false,
          announcementType: 'info',
          adsJson: '[]',
          settingsJson: '{}',
        },
      });
    }

    return content;
  },

  async updateSiteContent(data) {
    const {
      heroTitle,
      heroSubtitle,
      heroCtaText,
      heroCtaLink,
      announcementText,
      announcementActive,
      announcementType,
      adsJson,
      settingsJson,
    } = data;

    const updated = await prisma.siteContent.upsert({
      where: { id: 'default' },
      update: {
        heroTitle: heroTitle !== undefined ? heroTitle.trim() : undefined,
        heroSubtitle: heroSubtitle !== undefined ? heroSubtitle.trim() : undefined,
        heroCtaText: heroCtaText !== undefined ? heroCtaText.trim() : undefined,
        heroCtaLink: heroCtaLink !== undefined ? heroCtaLink.trim() : undefined,
        announcementText: announcementText !== undefined ? announcementText.trim() : undefined,
        announcementActive: announcementActive !== undefined ? Boolean(announcementActive) : undefined,
        announcementType: announcementType || undefined,
        adsJson: adsJson !== undefined ? (typeof adsJson === 'string' ? adsJson : JSON.stringify(adsJson)) : undefined,
        settingsJson: settingsJson !== undefined ? (typeof settingsJson === 'string' ? settingsJson : JSON.stringify(settingsJson)) : undefined,
      },
      create: {
        id: 'default',
        heroTitle: heroTitle || 'Where dreams rise through the silence.',
        heroSubtitle: heroSubtitle || "We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.",
        heroCtaText: heroCtaText || 'Start Journey',
        heroCtaLink: heroCtaLink || '/register',
        announcementText: announcementText || '',
        announcementActive: Boolean(announcementActive),
        announcementType: announcementType || 'info',
        adsJson: typeof adsJson === 'string' ? adsJson : JSON.stringify(adsJson || []),
        settingsJson: typeof settingsJson === 'string' ? settingsJson : JSON.stringify(settingsJson || {}),
      },
    });

    return updated;
  },

  /**
   * Food Catalogue CMS
   */
  async getCatalogueFoods({ page = 1, limit = 20, search = '', category = 'All' }) {
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Number(limit);

    const where = {};
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { regionalName: { contains: q, mode: 'insensitive' } },
        { aliases: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'All') {
      where.category = category;
    }

    const [foods, totalCount] = await Promise.all([
      prisma.foodItem.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { servings: true },
      }),
      prisma.foodItem.count({ where }),
    ]);

    return {
      foods,
      totalCount,
      page: Number(page),
      totalPages: Math.ceil(totalCount / take) || 1,
    };
  },

  async createCatalogueFood(data) {
    const {
      name,
      regionalName,
      aliases,
      category = 'Breakfast',
      cuisine = 'Pan-Indian',
      dietaryType = 'Veg',
      servingUnit = '100g',
      servingSizeGrams = 100,
      calories,
      protein,
      carbs,
      fat,
      fiber = 0,
      sugar = 0,
      sodium = 0,
      source = 'Official Verified Database',
      isVerified = true,
      servings = [],
    } = data;

    if (!name || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
      const error = new Error('Name, calories, protein, carbs, and fat are required');
      error.statusCode = 400;
      throw error;
    }

    const food = await prisma.foodItem.create({
      data: {
        name: name.trim(),
        regionalName: regionalName ? regionalName.trim() : null,
        aliases: aliases ? aliases.trim() : null,
        category,
        cuisine,
        dietaryType,
        servingUnit,
        servingSizeGrams: Number(servingSizeGrams) || 100,
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        fiber: Number(fiber) || 0,
        sugar: Number(sugar) || 0,
        sodium: Number(sodium) || 0,
        source,
        isVerified: Boolean(isVerified),
        isCustom: false,
        servings: {
          create: [
            {
              unitName: `1 standard serving (${servingSizeGrams}g)`,
              gramWeight: Number(servingSizeGrams) || 100,
              isDefault: true,
            },
            ...servings.map((s) => ({
              unitName: s.unitName,
              gramWeight: Number(s.gramWeight),
              isDefault: false,
            })),
          ],
        },
      },
      include: { servings: true },
    });

    return food;
  },

  async updateCatalogueFood(foodId, data) {
    const existing = await prisma.foodItem.findUnique({
      where: { id: foodId },
    });

    if (!existing) {
      const error = new Error('Food item not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.foodItem.update({
      where: { id: foodId },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        regionalName: data.regionalName !== undefined ? data.regionalName?.trim() || null : undefined,
        aliases: data.aliases !== undefined ? data.aliases?.trim() || null : undefined,
        category: data.category || undefined,
        cuisine: data.cuisine || undefined,
        dietaryType: data.dietaryType || undefined,
        servingUnit: data.servingUnit || undefined,
        servingSizeGrams: data.servingSizeGrams !== undefined ? Number(data.servingSizeGrams) : undefined,
        calories: data.calories !== undefined ? Number(data.calories) : undefined,
        protein: data.protein !== undefined ? Number(data.protein) : undefined,
        carbs: data.carbs !== undefined ? Number(data.carbs) : undefined,
        fat: data.fat !== undefined ? Number(data.fat) : undefined,
        fiber: data.fiber !== undefined ? Number(data.fiber) : undefined,
        isVerified: data.isVerified !== undefined ? Boolean(data.isVerified) : undefined,
      },
      include: { servings: true },
    });

    return updated;
  },

  async deleteCatalogueFood(foodId) {
    const existing = await prisma.foodItem.findUnique({
      where: { id: foodId },
    });

    if (!existing) {
      const error = new Error('Food item not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.foodItem.delete({
      where: { id: foodId },
    });

    return { message: 'Food item deleted from catalogue successfully.' };
  },

  /**
   * Broadcast Notifications Management (Admin Controlled)
   */
  async getBroadcastNotifications(onlyActive = false) {
    const content = await this.getSiteContent();
    let settings = {};
    try {
      settings = JSON.parse(content.settingsJson || '{}');
    } catch {
      settings = {};
    }

    let notifications = settings.broadcastNotifications;
    if (!Array.isArray(notifications)) {
      notifications = [
        {
          id: 'notif-welcome',
          title: 'Welcome to HAbyTAT Vitality Hub! 🌿',
          message: 'Configure your personal biometric profile and custom health targets to unlock tailored daily coaching.',
          type: 'tip',
          priority: 'normal',
          actionLink: '/profile',
          actionText: 'Set Vitality Goals',
          createdAt: new Date().toISOString(),
          active: true,
        },
        {
          id: 'notif-water',
          title: 'Metabolic Hydration Telemetry Active 💧',
          message: 'Track every glass of water seamlessly. Logging 2,500ml daily aids restorative sleep and muscle recovery.',
          type: 'announcement',
          priority: 'normal',
          actionLink: '/dashboard',
          actionText: 'View Water Card',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          active: true,
        },
        {
          id: 'notif-macro',
          title: 'Indian Regional Food Database Live 🍛',
          message: 'Access 95+ verified North, South, and pan-Indian recipes with precise macronutrient breakdowns.',
          type: 'challenge',
          priority: 'high',
          actionLink: '/nutrition',
          actionText: 'Explore Food Log',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          active: true,
        },
      ];
      settings.broadcastNotifications = notifications;
      await prisma.siteContent.update({
        where: { id: 'default' },
        data: { settingsJson: JSON.stringify(settings) },
      });
    }

    if (onlyActive) {
      return notifications.filter((n) => n.active);
    }
    return notifications;
  },

  async createBroadcastNotification(data) {
    const content = await this.getSiteContent();
    let settings = {};
    try {
      settings = JSON.parse(content.settingsJson || '{}');
    } catch {
      settings = {};
    }

    if (!Array.isArray(settings.broadcastNotifications)) {
      settings.broadcastNotifications = [];
    }

    const newNotification = {
      id: `notif-${Date.now()}`,
      title: data.title ? data.title.trim() : 'System Broadcast',
      message: data.message ? data.message.trim() : '',
      type: data.type || 'announcement',
      priority: data.priority || 'normal',
      actionLink: data.actionLink ? data.actionLink.trim() : '',
      actionText: data.actionText ? data.actionText.trim() : '',
      createdAt: new Date().toISOString(),
      active: data.active !== undefined ? Boolean(data.active) : true,
    };

    settings.broadcastNotifications.unshift(newNotification);

    await prisma.siteContent.update({
      where: { id: 'default' },
      data: { settingsJson: JSON.stringify(settings) },
    });

    return newNotification;
  },

  async updateBroadcastNotification(id, data) {
    const content = await this.getSiteContent();
    let settings = {};
    try {
      settings = JSON.parse(content.settingsJson || '{}');
    } catch {
      settings = {};
    }

    if (!Array.isArray(settings.broadcastNotifications)) {
      settings.broadcastNotifications = [];
    }

    const idx = settings.broadcastNotifications.findIndex((n) => n.id === id);
    if (idx === -1) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    const current = settings.broadcastNotifications[idx];
    settings.broadcastNotifications[idx] = {
      ...current,
      title: data.title !== undefined ? data.title.trim() : current.title,
      message: data.message !== undefined ? data.message.trim() : current.message,
      type: data.type || current.type,
      priority: data.priority || current.priority,
      actionLink: data.actionLink !== undefined ? data.actionLink.trim() : current.actionLink,
      actionText: data.actionText !== undefined ? data.actionText.trim() : current.actionText,
      active: data.active !== undefined ? Boolean(data.active) : current.active,
      updatedAt: new Date().toISOString(),
    };

    await prisma.siteContent.update({
      where: { id: 'default' },
      data: { settingsJson: JSON.stringify(settings) },
    });

    return settings.broadcastNotifications[idx];
  },

  async deleteBroadcastNotification(id) {
    const content = await this.getSiteContent();
    let settings = {};
    try {
      settings = JSON.parse(content.settingsJson || '{}');
    } catch {
      settings = {};
    }

    if (!Array.isArray(settings.broadcastNotifications)) {
      settings.broadcastNotifications = [];
    }

    settings.broadcastNotifications = settings.broadcastNotifications.filter((n) => n.id !== id);

    await prisma.siteContent.update({
      where: { id: 'default' },
      data: { settingsJson: JSON.stringify(settings) },
    });

    return { message: 'Broadcast notification deleted successfully' };
  },
};
