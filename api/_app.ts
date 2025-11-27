import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./_routes";

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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const str = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${str.length > 100 ? str.slice(0, 100) + '...' : str}`;
      }
      console.log(logLine);
    }
  });

  next();
});

let isInitialized = false;

export async function initializeApp() {
  if (isInitialized) return app;
  
  await registerRoutes(app);
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  
  isInitialized = true;
  return app;
}

export default app;
