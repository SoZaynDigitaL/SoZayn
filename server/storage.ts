import { users, type User, type InsertUser, orders, type Order, type InsertOrder, logs, type Log, type InsertLog } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { subDays } from "date-fns";

const MemoryStore = createMemoryStore(session);

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
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private orders: Map<number, Order>;
  private logs: Map<number, Log>;
  private userIdCounter: number;
  private orderIdCounter: number;
  private logIdCounter: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.logs = new Map();
    this.userIdCounter = 1;
    this.orderIdCounter = 1;
    this.logIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create initial admin user
    this.createUser({
      email: "admin@deliverconnect.com",
      password: "$2b$10$UNDlzs8wtR80rztbrPYA3u/W.zhcm7TWTpbJYS5Zxjs1/3jqMFfUm", // plaintext: "admin123"
      name: "Admin User",
      isAdmin: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserCount(includeAdmins: boolean): Promise<number> {
    if (includeAdmins) {
      return this.users.size;
    }
    return Array.from(this.users.values()).filter(user => !user.isAdmin).length;
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByShopifyId(shopifyOrderId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.shopifyOrderId === shopifyOrderId,
    );
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    const order: Order = {
      ...orderData,
      id,
      status: "processing",
      createdAt: now,
      updatedAt: now,
      deliveryData: {}
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: number, orderData: Partial<Order>): Promise<Order> {
    const order = await this.getOrder(id);
    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }
    
    const updatedOrder = { 
      ...order, 
      ...orderData,
      updatedAt: new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async getOrderCountByStatus(statuses: string[]): Promise<number> {
    return Array.from(this.orders.values()).filter(
      (order) => statuses.includes(order.status || "")
    ).length;
  }

  async getOrderCountByStatusForUser(userId: number, statuses: string[]): Promise<number> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId && statuses.includes(order.status || "")
    ).length;
  }

  async getTodayOrderCount(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId && order.createdAt >= today
    ).length;
  }

  async getDeliverySuccessRate(): Promise<number> {
    const allCompleted = Array.from(this.orders.values()).filter(
      (order) => ["delivered", "failed"].includes(order.status || "")
    );
    
    if (allCompleted.length === 0) return 100;
    
    const succeeded = allCompleted.filter(
      (order) => order.status === "delivered"
    );
    
    return Math.round((succeeded.length / allCompleted.length) * 100 * 10) / 10;
  }

  async getDeliverySuccessRateForUser(userId: number): Promise<number> {
    const allCompleted = Array.from(this.orders.values()).filter(
      (order) => order.userId === userId && ["delivered", "failed"].includes(order.status || "")
    );
    
    if (allCompleted.length === 0) return 100;
    
    const succeeded = allCompleted.filter(
      (order) => order.status === "delivered"
    );
    
    return Math.round((succeeded.length / allCompleted.length) * 100 * 10) / 10;
  }

  // Log methods
  async createLog(logData: InsertLog): Promise<Log> {
    const id = this.logIdCounter++;
    const log: Log = {
      ...logData,
      id,
      timestamp: new Date()
    };
    this.logs.set(id, log);
    return log;
  }

  async getLogs(limit: number): Promise<Log[]> {
    const allLogs = Array.from(this.logs.values());
    allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return allLogs.slice(0, limit);
  }
}

export const storage = new MemStorage();
