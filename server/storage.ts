import { families, payments, users, type Family, type InsertFamily, type Payment, type InsertPayment, type FamilyWithPayments, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc, sql, and, asc } from "drizzle-orm";
import * as crypto from "crypto";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  // Family CRUD
  getFamily(id: number): Promise<Family | undefined>;
  getFamilies(page: number, limit: number, query?: string): Promise<{ families: Family[], total: number }>;
  createFamily(family: InsertFamily): Promise<Family>;
  updateFamily(id: number, family: Partial<InsertFamily>): Promise<Family | undefined>;
  deleteFamily(id: number): Promise<boolean>;
  
  // Payments CRUD
  getPayment(id: number): Promise<Payment | undefined>;
  getPayments(familyId?: number): Promise<Payment[]>;
  getPaymentsByFamily(familyId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Dashboard Data
  getDashboardStats(): Promise<{
    totalFamilies: number;
    totalCollections: number;
    outstandingAmount: number;
    pendingPayments: number;
  }>;
  
  // Get families with their payment status
  getFamiliesWithPayments(page: number, limit: number, query?: string): Promise<{ families: FamilyWithPayments[], total: number }>;
}

export class MemStorage implements IStorage {
  private families: Map<number, Family>;
  private payments: Map<number, Payment>;
  private users: Map<number, User>;
  private familyCurrentId: number;
  private paymentCurrentId: number;
  private userCurrentId: number;

  constructor() {
    this.families = new Map();
    this.payments = new Map();
    this.users = new Map();
    this.familyCurrentId = 1;
    this.paymentCurrentId = 1;
    this.userCurrentId = 1;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const id = this.userCurrentId++;
    const createdAt = new Date();
    // Simple password hashing for memory storage
    const passwordHash = `memory:${userData.password}`;
    
    const user: User = { 
      id, 
      createdAt, 
      passwordHash,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'staff', 
      status: userData.status || 'active' 
    };
    
    this.users.set(id, user);
    return user;
  }

  // Family CRUD operations
  async getFamily(id: number): Promise<Family | undefined> {
    return this.families.get(id);
  }

  async getFamilies(page: number = 1, limit: number = 10, query?: string): Promise<{ families: Family[], total: number }> {
    let familiesArray = Array.from(this.families.values());
    
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      familiesArray = familiesArray.filter(
        family =>
          family.headOfFamily.toLowerCase().includes(lowercaseQuery) ||
          family.houseNo.toLowerCase().includes(lowercaseQuery) ||
          family.mobileNo.includes(query)
      );
    }
    
