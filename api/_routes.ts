import type { Express } from "express";
import { storage } from "./_storage";
import { db } from "./_db";
import { bets } from "../shared/schema";
import { eq } from "drizzle-orm";
import { insertAccountHolderSchema, insertBettingHouseSchema, insertSurebetSetSchema, insertBetSchema, insertUserSchema } from "../shared/schema";
import { z } from "zod";
import multer from "multer";
import { setupAuth, requireAuth, requireAdmin, hashPassword } from "./_jwt-auth";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<void> {
  setupAuth(app);

  app.get("/api/health", async (req, res) => {
    const diagnostics: any = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      hasSupabaseUrl: !!process.env.SUPABASE_DATABASE_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      isAuthenticated: !!req.user,
    };
    
    try {
      const result = await db.execute("SELECT 1 as test");
      diagnostics.database = "connected";
    } catch (error: any) {
      diagnostics.database = "error: " + error.message;
    }
    
    console.log("[Health] Diagnostics:", JSON.stringify(diagnostics));
    res.json(diagnostics);
  });

  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPassword = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPassword);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const hashedData = {
        ...data,
        password: await hashPassword(data.password),
      };
      const user = await storage.createUser(hashedData);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (req.user!.role !== 'admin' && req.user!.id !== id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const data = insertUserSchema.partial().parse(req.body);
      const updateData: any = { ...data };
      
      if (data.password) {
        updateData.password = await hashPassword(data.password);
      }

      const user = await storage.updateUser(id, updateData);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/account-holders", requireAuth, async (req, res) => {
    try {
      const accountHolders = await storage.getAccountHolders(req.user!.id);
      res.json(accountHolders);
    } catch (error) {
      console.error("Error fetching account holders:", error);
      res.status(500).json({ error: "Failed to fetch account holders" });
    }
  });

  app.post("/api/account-holders", requireAuth, async (req, res) => {
    try {
      const data = insertAccountHolderSchema.parse(req.body);
      const accountHolder = await storage.createAccountHolder({ ...data, userId: req.user!.id });
      res.json(accountHolder);
    } catch (error) {
      console.error("Error creating account holder:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create account holder" });
      }
    }
  });

  app.put("/api/account-holders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertAccountHolderSchema.partial().parse(req.body);
      const accountHolder = await storage.updateAccountHolder(id, data);
      res.json(accountHolder);
    } catch (error) {
      console.error("Error updating account holder:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else if (error instanceof Error && error.message === 'Account holder not found') {
        res.status(404).json({ error: "Account holder not found" });
      } else {
        res.status(500).json({ error: "Failed to update account holder" });
      }
    }
  });

  app.delete("/api/account-holders/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAccountHolder(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account holder:", error);
      res.status(500).json({ error: "Failed to delete account holder" });
    }
  });

  app.get("/api/betting-houses", requireAuth, async (req, res) => {
    try {
      const { accountHolderId } = req.query;
      let bettingHouses;
      
      if (accountHolderId) {
        bettingHouses = await storage.getBettingHousesByHolder(accountHolderId as string);
      } else {
        bettingHouses = await storage.getBettingHouses(req.user!.id);
      }
      
      res.json(bettingHouses);
    } catch (error) {
      console.error("Error fetching betting houses:", error);
      res.status(500).json({ error: "Failed to fetch betting houses" });
    }
  });

  app.post("/api/betting-houses", requireAuth, async (req, res) => {
    try {
      const data = insertBettingHouseSchema.parse(req.body);
      const bettingHouse = await storage.createBettingHouse({ ...data, userId: req.user!.id });
      res.json(bettingHouse);
    } catch (error) {
      console.error("Error creating betting house:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create betting house" });
      }
    }
  });

  app.put("/api/betting-houses/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertBettingHouseSchema.partial().parse(req.body);
      const bettingHouse = await storage.updateBettingHouse(id, data);
      res.json(bettingHouse);
    } catch (error) {
      console.error("Error updating betting house:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else if (error instanceof Error && error.message === 'Betting house not found') {
        res.status(404).json({ error: "Betting house not found" });
      } else {
        res.status(500).json({ error: "Failed to update betting house" });
      }
    }
  });

  app.delete("/api/betting-houses/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBettingHouse(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting betting house:", error);
      res.status(500).json({ error: "Failed to delete betting house" });
    }
  });

  app.get("/api/surebet-sets", requireAuth, async (req, res) => {
    try {
      const surebetSets = await storage.getSurebetSets(req.user!.id);
      res.json(surebetSets);
    } catch (error) {
      console.error("Error fetching surebet sets:", error);
      res.status(500).json({ error: "Failed to fetch surebet sets" });
    }
  });

  app.get("/api/surebet-sets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const surebetSet = await storage.getSurebetSetById(id);
      if (!surebetSet) {
        res.status(404).json({ error: "Surebet set not found" });
        return;
      }
      res.json(surebetSet);
    } catch (error) {
      console.error("Error fetching surebet set:", error);
      res.status(500).json({ error: "Failed to fetch surebet set" });
    }
  });

  app.post("/api/surebet-sets", requireAuth, async (req, res) => {
    try {
      const { surebetSet, bets: setBets } = req.body;
      
      if (!Array.isArray(setBets) || setBets.length < 2 || setBets.length > 3) {
        res.status(400).json({ error: "Surebet must have 2 or 3 bets" });
        return;
      }
      
      const surebetData = insertSurebetSetSchema.parse(surebetSet);
      
      const createdSet = await storage.createSurebetSet({ ...surebetData, userId: req.user!.id });
      
      const createdBets = [];
      for (const betData of setBets) {
        const validatedBet = insertBetSchema.parse({
          ...betData,
          surebetSetId: createdSet.id
        });
        const createdBet = await storage.createBet(validatedBet);
        createdBets.push(createdBet);
      }
      
      res.json({
        surebetSet: createdSet,
        bets: createdBets
      });
    } catch (error) {
      console.error("Error creating surebet set:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create surebet set" });
      }
    }
  });

  app.put("/api/surebet-sets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertSurebetSetSchema.partial().parse(req.body);
      const surebetSet = await storage.updateSurebetSet(id, data);
      res.json(surebetSet);
    } catch (error) {
      console.error("Error updating surebet set:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else if (error instanceof Error && error.message === 'Surebet set not found') {
        res.status(404).json({ error: "Surebet set not found" });
      } else {
        res.status(500).json({ error: "Failed to update surebet set" });
      }
    }
  });

  app.delete("/api/surebet-sets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSurebetSet(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting surebet set:", error);
      res.status(500).json({ error: "Failed to delete surebet set" });
    }
  });

  app.put("/api/bets/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = insertBetSchema.partial().parse(req.body);
      
      const updatedBet = await storage.updateBet(id, updateData);
      
      if (updatedBet.surebetSetId && (updateData.odd !== undefined || updateData.stake !== undefined)) {
        const allBets = await db.select().from(bets).where(eq(bets.surebetSetId, updatedBet.surebetSetId));
        
        if (allBets.length === 2 || allBets.length === 3) {
          const totalStakes = allBets.reduce((sum, bet) => sum + parseFloat(String(bet.stake)), 0);
          
          for (const bet of allBets) {
            const stake = parseFloat(String(bet.stake));
            const odd = parseFloat(String(bet.odd));
            const profitPotential = (stake * odd) - totalStakes;
            
            await storage.updateBet(bet.id, { potentialProfit: String(profitPotential) });
          }
        }
      }
      
      if (updatedBet.surebetSetId && updateData.result) {
        const allBets = await db.select().from(bets).where(eq(bets.surebetSetId, updatedBet.surebetSetId));
        const allHaveResults = allBets.every(b => b.result != null);
        
        console.log(`[PROFIT CALC] Surebet ${updatedBet.surebetSetId}: ${allBets.length} bets, all have results: ${allHaveResults}`);
        
        if (allHaveResults && (allBets.length === 2 || allBets.length === 3)) {
          const calculateReturn = (bet: typeof allBets[0]): number => {
            const stake = parseFloat(String(bet.stake));
            const odd = parseFloat(String(bet.odd));
            
            switch (bet.result) {
              case "won":
                return stake * odd;
              case "lost":
                return 0;
              case "returned":
                return stake;
              case "half_won":
                return (stake / 2) * odd + (stake / 2);
              case "half_returned":
                return stake / 2;
              default:
                return 0;
            }
          };
          
          const totalReturn = allBets.reduce((sum, bet) => sum + calculateReturn(bet), 0);
          const totalInvested = allBets.reduce((sum, bet) => sum + parseFloat(String(bet.stake)), 0);
          const actualProfit = totalReturn - totalInvested;
          
          console.log(`[PROFIT CALC] Total return: ${totalReturn}, Total invested: ${totalInvested}, Actual profit: ${actualProfit}`);
          console.log(`[PROFIT CALC] Bet results: ${allBets.map((b, i) => `bet${i+1}: ${b.result}`).join(', ')}`);
          
          for (const bet of allBets) {
            console.log(`[PROFIT CALC] Updating bet ${bet.id} with actualProfit: ${actualProfit}`);
            await storage.updateBet(bet.id, { actualProfit: String(actualProfit) });
          }
          
          await storage.updateSurebetSet(updatedBet.surebetSetId, { status: "resolved" });
          console.log(`[PROFIT CALC] Surebet set ${updatedBet.surebetSetId} marked as resolved`);
        }
      }
      
      res.json(updatedBet);
    } catch (error) {
      console.error("Error updating bet:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else if (error instanceof Error && error.message === 'Bet not found') {
        res.status(404).json({ error: "Bet not found" });
      } else {
        res.status(500).json({ error: "Failed to update bet" });
      }
    }
  });

  app.patch("/api/surebet-sets/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const body = z.object({ 
        status: z.enum(["pending", "resolved"]).optional(),
        isChecked: z.boolean().optional()
      }).parse(req.body);
      
      const updatedSet = await storage.updateSurebetSet(id, body);
      res.json(updatedSet);
    } catch (error: any) {
      console.error("Error updating surebet set:", error);
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.post("/api/surebet-sets/:id/reset", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const allBets = await db.select().from(bets).where(eq(bets.surebetSetId, id));
      
      for (const bet of allBets) {
        await storage.updateBet(bet.id, { 
          result: null, 
          actualProfit: null 
        });
      }
      
      const updatedSet = await storage.updateSurebetSet(id, { status: "pending" });
      
      res.json(updatedSet);
    } catch (error: any) {
      console.error("Error resetting surebet set:", error);
      res.status(500).json({ error: error.message || "Failed to reset surebet set" });
    }
  });

  app.post("/api/ocr/process", requireAuth, upload.single('file'), async (req, res) => {
    res.status(501).json({ 
      error: "OCR processing not available in serverless environment",
      message: "PDF processing requires Python which is not available on Vercel. Please use manual data entry or the BetBurger import feature."
    });
  });

  app.post("/api/ocr/process-batch", requireAuth, upload.array('files', 50), async (req, res) => {
    res.status(501).json({ 
      error: "OCR batch processing not available in serverless environment",
      message: "PDF processing requires Python which is not available on Vercel. Please use manual data entry or the BetBurger import feature."
    });
  });

  app.get("/api/admin/migration/export-sql", requireAdmin, async (req, res) => {
    try {
      const { MigrationService } = await import("./_migration-service");
      const migrationService = new MigrationService();
      const sqlContent = await migrationService.exportToSQL();
      
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="supabase_migration.sql"');
      res.send(sqlContent);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Export failed" 
      });
    }
  });

  app.get("/api/admin/migration/stats", requireAdmin, async (req, res) => {
    try {
      const { MigrationService } = await import("./_migration-service");
      const migrationService = new MigrationService();
      const stats = await migrationService.getStats();
      
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to get stats" 
      });
    }
  });

}
