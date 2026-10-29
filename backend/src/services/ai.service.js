import prisma from '../config/prisma.js';
import { config } from '../config/index.js';

/**
 * Habytat AI Intelligence Service
 * Resolves doubts regarding Habits, Nutrition, and Fitness.
 * Powered by Gemini/OpenAI when API key is present, with a rich built-in Expert Knowledge Engine as an instant fallback.
 */

class AiService {
  /**
   * 1. Aggregate full user health & habit context from the database
   */
  async getUserContext(userId) {
    if (!userId) return null;

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Fetch active habits & completions
      const habits = await prisma.habit.findMany({
        where: { userId, isArchived: false },
        select: {
          id: true,
          name: true,
          category: true,
          frequency: true,
          targetCount: true,
          completions: {
            where: {
              completedDate: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              },
            },
            select: { completedDate: true },
          },
        },
      });

      const habitsSummary = habits.map((h) => ({
        name: h.name,
        category: h.category,
        frequency: h.frequency,
        completionsLast7Days: h.completions.length,
        completedToday: h.completions.some((c) => c.completedDate === todayStr),
      }));

      // 2. Fetch nutrition goals & today's food/water logs
      const goals = await prisma.nutritionGoal.findUnique({
        where: { userId },
      });

      const todayFoodLogs = await prisma.foodLog.findMany({
        where: { userId, logDate: todayStr },
      });

      const todayWaterLogs = await prisma.waterLog.findMany({
        where: { userId, logDate: todayStr },
      });

      const nutritionSummary = {
        goals: {
          dailyCalories: goals?.dailyCalories || 2000,
          proteinGrams: goals?.proteinGrams || 120,
          carbsGrams: goals?.carbsGrams || 220,
          fatGrams: goals?.fatGrams || 65,
          fiberGrams: goals?.fiberGrams || 30,
          waterTargetMl: goals?.waterTargetMl || 2500,
          fitnessGoal: goals?.fitnessGoal || 'maintenance',
          dietaryPreference: goals?.dietaryPreference || 'Veg',
          currentWeightKg: goals?.currentWeightKg || null,
          targetWeightKg: goals?.targetWeightKg || null,
        },
        today: {
          totalCalories: Math.round(todayFoodLogs.reduce((sum, f) => sum + (f.calories || 0), 0)),
          totalProtein: Math.round(todayFoodLogs.reduce((sum, f) => sum + (f.protein || 0), 0)),
          totalCarbs: Math.round(todayFoodLogs.reduce((sum, f) => sum + (f.carbs || 0), 0)),
          totalFat: Math.round(todayFoodLogs.reduce((sum, f) => sum + (f.fat || 0), 0)),
          totalWaterMl: todayWaterLogs.reduce((sum, w) => sum + (w.amountMl || 0), 0),
          itemsLoggedCount: todayFoodLogs.length,
        },
      };

      // 3. Fetch recent workouts
      const recentWorkouts = await prisma.workout.findMany({
        where: { userId },
        orderBy: { loggedDate: 'desc' },
        take: 5,
        select: {
          title: true,
          activityType: true,
          durationSeconds: true,
          caloriesBurned: true,
          loggedDate: true,
        },
      });