    const total = familiesArray.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      families: familiesArray.slice(start, end),
      total
    };
  }

  async createFamily(insertFamily: InsertFamily): Promise<Family> {
    const id = this.familyCurrentId++;
    const createdAt = new Date();
    
    // Ensure all properties have required types (handle null vs undefined)
    const family: Family = { 
      id, 
      createdAt,
      headOfFamily: insertFamily.headOfFamily,
      address: insertFamily.address,
      houseNo: insertFamily.houseNo,
      mobileNo: insertFamily.mobileNo,
      parentage: insertFamily.parentage || null,
      successor1st: insertFamily.successor1st || null,
      successor2nd: insertFamily.successor2nd || null
    };
    
    this.families.set(id, family);
    return family;
  }

  async updateFamily(id: number, family: Partial<InsertFamily>): Promise<Family | undefined> {
    const existingFamily = this.families.get(id);
    if (!existingFamily) return undefined;

    const updatedFamily = { ...existingFamily, ...family };
    this.families.set(id, updatedFamily);
    return updatedFamily;
  }

  async deleteFamily(id: number): Promise<boolean> {
    // Also delete all associated payments
    const familyPayments = Array.from(this.payments.values()).filter(
      payment => payment.familyId === id
    );
    
    for (const payment of familyPayments) {
      this.payments.delete(payment.id);
    }
    
    return this.families.delete(id);
  }

  // Payment CRUD operations
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPayments(familyId?: number): Promise<Payment[]> {
    const paymentsArray = Array.from(this.payments.values());
    
    if (familyId) {
      return paymentsArray.filter(payment => payment.familyId === familyId);
    }
    
    return paymentsArray;
  }

  async getPaymentsByFamily(familyId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.familyId === familyId
    ).sort((a, b) => {
      if (a.paymentDate && b.paymentDate) {
        return b.paymentDate.getTime() - a.paymentDate.getTime();
      }
      return 0;
    });
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const createdAt = new Date();
    
    // Calculate balance (previous balance + approved fund rate - amount received)
    const previousBalance = Number(insertPayment.previousBalance) || 0;
    const approvedFundRate = Number(insertPayment.approvedFundRate) || 0;
    const amountReceived = Number(insertPayment.amountReceived) || 0;
    
    const balance = previousBalance + approvedFundRate - amountReceived;
    const totalOutstanding = balance > 0 ? balance : 0;
    
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      createdAt,
      balance: String(balance),
      totalOutstanding: String(totalOutstanding)
    };
    
    this.payments.set(id, payment);
    return payment;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalFamilies: number;
    totalCollections: number;
    outstandingAmount: number;
    pendingPayments: number;
  }> {
    const totalFamilies = this.families.size;
    
    // Sum all amount received for total collections
    const payments = Array.from(this.payments.values());
    const totalCollections = payments.reduce(
      (sum, payment) => sum + Number(payment.amountReceived), 
      0
    );
    
    // Sum all outstanding amounts
    const outstandingAmount = payments.reduce(
      (sum, payment) => sum + Number(payment.totalOutstanding),
      0
    );
    
    // Count families with outstanding payments
    const familiesWithOutstanding = new Set();
    for (const payment of payments) {
      if (Number(payment.totalOutstanding) > 0) {
        familiesWithOutstanding.add(payment.familyId);
      }
    }
    
    return {
      totalFamilies,
      totalCollections,
      outstandingAmount,
      pendingPayments: familiesWithOutstanding.size
    };
  }

  // Get families with their payment status
  async getFamiliesWithPayments(page: number = 1, limit: number = 10, query?: string): Promise<{ families: FamilyWithPayments[], total: number }> {
    const { families, total } = await this.getFamilies(page, limit, query);
    
    const familiesWithPayments: FamilyWithPayments[] = await Promise.all(
      families.map(async (family) => {
        const payments = await this.getPaymentsByFamily(family.id);
        const latestPayment = payments.length > 0 ? payments[0] : null;
        
        return {
          ...family,
          latestPayment
        };
      })
    );
    
    return {
      families: familiesWithPayments,
      total
    };
  }
}

// Implement DatabaseStorage class
export class DatabaseStorage implements IStorage {
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const { password, ...user } = userData;
    const passwordHash = this.hashPassword(password);
    
    const [createdUser] = await db
      .insert(users)
      .values({ ...user, passwordHash })
      .returning();
      
