import winston from "winston";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "deliverconnect" },
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Write logs to file
    new winston.transports.File({ 
      filename: path.join(logsDir, "app.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Custom logger that also stores logs in the database
const dbLogger = {
  error: (message: string, meta: any = {}) => {
    logger.error(message, meta);
    try {
      storage.createLog({
        level: "error",
        message,
        data: meta
      });
    } catch (error) {
      logger.error("Failed to store log in database", { error });
    }
  },
  
  warn: (message: string, meta: any = {}) => {
    logger.warn(message, meta);
    try {
      storage.createLog({
        level: "warn",
        message,
        data: meta
      });
    } catch (error) {
      logger.error("Failed to store log in database", { error });
    }
  },
  
  info: (message: string, meta: any = {}) => {
    logger.info(message, meta);
    try {
      storage.createLog({
        level: "info",
        message,
        data: meta
      });
    } catch (error) {
      logger.error("Failed to store log in database", { error });
    }
  },
  
  debug: (message: string, meta: any = {}) => {
    logger.debug(message, meta);
    // Debug logs are not stored in the database
  }
};

export { dbLogger as logger };
