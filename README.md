# HabitPulse — Production-Ready Full-Stack Habit Tracker

A modern, production-grade SaaS Habit Tracking application built with React, Vite, Node.js, Express, PostgreSQL, Prisma ORM, and Tailwind CSS.

---

## 🌟 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios, Framer Motion
- **Backend:** Node.js, Express.js, JWT, bcryptjs, Zod, Helmet, CORS, Express-Rate-Limit, Morgan
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Architecture:** Layered (Routes → Controllers → Services → Prisma → PostgreSQL)

---

## 📁 Project Structure

```text
habit-tracker/
│
├── frontend/
│   ├── src/
│   │   ├── assets/           # Static assets, SVG icons
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React context providers (Auth, Theme)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Application layouts (DashboardLayout, AuthLayout)
│   │   ├── pages/            # Page views (Dashboard, Habits, Calendar, Analytics)
│   │   ├── services/         # Axios API clients
│   │   ├── utils/            # Helper utilities and formatters
│   │   ├── App.jsx           # Main App component
│   │   ├── main.jsx          # Application entry point
│   │   └── index.css         # Tailwind & global stylesheet
│   │
│   ├── index.html            # HTML shell with Inter typography
│   ├── tailwind.config.js    # Tailwind configuration with dark mode
│   ├── postcss.config.js     # PostCSS configuration
│   ├── vite.config.js        # Vite dev server configuration
│   ├── package.json          # Frontend dependencies and scripts
│   └── .env.example          # Frontend environment template
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # Prisma data models & PostgreSQL indexes
│   │   └── seed.js           # Seed data (Demo user, habits, completions)
│   │
│   ├── src/
│   │   ├── config/           # Environment config & Prisma client singleton
│   │   ├── controllers/      # Request handlers & HTTP responses
│   │   ├── middleware/       # Auth, error handling, rate limiting
│   │   ├── routes/           # Express route definitions
│   │   ├── services/         # Core business logic & database queries
│   │   ├── utils/            # Standard response helpers, streak math
│   │   ├── validators/       # Zod schemas for input validation
│   │   ├── app.js            # Express application setup
│   │   └── server.js         # HTTP server and graceful shutdown
│   │
│   ├── package.json          # Backend dependencies and scripts
│   ├── .env.example          # Backend environment template
│   └── .env                  # Local backend environment
│
├── .gitignore
├── .env.example              # Root environment template
├── package.json              # Monorepo/workspace scripts
└── README.md                 # Project documentation
```

---

## 🚀 Phase 1 Setup & Verification

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Run Development Servers
- Backend:
  ```bash
  cd backend
  npm run dev
  ```
- Frontend:
  ```bash
  cd frontend
  npm run dev
  ```

---

## 🏥 Health Check Endpoint

- URL: `http://localhost:5000/api/health`
- Method: `GET`
- Sample Output:
  ```json
  {
    "status": "OK",
    "database": "connected",
    "timestamp": "2026-10-01T09:35:00.000Z",
    "uptime": 12.34
  }
  ```

---

## 🥗 Advanced Indian Calorie & Nutrition Tracker Integration

HAByTAT includes a production-grade Indian Calorie and Nutrition Tracker integrated directly with the habit ecosystem.

### Features
1. **Curated Indian Food Catalogue:**
   - 95+ verified Indian dishes and cooking staples with ICMR-NIN IFCT 2017 nutritional reference data.
   - Covers South Indian, North Indian, Andhra/Telangana, Bengali, Street Food, and high-protein items.
   - Exact household portion conversions: pieces, katoris (150g), cups (200g), tablespoons (15g), slices, etc.
   - Dietary classification filters: Veg, Non-Veg, Egg, Vegan.
2. **Daily Meal Diary:**
   - 5 meal categories: Breakfast, Morning Snack, Lunch, Evening Snack, Dinner, and Custom.
   - Live circular radial calorie gauge (Consumed vs. Configured Goal vs. Remaining Budget).
   - Macronutrient progress bars (Protein, Carbohydrates, Healthy Fats, Dietary Fiber).
   - Food logging actions: add, edit portions, duplicate items between meals, and delete.
3. **Homemade Indian Recipe Calculator:**
   - Batch ingredient builder calculating raw vs. cooked recipe nutrition.
   - Automatic per-serving calorie and macronutrient breakdown.
   - Direct logging of recipe servings into the daily diary.
4. **Personalized Goals & Mifflin-St Jeor TDEE Engine:**
   - Scientific TDEE estimation based on age, gender, height, current weight, activity level, and fitness goals (weight loss, maintenance, muscle gain).
   - Custom overrides for daily calories, protein, carbs, fat, fiber, and water targets.
5. **Integrated Hydration & Weight Tracking:**
   - Quick +250ml glass water logging with visual daily target progress.
   - Historical bodyweight tracking with date-bound weigh-in records.
6. **Analytics & Trends:**
   - 7-day and 14-day Recharts calorie intake vs. target bar charts.
   - Macronutrient split and daily food-logging consistency scoring.
7. **AI-Assisted Natural Language Food Logging:**
   - Natural language parser (`/api/nutrition/ai-parse`) converting spoken or written sentences (e.g., *"I ate 2 dosas with coconut chutney and 1 cup sambar"*) into structured database-matched items with portion estimates ready for one-click confirmation.

### Nutrition API Endpoints
- `GET /api/nutrition/foods` — Search food catalogue by name, regional transliteration, category, cuisine, or dietary preference.
- `GET /api/nutrition/foods/favorites` — Retrieve user's bookmarked favorite dishes.
- `POST /api/nutrition/foods/:foodItemId/favorite` — Toggle food favorite bookmark.
- `POST /api/nutrition/foods/custom` — Create user-specific custom food item.
- `GET /api/nutrition/logs?date=YYYY-MM-DD` — Daily diary summary with meal subtotals, day totals, goals, water, and weight.
- `POST /api/nutrition/logs` — Log food or recipe serving with server-authoritative nutrient calculations.
- `PUT /api/nutrition/logs/:id` — Update quantity or portion unit of a logged food.
- `DELETE /api/nutrition/logs/:id` — Delete a logged food entry.
- `POST /api/nutrition/logs/:id/duplicate` — Duplicate entry to another meal or date.
- `POST /api/nutrition/logs/copy-day` — Copy an entire previous day's meals.
- `GET /api/nutrition/recipes` — List user's saved homemade recipes.
- `POST /api/nutrition/recipes` — Create new recipe with ingredient-based auto-calculation.
- `GET /api/nutrition/goals` — Retrieve user's nutrition goals.
- `PUT /api/nutrition/goals` — Update goals (supports Mifflin-St Jeor TDEE calculation).
- `GET /api/nutrition/water?date=YYYY-MM-DD` — Retrieve hydration logs for a date.
- `POST /api/nutrition/water` — Log water intake in ml.
- `GET /api/nutrition/weight` — Retrieve weight history logs.
- `POST /api/nutrition/weight` — Record bodyweight for date.
- `GET /api/nutrition/analytics?days=7` — Retrieve multi-day calorie trends and averages.
- `POST /api/nutrition/ai-parse` — Parse natural language meal descriptions.

### Testing & Verification
- **Run Backend Test Suite:**
  ```bash
  cd backend
  npm test
  ```
  Executes all 8 test suites including `test-nutrition.js` (12 tests) and existing habit/streak/calendar suites.
- **Run Nutrition Integration Tests Individually:**
  ```bash
  cd backend
  node scripts/test-nutrition.js
  ```
- **Build Frontend Production Bundle:**
  ```bash
  cd frontend
  npm run build
  ```

