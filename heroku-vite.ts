// This is a modified version of vite.ts that works with Heroku's file structure
import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// In production, we don't need to set up Vite
export async function setupVite(_app: Express, _server: Server) {
  throw new Error("setupVite should not be called in production");
}

export function serveStatic(app: Express) {
  // Check multiple potential build paths for Heroku
  const possiblePaths = [
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "..", "public"),
    path.resolve(__dirname, "..", "client", "dist"),
    path.resolve(__dirname, "..", "dist", "client"),
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(__dirname, "..", "dist"),
    path.resolve(__dirname, "client", "dist"),
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "public"),
  ];

  // Try to find which path actually exists
  let distPath = possiblePaths.find(p => fs.existsSync(p));

  if (!distPath) {
    // Log all paths we tried for debugging
    console.error("Could not find build directory. Tried the following paths:");
    possiblePaths.forEach(p => console.error(` - ${p}`));
    
    // Default to a logical path even if it doesn't exist yet
    distPath = path.resolve(process.cwd(), "dist");
    console.warn(`Defaulting to ${distPath} even though it doesn't exist`);
  } else {
    console.log(`Found build directory at: ${distPath}`);
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Application files not found. Make sure to build the client first.");
    }
  });
}