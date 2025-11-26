import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";

console.log("[Vercel] Starting serverless function initialization...");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('trust proxy', 1);

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
    let logLine = `[Vercel] ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      const responseStr = JSON.stringify(capturedJsonResponse);
      logLine += ` :: ${responseStr.length > 100 ? responseStr.slice(0, 100) + '...' : responseStr}`;
    }
    console.log(logLine);
  });

  next();
});

let isReady = false;
let initError: Error | null = null;

const initPromise = (async () => {
  try {
    console.log("[Vercel] Registering routes...");
    await registerRoutes(app);
    console.log("[Vercel] Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("[Vercel] Error:", err.message);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    isReady = true;
    console.log("[Vercel] Initialization complete");
  } catch (error) {
    console.error("[Vercel] Initialization failed:", error);
    initError = error as Error;
  }
})();

export default async function handler(req: Request, res: Response) {
  console.log(`[Vercel] Handler called: ${req.method} ${req.url}`);
  
  if (!isReady) {
    await initPromise;
  }
  
  if (initError) {
    console.error("[Vercel] Returning init error:", initError.message);
    return res.status(500).json({ error: "Server initialization failed", details: initError.message });
  }
  
  return app(req, res);
}
