import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SchemaUser, LoginUser } from "@shared/schema";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    // Match the interface to our schema
    interface User {
      id: number;
      email: string;
      password: string;
      name: string;
      shopifyDomain: string;
      shopifyApiKey: string;
      shopifyApiSecret: string;
      isAdmin: boolean;
      isActive: boolean;
      createdAt: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // JWT Secret
  const JWT_SECRET = process.env.JWT_SECRET || "deliverconnect-secret-key";
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "deliverconnect-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          }
          
          if (!user.isActive) {
            return done(null, false, { message: "Account is deactivated" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // JWT Middleware
  const authenticateJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
          return res.status(403).json({ message: "Invalid or expired token" });
        }
        
        req.user = user;
        next();
      });
    } else {
      res.status(401).json({ message: "Authorization token required" });
    }
  };

  // Register route
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const userData = {
        ...req.body,
        password: hashedPassword,
      };
      
      // TypeScript safe way to remove the confirmPassword property
      if ('confirmPassword' in userData) {
        const { confirmPassword, ...rest } = userData;
        
        // Add debugging
        console.log('Creating user with data:', {
          ...rest,
          password: '***REDACTED***'
        });
        
        const user = await storage.createUser(rest);
        
        // Add debugging
        console.log('User created:', {
          id: user.id,
          email: user.email,
          isActive: user.isActive
        });
        
        // Create a safe user object without password
        const { password, ...userForClient } = user;
        
        // Create JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email, isAdmin: user.isAdmin },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        req.login(user, (err: Error | null) => {
          if (err) return next(err);
          res.status(201).json({ user: userForClient, token });
        });
      }
    } catch (error) {
      console.error('Error in registration:', error);
      next(error);
    }
  });

  // Login route
  app.post("/api/login", async (req, res, next) => {
    try {
      // First check if the user exists and is active
      const userFromDb = await storage.getUserByEmail(req.body.email);
      
      if (!userFromDb) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!userFromDb.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }
      
      // Check password
      const isPasswordValid = await comparePasswords(req.body.password, userFromDb.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Login successful
      req.login(userFromDb, (err: Error | null) => {
        if (err) return next(err);
        
        // Create a safe user object without password
        const { password, ...userForClient } = userFromDb;
        
        // Create JWT token
        const token = jwt.sign(
          { userId: userFromDb.id, email: userFromDb.email, isAdmin: userFromDb.isAdmin },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.status(200).json({ user: userForClient, token });
      });
    } catch (error) {
      console.error('Login error:', error);
      next(error);
    }
  });

  // Logout route
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user route
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user as Express.User;
    // Create a safe user object without password
    const { password, ...userForClient } = user;
    
    res.json(userForClient);
  });

  return { authenticateJWT };
}
