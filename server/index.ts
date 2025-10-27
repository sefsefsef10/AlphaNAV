import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { initializeScheduler } from "./scheduler";

const app = express();

// Initialize Sentry for error tracking (production only)
if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1, // Sample 10% of transactions for performance monitoring
    sendDefaultPii: false, // Don't automatically send PII - we'll explicitly control what's sent
    integrations: [
      Sentry.expressIntegration(), // Automatically instruments Express for request context
    ],
    beforeSend(event, hint) {
      // Scrub sensitive data before sending to Sentry
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['x-api-key'];
        }
        
        // Remove sensitive query parameters
        if (event.request.query_string && typeof event.request.query_string === 'string') {
          event.request.query_string = event.request.query_string
            .replace(/password=[^&]*/gi, 'password=[REDACTED]')
            .replace(/token=[^&]*/gi, 'token=[REDACTED]')
            .replace(/api_key=[^&]*/gi, 'api_key=[REDACTED]');
        }
      }
      
      // Scrub sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove password fields
            if ('password' in breadcrumb.data) breadcrumb.data.password = '[REDACTED]';
            if ('token' in breadcrumb.data) breadcrumb.data.token = '[REDACTED]';
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
  });
}

// Security: Helmet.js - Set security headers
const isProduction = process.env.NODE_ENV === "production";
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
      fontSrc: ["'self'", "https://fonts.gstatic.com"], // Google Fonts
      scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Vite dev requires unsafe-inline and unsafe-eval
      scriptSrcAttr: ["'none'"], // Prevent inline event handlers
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://generativelanguage.googleapis.com",
        "https://*.sentry.io", // Sentry dashboard
        "https://*.ingest.sentry.io", // Sentry event ingestion
        "https://fonts.googleapis.com", // Google Fonts CSS
        ...(isProduction ? [] : ["ws:", "wss:"]) // WebSocket for Vite HMR in development
      ],
      frameAncestors: ["'none'"], // Prevent clickjacking
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
}));

// Security: Rate limiting - Applied BEFORE body parsing to prevent resource exhaustion
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later',
});

const authRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 token refreshes per 15 minutes (higher limit for legitimate refresh bursts)
  message: 'Too many refresh requests, please try again later',
});

// Apply rate limiting BEFORE body parsing
app.use('/api/', globalLimiter);
app.use('/api/login', authLoginLimiter);
app.use('/api/auth/callback', authLoginLimiter);
app.use('/api/auth/refresh', authRefreshLimiter);

// Body parsing AFTER rate limiting
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS Configuration - Production-ready with domain whitelist
if (isProduction) {
  // Production: Strict CORS whitelist
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];
  
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    if (!origin || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Handle preflight
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
    } else if (origin) {
      // Log unauthorized CORS attempts (potential security issue)
      console.warn(`[SECURITY] Blocked CORS request from unauthorized origin: ${origin}`);
      return res.status(403).json({ error: 'CORS not allowed from this origin' });
    }
    
    next();
  });
} else {
  // Development: Permissive CORS for local testing
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    
    next();
  });
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log response metadata, not full payloads (prevent PII leakage)
      if (capturedJsonResponse) {
        const responseType = capturedJsonResponse.error ? 'error' : 
                           Array.isArray(capturedJsonResponse) ? `array[${capturedJsonResponse.length}]` : 
                           'object';
        logLine += ` :: ${responseType}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed the database with initial data
  await seedDatabase();
  
  const server = await registerRoutes(app);

  // Health check endpoint (for monitoring and Replit deployments)
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Sentry error handler must be before other error handlers
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === "production") {
    Sentry.setupExpressErrorHandler(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize automated scheduled jobs (covenant monitoring, etc.)
    initializeScheduler();
    log("✓ Automated job scheduler initialized");
  });
})();

// Export app for testing
export { app };
