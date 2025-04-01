import { users, type User, type InsertUser, orders, type Order, type InsertOrder, logs, type Log, type InsertLog } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { subDays } from "date-fns";
import connectPg from "connect-pg-simple";
import { eq, and, gte, desc, sql, count, countDistinct } from "drizzle-orm";
import { logger } from "./logger";
import { hashPassword } from "./auth";
import { pool, db } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserCount(includeAdmins: boolean): Promise<number>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByShopifyId(shopifyOrderId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<Order>): Promise<Order>;
  getAllOrders(): Promise<Order[]>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getOrderCountByStatus(statuses: string[]): Promise<number>;
  getOrderCountByStatusForUser(userId: number, statuses: string[]): Promise<number>;
  getTodayOrderCount(userId: number): Promise<number>;
  getDeliverySuccessRate(): Promise<number>;
  getDeliverySuccessRateForUser(userId: number): Promise<number>;
  
  // Log methods
  createLog(log: InsertLog): Promise<Log>;
  getLogs(limit: number): Promise<Log[]>;
  
  // Database management
  initDb(): Promise<void>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: pool as any, // Use type assertion to avoid TypeScript error
      createTableIfMissing: true
    });
  }

  // Initialize the database with tables and seed data
  async initDb(): Promise<void> {
    try {
      logger.info('Initializing database...');
      
      // Create admin user if it doesn't exist
      const adminUser = await this.getUserByEmail("admin@deliverconnect.com");
      
      if (!adminUser) {
        logger.info('Creating admin user...');
        await this.createUser({
          email: "admin@deliverconnect.com",
          password: await hashPassword("admin123"),
          name: "Admin User",
          isAdmin: true,
          isActive: true
        });
      }
      
      logger.info('Database initialization complete');
    } catch (error) {
      logger.error('Database initialization error:', { error });
      throw error;
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      logger.error('Error getting user by ID:', { error, userId: id });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      logger.error('Error getting user by email:', { error, email });
      throw error;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Ensure isActive is set to true for new users
      const userWithDefaults = {
        ...userData,
        isActive: true
      };
      
      console.log('In storage.createUser, inserting:', {
        ...userWithDefaults,
        password: '***REDACTED***'
      });
      
      const [user] = await db.insert(users).values(userWithDefaults).returning();
      
      console.log('User inserted, returned from DB:', {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        shopifyDomain: user.shopifyDomain,
        createdAt: user.createdAt
      });
      
      return user;
    } catch (error) {
      console.error('Error creating user in storage:', error);
      logger.error('Error creating user:', { error, email: userData.email });
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const [updatedUser] = await db.update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', { error, userId: id });
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      logger.error('Error getting all users:', { error });
      throw error;
    }
  }

  async getUserCount(includeAdmins: boolean): Promise<number> {
    try {
      let countQuery;
      
      if (!includeAdmins) {
        countQuery = db
          .select({ count: count() })
          .from(users)
          .where(eq(users.isAdmin, false));
      } else {
        countQuery = db
          .select({ count: count() })
          .from(users);
      }
      
      const result = await countQuery;
      return Number(result[0].count);
    } catch (error) {
      logger.error('Error getting user count:', { error });
      throw error;
    }
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    try {
      const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      return result[0];
    } catch (error) {
      logger.error('Error getting order by ID:', { error, orderId: id });
      throw error;
    }
  }

  async getOrderByShopifyId(shopifyOrderId: string): Promise<Order | undefined> {
    try {
      const result = await db.select().from(orders)
        .where(eq(orders.shopifyOrderId, shopifyOrderId))
        .limit(1);
      return result[0];
    } catch (error) {
      logger.error('Error getting order by Shopify ID:', { error, shopifyOrderId });
      throw error;
    }
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    try {
      const [order] = await db.insert(orders)
        .values({
          ...orderData,
          status: "processing",
          deliveryData: {}
        })
        .returning();
      return order;
    } catch (error) {
      logger.error('Error creating order:', { error, shopifyOrderId: orderData.shopifyOrderId });
      throw error;
    }
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order> {
    try {
      const [updatedOrder] = await db.update(orders)
        .set({
          ...orderData,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();
      
      if (!updatedOrder) {
        throw new Error(`Order with ID ${id} not found`);
      }
      
      return updatedOrder;
    } catch (error) {
      logger.error('Error updating order:', { error, orderId: id });
      throw error;
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      return await db.select().from(orders);
    } catch (error) {
      logger.error('Error getting all orders:', { error });
      throw error;
    }
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    try {
      return await db.select().from(orders).where(eq(orders.userId, userId));
    } catch (error) {
      logger.error('Error getting orders by user ID:', { error, userId });
      throw error;
    }
  }

  async getOrderCountByStatus(statuses: string[]): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(orders)
        .where(sql`${orders.status} IN (${statuses.join(',')})`);
      return Number(result[0].count);
    } catch (error) {
      logger.error('Error getting order count by status:', { error, statuses });
      throw error;
    }
  }

  async getOrderCountByStatusForUser(userId: number, statuses: string[]): Promise<number> {
    try {
      const result = await db.select({ count: count() })
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            sql`${orders.status} IN (${statuses.join(',')})`
          )
        );
      return Number(result[0].count);
    } catch (error) {
      logger.error('Error getting order count by status for user:', { error, userId, statuses });
      throw error;
    }
  }

  async getTodayOrderCount(userId: number): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = await db.select({ count: count() })
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            gte(orders.createdAt, today)
          )
        );
      return Number(result[0].count);
    } catch (error) {
      logger.error('Error getting today order count:', { error, userId });
      throw error;
    }
  }

  async getDeliverySuccessRate(): Promise<number> {
    try {
      // Count all completed deliveries (delivered or failed)
      const completedResult = await db.select({ count: count() })
        .from(orders)
        .where(sql`${orders.status} IN ('delivered', 'failed')`);
      
      const allCompleted = Number(completedResult[0].count);
      
      if (allCompleted === 0) return 100;
      
      // Count successful deliveries
      const successResult = await db.select({ count: count() })
        .from(orders)
        .where(eq(orders.status, 'delivered'));
      
      const succeeded = Number(successResult[0].count);
      
      return Math.round((succeeded / allCompleted) * 100 * 10) / 10;
    } catch (error) {
      logger.error('Error getting delivery success rate:', { error });
      throw error;
    }
  }

  async getDeliverySuccessRateForUser(userId: number): Promise<number> {
    try {
      // Count all completed deliveries for user (delivered or failed)
      const completedResult = await db.select({ count: count() })
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            sql`${orders.status} IN ('delivered', 'failed')`
          )
        );
      
      const allCompleted = Number(completedResult[0].count);
      
      if (allCompleted === 0) return 100;
      
      // Count successful deliveries for user
      const successResult = await db.select({ count: count() })
        .from(orders)
        .where(
          and(
            eq(orders.userId, userId),
            eq(orders.status, 'delivered')
          )
        );
      
      const succeeded = Number(successResult[0].count);
      
      return Math.round((succeeded / allCompleted) * 100 * 10) / 10;
    } catch (error) {
      logger.error('Error getting delivery success rate for user:', { error, userId });
      throw error;
    }
  }

  // Log methods
  async createLog(logData: InsertLog): Promise<Log> {
    try {
      const [log] = await db.insert(logs).values(logData).returning();
      return log;
    } catch (error) {
      logger.error('Error creating log:', { error });
      // Don't throw error for logs to prevent cascading failures
      return {
        id: 0,
        level: logData.level,
        message: logData.message,
        data: logData.data,
        timestamp: new Date()
      };
    }
  }

  async getLogs(limit: number): Promise<Log[]> {
    try {
      return await db.select().from(logs).orderBy(desc(logs.timestamp)).limit(limit);
    } catch (error) {
      logger.error('Error getting logs:', { error });
      throw error;
    }
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage();
