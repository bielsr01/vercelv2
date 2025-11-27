import { db } from "./_db";
import { accountHolders, bettingHouses, surebetSets, bets, users } from "../shared/schema";
import type {
  AccountHolder,
  InsertAccountHolder,
  BettingHouse,
  InsertBettingHouse,
  SurebetSet,
  InsertSurebetSet,
  Bet,
  InsertBet,
  SurebetSetWithBets,
  User,
  InsertUser
} from "../shared/schema";
import { eq, desc, inArray, asc } from "drizzle-orm";

export interface IStorage {
  createUser(data: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  createAccountHolder(data: InsertAccountHolder): Promise<AccountHolder>;
  getAccountHolders(userId?: string): Promise<AccountHolder[]>;
  updateAccountHolder(id: string, data: Partial<InsertAccountHolder>): Promise<AccountHolder>;
  deleteAccountHolder(id: string): Promise<void>;

  createBettingHouse(data: InsertBettingHouse): Promise<BettingHouse>;
  getBettingHouses(userId?: string): Promise<any[]>;
  getBettingHousesByHolder(accountHolderId: string): Promise<BettingHouse[]>;
  updateBettingHouse(id: string, data: Partial<InsertBettingHouse>): Promise<BettingHouse>;
  deleteBettingHouse(id: string): Promise<void>;

  createSurebetSet(data: InsertSurebetSet): Promise<SurebetSet>;
  getSurebetSets(userId?: string): Promise<SurebetSetWithBets[]>;
  getSurebetSetById(id: string): Promise<SurebetSetWithBets | null>;
  updateSurebetSet(id: string, data: Partial<InsertSurebetSet>): Promise<SurebetSet>;
  deleteSurebetSet(id: string): Promise<void>;

  createBet(data: InsertBet): Promise<Bet>;
  updateBet(id: string, data: Partial<InsertBet>): Promise<Bet>;
  deleteBet(id: string): Promise<void>;
}

class DatabaseStorage implements IStorage {
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    if (!user) throw new Error('User not found');
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createAccountHolder(data: InsertAccountHolder): Promise<AccountHolder> {
    const [accountHolder] = await db.insert(accountHolders).values(data).returning();
    return accountHolder;
  }

  async getAccountHolders(userId?: string): Promise<AccountHolder[]> {
    if (userId) {
      return await db.select().from(accountHolders).where(eq(accountHolders.userId, userId)).orderBy(desc(accountHolders.createdAt));
    }
    return await db.select().from(accountHolders).orderBy(desc(accountHolders.createdAt));
  }

  async updateAccountHolder(id: string, data: Partial<InsertAccountHolder>): Promise<AccountHolder> {
    const [accountHolder] = await db
      .update(accountHolders)
      .set(data)
      .where(eq(accountHolders.id, id))
      .returning();
    
    if (!accountHolder) throw new Error('Account holder not found');
    return accountHolder;
  }

  async deleteAccountHolder(id: string): Promise<void> {
    await db.delete(accountHolders).where(eq(accountHolders.id, id));
  }

  async createBettingHouse(data: InsertBettingHouse): Promise<BettingHouse> {
    const [bettingHouse] = await db.insert(bettingHouses).values(data).returning();
    return bettingHouse;
  }

  async getBettingHouses(userId?: string): Promise<any[]> {
    let query = db
      .select()
      .from(bettingHouses)
      .leftJoin(accountHolders, eq(bettingHouses.accountHolderId, accountHolders.id));
    
    if (userId) {
      query = query.where(eq(bettingHouses.userId, userId)) as any;
    }
    
    const houses = await query.orderBy(desc(bettingHouses.createdAt));
    
    return houses.map(row => ({
      ...row.betting_houses,
      accountHolder: row.account_holders
    }));
  }

  async getBettingHousesByHolder(accountHolderId: string): Promise<BettingHouse[]> {
    return await db
      .select()
      .from(bettingHouses)
      .where(eq(bettingHouses.accountHolderId, accountHolderId))
      .orderBy(desc(bettingHouses.createdAt));
  }

  async updateBettingHouse(id: string, data: Partial<InsertBettingHouse>): Promise<BettingHouse> {
    const [bettingHouse] = await db
      .update(bettingHouses)
      .set(data)
      .where(eq(bettingHouses.id, id))
      .returning();
    
    if (!bettingHouse) throw new Error('Betting house not found');
    return bettingHouse;
  }

  async deleteBettingHouse(id: string): Promise<void> {
    await db.delete(bettingHouses).where(eq(bettingHouses.id, id));
  }

