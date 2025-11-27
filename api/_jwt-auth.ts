import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "./_db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import type { User as SelectUser } from "../shared/schema.js";

declare global {
  namespace Express {
    interface Request {
      user?: SelectUser;
    }
  }
}

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken(user: SelectUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch {
    return null;
  }
}

async function getUserById(id: string): Promise<SelectUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

async function getUserByEmail(email: string): Promise<SelectUser | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  app.use(cookieParser());
  app.set("trust proxy", 1);

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.auth_token;
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await getUserById(decoded.userId);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  });

  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      const user = await getUserByEmail(email);
      
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = generateToken(user);
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/'
    });
    res.sendStatus(200);
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
