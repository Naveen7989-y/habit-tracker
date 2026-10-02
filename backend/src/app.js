import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy (required for Render / rate limiting)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    // Allow configured frontendUrl, local dev, and any vercel deployment
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      config.nodeEnv !== 'production'
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    error: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api', limiter);

// HTTP request logger
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Base health route
app.get('/', (req, res) => {
  res.json({
    name: 'HAbyTAT API',
    status: 'active',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Mount API routes
app.use('/api', apiRoutes);

// Catch 404
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