  async createSurebetSet(data: InsertSurebetSet): Promise<SurebetSet> {
    const [surebetSet] = await db.insert(surebetSets).values(data).returning();
    return surebetSet;
  }

  async getSurebetSets(userId?: string): Promise<SurebetSetWithBets[]> {
    let query = db.select().from(surebetSets);
    
    if (userId) {
      query = query.where(eq(surebetSets.userId, userId)) as any;
    }
    
    const sets = await query.orderBy(desc(surebetSets.createdAt));
    
    if (sets.length === 0) {
      return [];
    }
    
    const setIds = sets.map(set => set.id);
    const allBets = await db
      .select()
      .from(bets)
      .innerJoin(bettingHouses, eq(bets.bettingHouseId, bettingHouses.id))
      .innerJoin(accountHolders, eq(bettingHouses.accountHolderId, accountHolders.id))
      .where(inArray(bets.surebetSetId, setIds))
      .orderBy(asc(bets.createdAt), asc(bets.id));
    
    const betsBySetId = new Map<string, any[]>();
    
    for (const row of allBets) {
      const setId = row.bets.surebetSetId;
      if (!setId) continue;
      
      if (!betsBySetId.has(setId)) {
        betsBySetId.set(setId, []);
      }
      
      betsBySetId.get(setId)!.push({
        ...row.bets,
        bettingHouse: {
          ...row.betting_houses,
          accountHolder: row.account_holders
        }
      });
    }
    
    const formatDateToISO = (date: Date | string | null): string | null => {
      if (!date) return null;
      if (typeof date === 'string') return date;
      
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
    };
    
    const result: SurebetSetWithBets[] = sets.map(set => {
      const setBets = betsBySetId.get(set.id) || [];
      
      return {
        ...set,
        eventDate: formatDateToISO(set.eventDate) as any,
        createdAt: formatDateToISO(set.createdAt) as any,
        bets: setBets.map(bet => ({
          ...bet,
          createdAt: formatDateToISO(bet.createdAt) as any
        }))
      };
    });
    
    return result;
  }

  async getSurebetSetById(id: string): Promise<SurebetSetWithBets | null> {
    const [set] = await db
      .select()
      .from(surebetSets)
      .where(eq(surebetSets.id, id));
    
    if (!set) return null;
    
    const setBets = await db
      .select()
      .from(bets)
      .innerJoin(bettingHouses, eq(bets.bettingHouseId, bettingHouses.id))
      .innerJoin(accountHolders, eq(bettingHouses.accountHolderId, accountHolders.id))
      .where(eq(bets.surebetSetId, set.id))
      .orderBy(asc(bets.createdAt), asc(bets.id));

    const formatDateToISO = (date: Date | string | null): string | null => {
      if (!date) return null;
      if (typeof date === 'string') return date;
      
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
    };

    const formattedBets = setBets.map(row => ({
        ...row.bets,
        createdAt: formatDateToISO(row.bets.createdAt),
        bettingHouse: {
          ...row.betting_houses,
          createdAt: formatDateToISO(row.betting_houses.createdAt),
          accountHolder: row.account_holders
        }
      }));
    
    return {
      ...set,
      eventDate: formatDateToISO(set.eventDate) as any,
      createdAt: formatDateToISO(set.createdAt) as any,
      bets: formattedBets
    } as SurebetSetWithBets;
  }

  async updateSurebetSet(id: string, data: Partial<InsertSurebetSet>): Promise<SurebetSet> {
    const [surebetSet] = await db
      .update(surebetSets)
      .set(data)
      .where(eq(surebetSets.id, id))
      .returning();
    
    if (!surebetSet) throw new Error('Surebet set not found');
    return surebetSet;
  }

  async deleteSurebetSet(id: string): Promise<void> {
    await db.delete(bets).where(eq(bets.surebetSetId, id));
    await db.delete(surebetSets).where(eq(surebetSets.id, id));
  }

  async createBet(data: InsertBet): Promise<Bet> {
    const [bet] = await db.insert(bets).values(data).returning();
    return bet;
  }

  async updateBet(id: string, data: Partial<InsertBet>): Promise<Bet> {
    const [bet] = await db
      .update(bets)
      .set(data)
      .where(eq(bets.id, id))
      .returning();
    
    if (!bet) throw new Error('Bet not found');
    return bet;
  }

  async deleteBet(id: string): Promise<void> {
    await db.delete(bets).where(eq(bets.id, id));
  }
}

export const storage: IStorage = new DatabaseStorage();