    return createdUser;
  }

  // Family CRUD operations
  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || undefined;
  }

  async getFamilies(page: number = 1, limit: number = 10, query?: string): Promise<{ families: Family[], total: number }> {
    let queryBuilder = db.select().from(families);
    
    if (query) {
      queryBuilder = queryBuilder.where(
        or(
          like(families.headOfFamily, `%${query}%`),
          like(families.houseNo, `%${query}%`),
          like(families.mobileNo, `%${query}%`)
        )
      );
    }
    
    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(families);
    const total = totalResult[0]?.count || 0;
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const familiesResult = await queryBuilder
      .orderBy(desc(families.createdAt))
      .limit(limit)
      .offset(offset);
    
    return {
      families: familiesResult,
      total
    };
  }

  async createFamily(family: InsertFamily): Promise<Family> {
    const [createdFamily] = await db
      .insert(families)
      .values(family)
      .returning();
      
    return createdFamily;
  }

  async updateFamily(id: number, family: Partial<InsertFamily>): Promise<Family | undefined> {
    const [updatedFamily] = await db
      .update(families)
      .set(family)
      .where(eq(families.id, id))
      .returning();
      
    return updatedFamily || undefined;
  }

  async deleteFamily(id: number): Promise<boolean> {
    // Delete all associated payments first
    await db
      .delete(payments)
      .where(eq(payments.familyId, id));
    
    // Then delete the family
    const result = await db
      .delete(families)
      .where(eq(families.id, id))
      .returning();
      
    return result.length > 0;
  }

  // Payment CRUD operations
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
      
    return payment || undefined;
  }

  async getPayments(familyId?: number): Promise<Payment[]> {
    let queryBuilder = db.select().from(payments);
    
    if (familyId) {
      queryBuilder = queryBuilder.where(eq(payments.familyId, familyId));
    }
    
    return queryBuilder.orderBy(desc(payments.createdAt));
  }

  async getPaymentsByFamily(familyId: number): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.familyId, familyId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    // Calculate balance (previous balance + approved fund rate - amount received)
    const previousBalance = Number(insertPayment.previousBalance) || 0;
    const approvedFundRate = Number(insertPayment.approvedFundRate) || 0;
    const amountReceived = Number(insertPayment.amountReceived) || 0;
    
    const balance = previousBalance + approvedFundRate - amountReceived;
    const totalOutstanding = balance > 0 ? balance : 0;
    
    // Create a properly formatted payment object with all required fields
    const paymentData = {
      familyId: insertPayment.familyId,
      previousBalance: insertPayment.previousBalance,
      approvedFundRate: insertPayment.approvedFundRate,
      amountReceived: insertPayment.amountReceived,
      receiptNo: insertPayment.receiptNo || null,
      paymentDate: insertPayment.paymentDate || null,
      notes: insertPayment.notes || null,
      balance: String(balance),
      totalOutstanding: String(totalOutstanding)
    };
    
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .returning();
      
    return payment;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalFamilies: number;
    totalCollections: number;
    outstandingAmount: number;
    pendingPayments: number;
  }> {
    // Get total families count
    const [familiesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(families);
    
    // Get total collections (sum of all amount received)
    const [collectionsSum] = await db
      .select({ sum: sql<string>`sum(${payments.amountReceived})` })
      .from(payments);
    
    // Get total outstanding amount
    const [outstandingSum] = await db
      .select({ sum: sql<string>`sum(${payments.totalOutstanding})` })
      .from(payments);
    
    // Get count of families with outstanding payments
    const familiesWithOutstanding = await db
      .select({
        familyId: payments.familyId
      })
      .from(payments)
      .where(sql`cast(${payments.totalOutstanding} as numeric) > 0`)
      .groupBy(payments.familyId);
    
    return {
      totalFamilies: familiesCount?.count || 0,
      totalCollections: Number(collectionsSum?.sum) || 0,
      outstandingAmount: Number(outstandingSum?.sum) || 0,
      pendingPayments: familiesWithOutstanding.length
    };
  }

  // Get families with their payment status
  async getFamiliesWithPayments(page: number = 1, limit: number = 10, query?: string): Promise<{ families: FamilyWithPayments[], total: number }> {
    const { families, total } = await this.getFamilies(page, limit, query);
    
    const familiesWithPayments: FamilyWithPayments[] = await Promise.all(
      families.map(async (family) => {
        const familyPayments = await this.getPaymentsByFamily(family.id);
        const latestPayment = familyPayments.length > 0 ? familyPayments[0] : null;
        
        return {
          ...family,
          latestPayment
        };
      })
    );
    
    return {
      families: familiesWithPayments,
      total
    };
  }
}

export const storage = new DatabaseStorage();
