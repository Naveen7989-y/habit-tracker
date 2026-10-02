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
