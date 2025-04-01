import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupShopifyWebhooks } from "./shopify";
import { setupDeliveryRoutes } from "./delivery";
import { z } from "zod";
import { insertOrderSchema, insertUserSchema, User, Order } from "@shared/schema";
import { logger } from "./logger";
import os from "os";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health Check endpoint (public)
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)) + "MB",
        heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)) + "MB",
      }
    });
  });
  
  // Debug endpoint (public)
  app.get("/api/debug", async (req: Request, res: Response) => {
    try {
      // Check database connection
      let dbStatus = "unknown";
      try {
        await storage.initDb();
        dbStatus = "connected";
      } catch (err: any) {
        dbStatus = `error: ${err.message}`;
      }
      
      // Return system info
      res.json({
        server: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime()
        },
        database: {
          status: dbStatus
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV || "development",
        },
        memory: {
          total: Math.round(os.totalmem() / (1024 * 1024)) + "MB",
          free: Math.round(os.freemem() / (1024 * 1024)) + "MB",
          usage: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)) + "MB",
            heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)) + "MB"
          }
        },
        network: Object.entries(os.networkInterfaces()).reduce((acc: any, [key, val]) => {
          acc[key] = val?.map(({ address, family }: any) => ({ address, family })) || [];
          return acc;
        }, {})
      });
    } catch (error) {
      logger.error("Debug endpoint error:", { error });
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Set up auth routes and middleware
  const { authenticateJWT } = setupAuth(app);

  // User management routes
  app.get("/api/users", authenticateJWT, async (req: any, res) => {
    try {
      // Only admins can access all users
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      // Remove passwords before sending to client
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error) {
      logger.error("Error fetching users", { error });
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Toggle user active status (only for admins)
  app.post("/api/users/:id/toggle-active", authenticateJWT, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        ...user,
        isActive: !user.isActive
      });
      
      // Remove password before sending to client
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      logger.error("Error toggling user status", { error, userId: req.params.id });
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Update user settings
  app.patch("/api/users/:id", authenticateJWT, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only admins or the user themselves can update their profile
      if (!req.user.isAdmin && req.user.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updateSchema = z.object({
        name: z.string().optional(),
        // Shopify integration fields
        shopifyDomain: z.string().optional(),
        shopifyApiKey: z.string().optional(),
        shopifyApiSecret: z.string().optional(),
        // UberDirect integration fields
        uberDirectApiKey: z.string().optional(),
        uberDirectClientId: z.string().optional(),
        uberDirectClientSecret: z.string().optional(),
        // JetGo integration fields
        jetGoApiKey: z.string().optional(),
        jetGoAccountId: z.string().optional(),
        // Preferred delivery service
        preferredDeliveryService: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, {
        ...user,
        ...validatedData
      });
      
      // Remove password before sending to client
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      logger.error("Error updating user", { error, userId: req.params.id });
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Order management routes
  app.get("/api/orders", authenticateJWT, async (req: any, res) => {
    try {
      let orders: Order[];
      
      // Admins can see all orders, regular users can only see their own
      if (req.user.isAdmin) {
        orders = await storage.getAllOrders();
      } else {
        orders = await storage.getOrdersByUserId(req.user.userId);
      }
      
      res.json(orders);
    } catch (error) {
      logger.error("Error fetching orders", { error });
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  app.get("/api/orders/:id", authenticateJWT, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user has access to this order
      if (!req.user.isAdmin && order.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      logger.error("Error fetching order", { error, orderId: req.params.id });
      res.status(500).json({ message: "Error fetching order" });
    }
  });

  // Manual order creation (for testing)
  app.post("/api/orders", authenticateJWT, async (req: any, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      
      // Set userId to current user if not admin
      if (!req.user.isAdmin && validatedData.userId !== req.user.userId) {
        validatedData.userId = req.user.userId;
      }
      
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      logger.error("Error creating order", { error });
      res.status(500).json({ message: "Error creating order" });
    }
  });

  // Set up Shopify webhooks
  setupShopifyWebhooks(app, authenticateJWT);
  
  // Set up delivery service routes
  setupDeliveryRoutes(app, authenticateJWT);

  // Stats for admin dashboard
  app.get("/api/stats", authenticateJWT, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = {
        totalClients: await storage.getUserCount(false), // non-admin users
        activeOrders: await storage.getOrderCountByStatus(["processing", "in_transit"]),
        successRate: await storage.getDeliverySuccessRate()
      };
      
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching stats", { error });
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // Stats for client dashboard
  app.get("/api/client-stats", authenticateJWT, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      
      const stats = {
        todayOrders: await storage.getTodayOrderCount(userId),
        inTransitOrders: await storage.getOrderCountByStatusForUser(userId, ["in_transit"]),
        successRate: await storage.getDeliverySuccessRateForUser(userId)
      };
      
      res.json(stats);
    } catch (error) {
      logger.error("Error fetching client stats", { error, userId: req.user.userId });
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
