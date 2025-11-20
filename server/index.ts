// ==================================================
// 🌍 Environment Setup
// ==================================================
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_ENV ||= "development";

console.log("🔧 Loaded environment:", {
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  hasSessionSecret: Boolean(process.env.SESSION_SECRET),
  nodeEnv: process.env.NODE_ENV,
});

// ==================================================
// 🧱 Import Dependencies
// ==================================================
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import cors from "cors";
import cookieParser from "cookie-parser";

import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { initializeAPNs } from "./apns";

// ==================================================
// ⚙️ Express App Setup
// ==================================================
const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ==================================================
// 🌐 CORS + Cookies
// ==================================================
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// ==================================================
// 🧾 Request Logging Middleware
// ==================================================
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalJson = res.json.bind(res);
  res.json = (body: any): Response => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 100) logLine = logLine.slice(0, 99) + "…";
      console.log(logLine);
    }
  });

  next();
});

// ==================================================
// 💾 Session Setup
// ==================================================
const PgStore = connectPg(session);

app.use(
  session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: 7 * 24 * 60 * 60,
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET!,
    name: "sessionId",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  })
);

// ==================================================
// 🧩 Register Routes & Error Handling
// ==================================================
(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("❌ Express Error:", message);
    res.status(status).json({ message });
  });

  console.log("🌱 Express environment:", app.get("env"));

  // ==================================================
  // ⚙️ Dev Mode: Vite Middleware
  // ==================================================
  if (app.get("env") === "development") {
    console.log("🚀 Starting Vite in middleware mode...");
    await setupVite(app, server);
  } else {
    console.log("📦 Production: serving static files from dist/");
    
    // ✅ Serve service worker with correct MIME type before static files
    app.get("/service-worker.js", (_req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile("service-worker.js", { root: "dist" });
    });
    
    app.use(express.static("dist")); // Serves manifest, icons, and all other public files
    
    app.get("*", (_req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  // ==================================================
  // 🔔 Initialize APNs for Push Notifications
  // ==================================================
  initializeAPNs();

  // ==================================================
  // 🖥️ Start Server
  // ==================================================
  // Force port 5000 for Replit webview (webview only works on port 5000)
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
  });
})();
