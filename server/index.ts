import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { checkConnection } from "./db";
import { logger } from "./logger";

const app = express();

// Apply trust proxy settings - critical for Heroku 
// Uses environment variable with fallback to 1 for production
const trustProxy = process.env.TRUST_PROXY || (process.env.NODE_ENV === 'production' ? 1 : false);
app.set('trust proxy', trustProxy);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      logger.error(`Error: ${message}`, { error: err, stack: err.stack });
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    
    // Log all available addresses
    console.log('Available network interfaces:');
    try {
      import('os').then(os => {
        const nets = os.networkInterfaces();
        if (!nets) {
          console.log('No network interfaces found');
          return;
        }
        
        Object.entries(nets).forEach(([name, interfaces]) => {
          if (interfaces) {
            interfaces.forEach(net => {
              if (net) {
                console.log(`Interface: ${name}, Address: ${net.address}, Family: ${net.family}`);
              }
            });
          }
        });
      }).catch(err => {
        console.error('Error importing os:', err);
      });
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
