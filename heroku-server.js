// This is a special entry point for Heroku
// It handles dynamic module resolution issues that can occur in Heroku's environment
import express from "express";
import { registerRoutes } from "./server/routes.js";
import { serveStatic, log } from "./heroku-vite.js";
import { storage } from "./server/storage.js";
import { checkConnection } from "./server/db.js";
import { logger } from "./server/logger.js";

console.log('Starting Heroku-specific server entry point');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT || 5000}`);

// List all environment variables for debugging (excluding secrets)
console.log('Environment Variables:');
Object.keys(process.env)
  .filter(key => !['DATABASE_URL', 'JWT_SECRET', 'SESSION_SECRET'].includes(key))
  .forEach(key => {
    console.log(`  ${key}: ${process.env[key]}`);
  });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Custom logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Main server startup function
(async () => {
  try {
    // Check database connection
    const dbConnected = await checkConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Initialize database (create tables and seed data)
    await storage.initDb();
    logger.info('Database initialized successfully');
    
    const server = await registerRoutes(app);

    // Add global error handler
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      logger.error(`Error: ${message}`, { error: err, stack: err.stack });
      res.status(status).json({ message });
    });

    // In production, always serve static files
    serveStatic(app);

    // Use the PORT environment variable that Heroku provides
    const port = process.env.PORT || 5000;
    
    // Log all available addresses
    try {
      const os = await import('os');
      const nets = os.networkInterfaces();
      console.log('Available network interfaces:');
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          console.log(`Interface: ${name}, Address: ${net.address}, Family: ${net.family}`);
        }
      }
    } catch (err) {
      console.error('Error getting network interfaces:', err);
    }

    // Explicitly listen on all interfaces with standard Node.js API
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port} (http://0.0.0.0:${port})`);
      log('Server is ready to accept connections');
    });
  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
})();