      return {
        habits: habitsSummary,
        nutrition: nutritionSummary,
        recentWorkouts,
        todayStr,
      };
    } catch (err) {
      console.warn('AiService.getUserContext error:', err.message);
      return null;
    }
  }

  /**
   * 2. Generate comprehensive response for user doubts
   */
  async generateAdvice({ userId, message, category = 'all', history = [], customApiKey = null }) {
    if (!message || !message.trim()) {
      const err = new Error('Message prompt is required');
      err.statusCode = 400;
      throw err;
    }

    const trimmedMsg = message.trim();
    const userContext = await this.getUserContext(userId);

    // 🛡️ Domain Scope Guardrail: Restrict queries strictly to Health, Food, Fitness, Nutrition, Habits, and Habytat
    const scopeCheck = this._checkDomainScope(trimmedMsg);
    if (!scopeCheck.isInScope) {
      return {
        reply: scopeCheck.refusalMessage,
        followUps: [
          'Analyze my current logged habits and stats',
          'What is the best 4-day workout split for fat loss?',
          'How can I get 120g protein on a vegetarian diet?',
          'How do I stop procrastinating on my daily habits?',
        ],
        category: 'scope_restriction',
        source: 'guardrail',
        contextSnapshot: userContext,
      };
    }

    // 1. Try Groq API (High-performance inference with OpenAI-compatible models)
    const groqKey = customApiKey?.startsWith('gsk_')
      ? customApiKey
      : process.env.GROQ_API_KEY || config.groqApiKey;

    if (groqKey) {
      try {
        const groqResponse = await this._callGroqApi({
          apiKey: groqKey,
          message: trimmedMsg,
          category,
          history,
          userContext,
        });
        if (groqResponse) {
          return {
            reply: groqResponse.reply,
            followUps: groqResponse.followUps || this._getDefaultFollowUps(category),
            category: groqResponse.category || category,
            source: 'groq (openai/gpt-oss-120b)',
            contextSnapshot: userContext,
          };
        }
      } catch (err) {
        console.warn('Groq API call failed, falling back to next provider:', err.message);
      }
    }

    // 2. Try Gemini API if key is available in environment or customApiKey
    const geminiKey = customApiKey?.startsWith('AIzaSy')
      ? customApiKey
      : process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const geminiResponse = await this._callGeminiApi({
          apiKey: geminiKey,
          message: trimmedMsg,
          category,
          history,
          userContext,
        });
        if (geminiResponse) {
          return {
            reply: geminiResponse.reply,
            followUps: geminiResponse.followUps || this._getDefaultFollowUps(category),
            category: geminiResponse.category || category,
            source: 'gemini',
            contextSnapshot: userContext,
          };
        }
      } catch (err) {
        console.warn('Gemini API call failed, using Expert Knowledge Engine fallback:', err.message);
      }
    }

    // 3. High quality built-in Expert Knowledge Engine fallback
    const expertResponse = this._runExpertKnowledgeEngine({
      message: trimmedMsg,
      category,
      userContext,
    });

    return {
      reply: expertResponse.reply,
      followUps: expertResponse.followUps,
      category: expertResponse.category || category,
      source: 'expert_engine',
      contextSnapshot: userContext,
    };
  }

  /**
   * Pre-flight Domain Scope Guardrail
   * Strictly restricts user questions to Health, Food, Fitness, Nutrition, Habits, and Habytat platform features.
   */
  _checkDomainScope(text) {
    const lower = text.toLowerCase().trim();

    // 1. In-Scope Domain Keywords (Health, Food, Fitness, Habits, Habytat)
    const inScopeKeywords = [
      'habit', 'habits', 'routine', 'routines', 'streak', 'streaks', 'discipline', 'procrastinat',
      'motivation', 'morning', 'evening', 'sleep', 'rest', 'dopamine', 'focus', 'atomic', 'trigger',
      'anchor', 'food', 'foods', 'diet', 'diets', 'nutrition', 'calorie', 'calories', 'kcal', 'macro',
      'macros', 'protein', 'proteins', 'carb', 'carbs', 'carbohydrate', 'fat', 'fats', 'fiber', 'fibers',
      'water', 'hydration', 'hydrate', 'eat', 'eating', 'eaten', 'meal', 'meals', 'snack', 'snacks',
      'sugar', 'craving', 'cravings', 'paneer', 'dal', 'soya', 'curd', 'yogurt', 'egg', 'eggs', 'chicken',
      'rice', 'roti', 'phulka', 'vegetar', 'vegan', 'fasting', 'deficit', 'surplus', 'tdee', 'bmr',
      'supplement', 'supplements', 'creatine', 'whey', 'breakfast', 'lunch', 'dinner', 'weigh', 'weight',
      'weigh-in', 'fat loss', 'muscle', 'muscles', 'bulk', 'bulking', 'cut', 'cutting', 'lean',
      'workout', 'workouts', 'fitness', 'exercise', 'exercises', 'gym', 'lift', 'lifting', 'cardio',
      'run', 'running', 'walk', 'walking', 'cycle', 'cycling', 'strength', 'hypertrophy', 'squat',
      'squats', 'bench', 'bench press', 'deadlift', 'deadlifts', 'rep', 'reps', 'set', 'sets',
      'split', 'splits', 'ppl', 'push pull legs', 'upper lower', 'hiit', 'stretch', 'stretching',
      'warmup', 'cooldown', 'injury', 'injuries', 'sore', 'soreness', 'doms', 'recovery', 'recover',
      'chest', 'back', 'leg', 'legs', 'arm', 'arms', 'shoulder', 'shoulders', 'bicep', 'biceps',
      'tricep', 'triceps', 'ab', 'abs', 'core', 'heart', 'pulse', 'health', 'healthy', 'wellness',
      'habytat', 'track', 'tracker', 'tracking', 'log', 'logs', 'audit', 'today', 'progress', 'stats'
    ];

    const hasInScopeWord = inScopeKeywords.some((kw) => lower.includes(kw));
    if (hasInScopeWord) {
      return { isInScope: true };
    }

    // 2. Out-of-Scope Patterns (Coding, Politics, Non-health Academic, Crypto/Finance, Pop Culture, Trivia)
    const outOfScopePatterns = [
      /\b(python|javascript|typescript|react|html|css|java|c\+\+|rust|golang|php|swift|kotlin)\b/i,
      /\b(write\s+code|debug|compile|syntax|sql\s+query|git\s+commit|docker|kubernetes|aws|api\s+endpoint)\b/i,
      /\b(function|algorithm|class\s+\w+|regex|npm\s+install|github|stack\s+overflow)\b/i,
      /\b(president|prime\s+minister|election|democrat|republican|parliament|congress|geopolitics|senate)\b/i,
      /\b(war\s+in|political|russia|ukraine|israel|palestine|treaty|biden|trump|modi)\b/i,
      /\b(solve\s+this|calculus|derivative|integral|algebra|trigonometry|matrix|equation)\b/i,
      /\b(write\s+an\s+essay|world\s+war|french\s+revolution|history\s+of|capital\s+of|who\s+invented)\b/i,
      /\b(bitcoin|crypto|ethereum|blockchain|stocks\s+to\s+buy|forex|real\s+estate|share\s+price|dividend)\b/i,
      /\b(movie\s+review|box\s+office|celebrity\s+gossip|actor\s+in|who\s+played|video\s+game|gta|playstation)\b/i
    ];

    const isExplicitlyOutOfScope = outOfScopePatterns.some((pattern) => pattern.test(lower));

    if (isExplicitlyOutOfScope || !hasInScopeWord) {
      return {
        isInScope: false,
        refusalMessage: `### 🛡️ Habytat Synapse Scope Restriction

I am **Habytat Synapse**, your autonomous Neural Health, Nutrition & Habit Intelligence. 

To deliver the highest standard of science-backed, personalized guidance, my scope is strictly limited to:
* 🥗 **Food, Diet & Nutrition**: Caloric budgeting, macronutrients, high-protein meal planning, and craving mitigation.
* 🏋️ **Fitness & Workouts**: Progressive overload, workout split programming (PPL / Upper-Lower), exercise execution, and recovery protocols.
* 🧠 **Habits & Discipline**: Atomic habit stacking, streak preservation, the 2-minute rule, and overcoming procrastination.
* 📊 **Habytat Diagnostics**: Real-time analysis of your logged habits, daily calories, water hydration, and workout sessions.

> **I cannot answer queries outside these domains** (such as coding, general trivia, politics, academic essays, finance, or entertainment).

#### Recommended Topics You Can Ask:
1. *"Analyze my current logged habits and stats"*
2. *"What is the best 4-day workout split for fat loss?"*
3. *"How can I reach 120g protein on an Indian vegetarian diet?"*
4. *"How do I bounce back after breaking a 10-day habit streak?"*`,
      };
    }

    return { isInScope: true };
  }

  /**
   * Helper: Construct the Unified System Prompt with Strict Domain Boundaries & Sorting Requirements
   */
  _buildSystemPrompt(userContext) {
    return `You are Habytat Synapse, an elite autonomous Neural Health, Nutrition & Habit Architect specializing in:
1. Habits & Behavioral Psychology (Atomic habits, streak psychology, cues, routines, habit stacking, relapse recovery).
2. Nutrition & Diet (Caloric balance, macronutrients, Indian vegetarian and non-vegetarian food swaps, hydration, pre/post workout nutrition, managing cravings).
3. Fitness & Exercise Science (Progressive overload, workout splits, resistance training, cardio, hypertrophy, form cues, recovery, and injury prevention).

### STRICT DOMAIN RESTRICTION (MANDATORY):
You MUST strictly refuse to answer any questions that do not relate to physical health, food, nutrition, fitness, exercise science, daily habits, sleep, recovery, or Habytat platform features.
If the user asks an off-topic question (such as coding, programming, mathematics, politics, history, general trivia, finances, movies, etc.), politely refuse:
"I am Habytat Synapse, your dedicated Health, Fitness & Habit Intelligence. I can only assist with questions related to your nutrition, workouts, daily habits, and health goals."
Do NOT answer off-topic queries under any circumstances.

### DATA FORMATTING & SORTING RULES (MANDATORY):
1. CLEAR STRUCTURE: Organize answers with clear Markdown H3 section titles (### ...).
2. CHRONOLOGICAL & SEQUENTIAL SORTING:
   - When providing a daily meal plan or nutrition schedule, sort strictly by time of day (Breakfast -> Mid-Morning -> Lunch -> Evening Snack -> Dinner).
   - When providing workout routines, sort in exercise execution sequence (1. Dynamic Warm-up -> 2. Primary Compound Lifts -> 3. Secondary Hypertrophy / Accessories -> 4. Core & Cooldown).
   - When listing food recommendations, sort in descending order of protein/nutrient density (highest to lowest).
   - When providing habit steps, sort by ease of execution (2-minute atomic start -> anchor habit stacking -> environment design).
3. CLEAN MARKDOWN TABLES: Format workout splits, meal schedules, and macro distributions into clean, aligned Markdown tables (| Day / Meal | Focus / Food | Details / Macros |).
4. BOLD METRICS: Bold all numbers, weights, and measurements (e.g. **120g protein**, **2,000 kcal**, **3 sets x 8-10 reps**, **2.5L water**).
5. ACTIONABLE TAKEAWAY: Conclude every single answer with an explicit, single-action blockquote:
   > **Actionable Next Step**: [One specific, immediate step the user can execute today]

${
  userContext
    ? `User Health Context:
- Active Habits: ${JSON.stringify(userContext.habits)}
- Today's Nutrition Progress: ${userContext.nutrition?.today?.totalCalories} kcal consumed / ${userContext.nutrition?.goals?.dailyCalories} kcal target. Protein: ${userContext.nutrition?.today?.totalProtein}g / ${userContext.nutrition?.goals?.proteinGrams}g target. Water: ${userContext.nutrition?.today?.totalWaterMl}ml.
- Fitness Goal: ${userContext.nutrition?.goals?.fitnessGoal || 'Maintenance'}. Dietary Preference: ${userContext.nutrition?.goals?.dietaryPreference || 'Veg'}.
- Recent Workouts: ${JSON.stringify(userContext.recentWorkouts)}`
    : 'No personalized user context available.'
}`;
  }

  /**
   * 3. Call Groq API (openai/gpt-oss-120b, qwen/qwen3.8-27b)
   */
  async _callGroqApi({ apiKey, message, category, history = [], userContext }) {
    const systemPrompt = this._buildSystemPrompt(userContext);

    const messages = [{ role: 'system', content: systemPrompt }];

    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-6)) {
        if (turn.role === 'user' || turn.role === 'assistant') {
          messages.push({ role: turn.role, content: turn.content });
        }
      }
    }

    messages.push({ role: 'user', content: message });

    // Candidate models on Groq
    const candidateModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.6,
            max_tokens: 1200,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Groq API (${model}) failed with ${res.status}: ${errBody}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return {
            reply: content,
            followUps: this._generateFollowUpsFromText(content, category),
            category,
          };
        }
      } catch (err) {
        lastError = err;
        console.warn(`Groq attempt with ${model} failed, trying next candidate:`, err.message);
      }
    }

    throw lastError || new Error('All Groq candidate models failed');
  }

  /**
   * 3. Call Google Gemini API with system prompt & context
   */
  async _callGeminiApi({ apiKey, message, category, history = [], userContext }) {
    const systemPrompt = this._buildSystemPrompt(userContext);

    const contents = [];

    // Add previous history context if available
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-6)) {
        if (turn.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: turn.content }] });
        } else if (turn.role === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: turn.content }] });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
    });

    // Call Gemini 1.5 Flash endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}`);
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) {
      throw new Error('No candidate returned by Gemini');
    }

    return {
      reply: candidate,
      followUps: this._generateFollowUpsFromText(candidate, category),
      category,
    };
  }

  /**
   * 4. Built-in Expert Knowledge Engine (Covers deep domain rules for Habits, Nutrition, and Fitness)
   */
  _runExpertKnowledgeEngine({ message, category, userContext }) {
    const text = message.toLowerCase();

    // ----------------------------------------------------
    // Context-Aware Personal Progress Analysis
    // ----------------------------------------------------
    if (
      text.includes('how am i doing') ||
      text.includes('analyze my') ||
      text.includes('review my progress') ||
      text.includes('summary of today') ||
      text.includes('my stats')
    ) {
      return this._generatePersonalizedAudit(userContext);
    }

    // ----------------------------------------------------
    // A. HABITS & BEHAVIORAL PSYCHOLOGY
    // ----------------------------------------------------
    if (
      text.includes('streak') ||
      text.includes('missed') ||
      text.includes('broke my habit') ||
      text.includes('restart') ||
      text.includes('get back on track')
    ) {
      return {
        category: 'habits',
        reply: `### 🔁 The "Never Miss Twice" Protocol for Rebuilding Momentum

Breaking a streak is part of building lasting habits—it is **never** a sign of failure. Research by behavioral scientists shows that missing a single day has virtually zero impact on long-term habit formation, *provided you don't miss the second day*.

Here is your 3-step reboot system:

1. **Shrink the Entry Barrier (The 2-Minute Rule)**
   - Don't try to make up for lost time by doing double work.
   - Scale the habit down to an effortless version: instead of a 45-minute workout, do **5 minutes of stretching** or 10 pushups. The goal is to reaffirm the identity: *"I am someone who doesn't miss twice."*

2. **Anchor with Habit Stacking**
   - Connect the habit to an established daily anchor:
     > *"After I pour my morning coffee / brush my teeth, I will immediately do [My Habit] for 2 minutes."*

3. **Eliminate Friction at the Cue Level**
   - Place workout shoes in plain sight, keep your water bottle on your desk, or lay out your book on the pillow.
   - When the cue is frictionless, willpower is not required.

> **Next Action**: Pick your most important habit right now and execute a tiny 2-minute version before your day ends.`,
        followUps: [
          'How do I use habit stacking effectively?',
          'What is the 2-minute rule in practice?',
          'How to stop procrastination on big goals?',
        ],
      };
    }

    if (
      text.includes('procrastinat') ||
      text.includes('lazy') ||
      text.includes('no motivation') ||
      text.includes('feel unmotivated') ||
      text.includes('consistency')
    ) {
      return {
        category: 'habits',
        reply: `### 🧠 Overcoming Procrastination: Action Precedes Motivation

The common belief is that motivation leads to action. In reality, **action creates motivation** via dopamine feedback loops.

Here is how high-performers maintain consistency when motivation drops to zero:

* **Lower the "Activation Energy"**:
  - The brain resists the perceived emotional weight of a task, not the task itself. Commit to just **120 seconds**. Tell yourself: *"I will open the document / put on my gym shoes for 2 minutes. If I still want to stop, I can."* 90% of the time, inertia takes over.
* **Remove Decision Fatigue**:
  - Pre-decide the exact **time, location, and micro-step** the night before. Ambiguity breeds hesitation.
* **Focus on Identity, Not Goals**:
  - Rather than *"I have to run 5km today,"* frame it as: *"I am becoming a healthy, athletic person."* Each small repetition is a vote for your new identity.

> **Action Tip**: What is the single smallest step you can take in the next 60 seconds? Do just that one step right now.`,
        followUps: [
          'How to design an effective morning routine?',
          'How many days does it really take to form a habit?',
          'How to build self-discipline without burnout?',
        ],
      };
    }

    // ----------------------------------------------------
    // B. NUTRITION & DIET
    // ----------------------------------------------------
    if (
      text.includes('protein') ||
      text.includes('veg protein') ||
      text.includes('vegetarian') ||
      text.includes('paneer') ||
      text.includes('soya') ||
      text.includes('100g protein') ||
      text.includes('120g protein')
    ) {
      return {
        category: 'nutrition',
        reply: `### 🥗 High-Protein Indian Vegetarian Guide (Sorted by Protein Density)

| Food Staple | Standard Serving | Protein Yield | Calories | Best Meal Timing |
| :--- | :--- | :--- | :--- | :--- |
| **Soya Chunks** | 50g (dry raw) | **26g protein** | ~175 kcal | Lunch or Dinner Curry |
| **Whey / Plant Isolate** | 1 scoop (33g) | **25g protein** | ~125 kcal | Post-Workout / Morning Shake |
| **Low-Fat Paneer** | 100g raw | **20g protein** | ~200 kcal | Paneer Bhurji / Tikka |
| **Whole Eggs + Whites** | 2 Whole + 2 Whites | **18g protein** | ~180 kcal | Breakfast Scramble (if eggetarian) |
| **Greek Yogurt / Hung Curd** | 150g | **15g protein** | ~110 kcal | Evening Snack with Chia / Berries |
| **Sprouted Moong / Chana** | 1 katori (100g) | **9g protein** | ~130 kcal | Pre-Lunch Chaat / Salad |
| **Dal Tadka / Rajma** | 1 katori cooked | **7g–9g protein** | ~140 kcal | Paired with Phulka or Brown Rice |

#### Chronological 120g Daily Meal Schedule:
1. **Breakfast (8:30 AM)**: 3-Egg Omelet OR Moong Dal Chilla stuffed with 50g Paneer (**24g protein**)
2. **Lunch (1:00 PM)**: 1.5 katori Dal Tadka + 100g Curd + 2 Phulkas + Green Salad (**22g protein**)
3. **Evening Snack (5:00 PM)**: 1 scoop Whey Protein in chilled water + 15g roasted almonds (**27g protein**)
4. **Dinner (8:30 PM)**: 50g Soya Chunks curry + 1 katori steamed rice or 2 rotis (**32g protein**)
5. **Pre-Bed Wind-Down (10:30 PM)**: 150g Greek yogurt or warm spiced skim milk (**15g protein**)

> **Actionable Next Step**: Add 50g of soya chunks or 1 scoop of whey to your grocery list today—incorporating either one immediately closes any 25g protein gap.`,
        followUps: [
          'Is soya chunks safe to eat daily?',
          'What is the best pre-workout meal for energy?',
          'How to calculate my exact daily calorie deficit?',
        ],
      };
    }

    if (
      text.includes('calorie deficit') ||
      text.includes('weight loss') ||
      text.includes('fat loss') ||
      text.includes('burn fat') ||
      text.includes('lose belly fat')
    ) {
      return {
        category: 'nutrition',
        reply: `### 🔥 The Science of Sustainable Fat Loss & Caloric Deficits

Spot reduction (losing fat only from your belly or face) is physiologically impossible. Fat loss occurs systematically when your body operates in an **energy deficit**.

#### 1. Calculating Your Sweet Spot:
* **Moderate Deficit**: 350 to 500 kcal below your Total Daily Energy Expenditure (TDEE).
* **Target Rate**: Aim to lose **0.5% to 1.0% of your body weight per week** (typically 0.4kg to 0.8kg). Faster loss usually strips metabolically active lean muscle.

#### 2. The 3 Non-Negotiable Pillars of Fat Loss:
1. **High Protein Intake (1.6g–2.0g per kg body weight)**:
   - Protects your muscle tissue while in a deficit.
   - Has the highest Thermic Effect of Food (TEF)—burning 20–30% of its calories simply through digestion.
2. **High Dietary Fiber & Water**:
   - Eat 30g+ fiber daily (vegetables, salads, oats, lentils) to keep satiety hormones (GLP-1, PYY) high.
   - Drink 2.5L–3.5L of water daily to prevent dehydration-induced false hunger.
3. **Resistance Training**:
   - Lifting weights signals to your body that muscle is essential, forcing it to burn adipose fat for fuel instead.

> **Key Rule**: Track your cooking oil! 1 tablespoon of cooking oil has ~120 kcal. Measuring your cooking oil is the single easiest way to trim 250 hidden calories without reducing food volume.`,
        followUps: [
          'How to handle late night food cravings?',
          'What are the best low-calorie snack swaps?',
          'How does sleep affect fat loss hormones?',
        ],
      };
    }

    if (
      text.includes('sugar') ||
      text.includes('craving') ||
      text.includes('late night') ||
      text.includes('snack') ||
      text.includes('sweet') ||
      text.includes('cheat meal')
    ) {
      return {
        category: 'nutrition',
        reply: `### 🍪 Crushing Sugar Cravings & Emotional Snacking

Cravings are neurochemical signals driven by blood sugar drops, stress (cortisol), or habit loops—not a lack of willpower.

#### Tactical Intervention:
1. **The "Wait 15 Minutes & Drink Water" Rule**:
   - Dehydration frequently mimics carbohydrate cravings. Drink a large glass of chilled water or herbal tea and wait 15 minutes. In 80% of cases, the craving dissipates.
2. **Inspect Your Meal Composition**:
   - If you crave sugar 1 hour after lunch or dinner, your meal had too high of a glycemic spike (e.g. refined flour/white rice without enough protein and fiber).
   - Add **crunchy fiber** (cucumbers, carrots) and protein to slow gastric emptying.
3. **Smart Sweet Swaps**:
   - Cold Greek yogurt with a drizzle of honey and cinnamon.
   - Frozen grapes or berries.
   - 1 square of 70%+ dark chocolate slowly melted on your tongue.

> **Mindset**: A cheat meal does not ruin a week of progress. One meal is ~600–900 kcal. Do not punish yourself with extreme fasting the next day—simply resume your regular balanced plan immediately.`,
        followUps: [
          'How to calculate my protein target for fat loss?',
          'How much water should I drink during workouts?',
          'What are good pre-bed snacks for sleep and muscle repair?',
        ],
      };
    }

    // ----------------------------------------------------
    // C. FITNESS, WORKOUTS & TRAINING
    // ----------------------------------------------------
    if (
      text.includes('split') ||
      text.includes('workout routine') ||
      text.includes('ppl') ||
      text.includes('upper lower') ||
      text.includes('3 days') ||
      text.includes('4 days') ||
      text.includes('5 days')
    ) {
      return {
        category: 'fitness',
        reply: `### 🏋️ 4-Day Upper / Lower Workout Split (Sorted Chronologically)

| Training Day | Focus Area | Primary Compound Lifts (Strength) | Secondary Hypertrophy (Muscle) | Cooldown & Core |
| :--- | :--- | :--- | :--- | :--- |
| **Monday** | **Upper Body A** | Barbell Bench Press (3×6–8), Barbell Row (3×6–8) | Dumbbell Shoulder Press (3×10), Lat Pulldown (3×10) | Face Pulls (3×15), Plank (3×45s) |
| **Tuesday** | **Lower Body A** | Barbell Back Squat (3×6–8), Romanian Deadlift (3×8–10) | Bulgarian Split Squats (3×10/leg), Standing Calf Raises (4×12) | Hanging Knee Raises (3×12) |
| **Wednesday** | **Active Recovery** | None (Rest & Tissue Repair) | 20–30 min Zone 2 Walk (6,000–8,000 steps) | Dynamic Hip Stretches |
| **Thursday** | **Upper Body B** | Incline Dumbbell Press (3×8–10), Pull-ups / Chin-ups (3×6–8) | Cable Chest Fly (3×12), Seated Cable Row (3×12), Bicep/Tricep (3×12) | Ab Wheel Rollouts (3×12) |
| **Friday** | **Lower Body B** | Conventional Deadlift (3×5), Leg Press (3×10–12) | Hamstring Leg Curls (3×12), Leg Extensions (3×12), Seated Calf Raises (3×15) | Dead Hang (3×60s) |
| **Sat – Sun** | **Full Recovery** | Rest & Nervous System Reset | Light walking, hydration, 8 hours sleep | Nutrition prep for the week |

#### Weekly Training Hierarchy:
1. **Compound Multi-Joint Exercises First**: Perform heavy squats, deadlifts, and presses when neuromuscular energy is highest.
2. **Accessory Volume Second**: Isolate smaller muscle groups (delts, arms, calves) with moderate loads (8–15 rep range).
3. **Recovery & Sleep Third**: Muscle proteins are rebuilt during sleep, not in the gym.

> **Actionable Next Step**: Commit to **Monday Upper Body A** as your anchor workout. Log your sets and weights in the [Workouts Studio](/workouts) to track progressive overload.`,
        followUps: [
          'What is progressive overload and how do I apply it?',
          'Should I do cardio before or after lifting weights?',
          'How long should I rest between sets?',
        ],
      };
    }

    if (
      text.includes('sore') ||
      text.includes('doms') ||
      text.includes('recovery') ||
      text.includes('rest day') ||
      text.includes('injury') ||
      text.includes('hurts')
    ) {
      return {
        category: 'fitness',
        reply: `### 🔋 Muscle Soreness (DOMS) vs. Injury & Recovery Protocol

Delayed Onset Muscle Soreness (DOMS) peaks 24 to 48 hours after introducing new exercises or intense training volumes.

#### Soreness vs. Injury Checklist:
* **Healthy Soreness**: Diffuse dull ache across the entire muscle belly, feels better after a warm-up, symmetrical.
* **Warning Sign (Injury)**: Sharp, stabbing pain, localized directly at a joint/tendon, persists at rest or worsens during movement. *If sharp pain is present, stop the movement and consult a medical professional.*

#### Accelerating Recovery:
1. **Active Recovery**: A 20-minute brisk walk or light cycling boosts blood circulation to deliver amino acids and clear metabolic byproducts.
2. **Sleep Hygiene**: 7–9 hours of quality sleep is where 95% of Growth Hormone (GH) release and muscle repair occurs.
3. **Protein & Hydration**: Maintain your daily protein target (1.6g/kg) and replenish lost electrolytes (Sodium, Potassium, Magnesium).
4. **Contrast Showers or Light Foam Rolling**: Helps alleviate myofascial tightness and promotes neural relaxation.

> **Takeaway**: If your legs are sore, it is completely fine to train upper body today! Keep the momentum alive.`,
        followUps: [
          'How much sleep is needed for muscle growth?',
          'Should I stretch before or after workouts?',
          'What is the ideal rest time between sets for strength?',
        ],
      };
    }

    if (
      text.includes('cardio') ||
      text.includes('running') ||
      text.includes('weight training') ||
      text.includes('weights vs cardio') ||
      text.includes('hiit')
    ) {
      return {
        category: 'fitness',
        reply: `### 🏃 Cardio vs. Resistance Training: The Synergy Playbook

You do not have to choose between cardio and lifting weights. In fact, combining both creates the best metabolic and cardiovascular health profile.

#### 1. The Interference Effect Myth:
* Moderate cardio will **not** burn away your muscle mass as long as you eat adequate calories and protein.
* Cardio improves your heart's stroke volume, meaning you recover **faster** between heavy lifting sets!

#### 2. How to Sequence Them:
* **Primary Goal = Muscle & Strength**: Lift weights first while glycogen stores and central nervous system are fresh. Do 15–20 minutes of moderate cardio afterwards.
* **Primary Goal = Endurance / 5k Run**: Do your run first, and perform light/supportive strength work afterwards.

#### 3. Low-Impact Zone 2 Cardio (The Secret Weapon):
* 30–45 minutes of steady-state brisk walking or light jogging at a conversational pace (Heart Rate ~60–70% of max).
* Trains mitochondrial density, burns predominantly fat for fuel, and induces zero recovery stress on your joints.`,
        followUps: [
          'How to calculate my Zone 2 heart rate?',
          'How many days a week should I lift weights?',
          'What should I eat 1 hour before a run?',
        ],
      };
    }

    // ----------------------------------------------------
    // D. GENERAL / HOLISTIC LIFESTYLE
    // ----------------------------------------------------
    return {
      category: category !== 'all' ? category : 'holistic',
      reply: `### 🌟 Habytat Holistic Coach Advice

Great question! In the Habytat ecosystem, lasting transformation relies on the harmony between **Daily Habits**, **Nourishing Nutrition**, and **Active Movement**:

1. **Habits Drive the System**: Small, non-negotiable daily habits (e.g. tracking your water, filling your meal diary, moving for 20 minutes) build the identity of consistency.
2. **Nutrition Fuels the Engine**: Fueling with adequate protein (1.6g/kg), keeping a sensible energy budget, and drinking 2.5L+ of water creates sustained energy without afternoon crashes.
3. **Movement Strengthens the Body**: Progressive resistance training combined with daily steps (8,000–10,000 steps) accelerates metabolic rate and mental clarity.

Here are a few quick ways I can assist you right now:
* 🥗 **Ask about meal swaps or macro targets** (e.g., *"How to hit 120g protein on a veg diet?"*)
* 🧠 **Ask about habit consistency** (e.g., *"How to recover from a broken streak?"*)
* 🏋️ **Ask about workout programming** (e.g., *"What is the best 4-day workout split?"*)
* 📊 **Ask for a progress audit** (e.g., *"How am I doing today based on my logs?"*)`,
      followUps: [
        'Analyze my current logged habits and stats',
        'What are the best vegetarian protein sources?',
        'How to recover from a broken habit streak?',
        'How do I overcome workout procrastination?',
      ],
    };
  }

  /**
   * Helper: Generate a real data-driven personalized audit based on user's database records
   */
  _generatePersonalizedAudit(userContext) {
    if (!userContext) {
      return {
        category: 'holistic',
        reply: `### 📊 Your Habytat Progress Audit

You don't have any recorded habits, meals, or workouts in your profile yet today! 

To get personalized AI guidance:
1. **Habits**: Add your top daily priorities in [All Habits](/habits).
2. **Nutrition**: Log today's meals and water intake in [Nutrition Studio](/nutrition).
3. **Workouts**: Track a training session in [Workouts](/workouts).

Once logged, I can analyze your exact energy balance, macronutrient distribution, and streak momentum!`,
        followUps: [
          'How should I set up my first 3 habits?',
          'What calorie target should I aim for?',
          'How to start a simple beginner workout routine?',
        ],
      };
    }

    const { habits = [], nutrition, recentWorkouts = [] } = userContext;
    const completedHabitsCount = habits.filter((h) => h.completedToday).length;
    const totalHabitsCount = habits.length;
    const calsEaten = nutrition?.today?.totalCalories || 0;
    const calsGoal = nutrition?.goals?.dailyCalories || 2000;
    const proteinEaten = nutrition?.today?.totalProtein || 0;
    const proteinGoal = nutrition?.goals?.proteinGrams || 120;
    const waterLogged = nutrition?.today?.totalWaterMl || 0;
    const waterGoal = nutrition?.goals?.waterTargetMl || 2500;

    const habitPct = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;
    const calPct = Math.round((calsEaten / calsGoal) * 100);
    const proteinPct = Math.round((proteinEaten / proteinGoal) * 100);
    const waterPct = Math.round((waterLogged / waterGoal) * 100);

    return {
      category: 'holistic',
      reply: `### 📊 Personalized Daily Health & Habit Audit

Here is your live diagnostic across your active Habytat trackers:

#### 1. 🧠 Habits & Discipline (${habitPct}% Complete)
* **Completed Today**: **${completedHabitsCount} of ${totalHabitsCount}** habits checked off.
${
  habits.length > 0
    ? habits.map((h) => `  - ${h.completedToday ? '✅' : '⏳'} **${h.name}** (${h.completionsLast7Days}/7 days this week)`).join('\n')
    : '  - *No active habits set up yet.*'
}

#### 2. 🥗 Nutrition & Energy Balance (${calPct}% of Target)
* **Calories**: **${calsEaten} kcal** eaten of your **${calsGoal} kcal** target (${Math.max(0, calsGoal - calsEaten)} kcal remaining).
* **Protein**: **${proteinEaten}g** of **${proteinGoal}g** target (${proteinPct}% achieved).
* **Hydration**: **${waterLogged} ml** of **${waterGoal} ml** goal (${waterPct}% hydrated).

#### 3. 🏋️ Fitness & Movement
* **Recent Activity**: ${
        recentWorkouts.length > 0
          ? `${recentWorkouts[0].activityType} (${Math.round(recentWorkouts[0].durationSeconds / 60)} min, ~${recentWorkouts[0].caloriesBurned} kcal burned on ${recentWorkouts[0].loggedDate})`
          : 'No workouts recorded yet this week.'
      }

---
#### 🎯 AI Coach Recommendation for Today:
${
  proteinPct < 70
    ? `> **Protein Priority**: You still need **${Math.max(0, proteinGoal - proteinEaten)}g of protein** today. Consider having a scoop of whey, 100g paneer, 40g soya chunks, or Greek yogurt with your next meal.`
    : `> **Great Nutrition**: Your protein intake is right on target (${proteinEaten}g)! Keep up the steady fuel.`
}
${
  waterPct < 60
    ? `> **Hydration Alert**: You have logged **${waterLogged}ml** of water. Drink 2 full glasses (500ml) right now to prevent fatigue.`
    : `> **Hydration**: Excellent hydration momentum today (${waterLogged}ml)!`
}
${
  completedHabitsCount < totalHabitsCount
    ? `> **Habits Finish Line**: You have ${totalHabitsCount - completedHabitsCount} habits remaining today. Complete the easiest one in the next 10 minutes to maintain your momentum.`
    : `> **Habit Mastery**: 100% of your daily habits are completed today! Outstanding discipline.`
}`,
      followUps: [
        'How do I bridge my remaining protein deficit today?',
        'Suggest a quick 15-minute workout I can do today',
        'How can I prepare for tomorrow to start with high momentum?',
      ],
    };
  }

  /**
   * Helper: Generate follow-up prompts from text
   */
  _generateFollowUpsFromText(text, category) {
    if (category === 'nutrition') {
      return [
        'How to calculate my exact calorie budget?',
        'What are high-protein snacks for vegetarians?',
        'How much water should I drink on workout days?',
      ];
    }
    if (category === 'fitness') {
      return [
        'How do I avoid plateaus in my lifts?',
        'What is the best post-workout recovery meal?',
        'How many rest days should I take each week?',
      ];
    }
    if (category === 'habits') {
      return [
        'How to build an unbreakable morning routine?',
        'How does habit tracking increase dopamine?',
        'What to do when my routine gets disrupted by travel?',
      ];
    }
    return [
      'Analyze my current logged habits and stats',
      'What are the best vegetarian protein sources?',
      'How to recover from a broken habit streak?',
    ];
  }

  _getDefaultFollowUps(category) {
    return this._generateFollowUpsFromText('', category);
  }

  /**
   * 5. Get curated quick advice cards for instant 1-tap reading
   */
  getQuickAdviceCards() {
    return [
      {
        id: 'h1',
        category: 'habits',
        title: 'The 2-Minute Rule',
        snippet: 'Scale down any habit so it takes under 2 minutes to start. Friction vanishes.',
        fullText: 'When starting a new habit, it should take less than two minutes to do. Instead of "read 30 pages", make it "read 1 page". Once you begin, continuing is easy.',
      },
      {
        id: 'n1',
        category: 'nutrition',
        title: 'Protein Leverage Theory',
        snippet: 'The human body naturally craves food until its protein requirements are met.',
        fullText: 'Prioritize protein at breakfast (25g–35g). Clinical trials show starting with high protein suppresses ghrelin (hunger hormone) for up to 6 hours.',
      },
      {
        id: 'f1',
        category: 'fitness',
        title: 'Progressive Overload Blueprint',
        snippet: 'Muscle only grows when given a stimulus greater than it previously adapted to.',
        fullText: 'Aim to add 1 rep, 1 kg of weight, or improve execution form on your core compound lifts each week. Small incremental gains compound exponentially.',
      },
      {
        id: 'h2',
        category: 'habits',
        title: 'Never Miss Twice',
        snippet: 'One missed day is an accident. Two missed days is the start of a new habit.',
        fullText: 'If you miss a day due to an unexpected emergency, prioritize an abbreviated version the very next day. Protecting your identity is what keeps streaks alive.',
      },
    ];
  }
}

export const aiService = new AiService();
