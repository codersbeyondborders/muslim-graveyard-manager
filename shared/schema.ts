import { pgTable, text, serial, integer, numeric, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Family schema
export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  headOfFamily: text("head_of_family").notNull(),
  parentage: text("parentage"),
  successor1st: text("successor_1st"),
  successor2nd: text("successor_2nd"),
  address: text("address").notNull(),
  houseNo: text("house_no").notNull(),
  mobileNo: varchar("mobile_no", { length: 15 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFamilySchema = createInsertSchema(families).omit({ 
  id: true,
  createdAt: true
});

// Payment schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull(),
  previousBalance: numeric("previous_balance", { precision: 10, scale: 2 }).default("0").notNull(),
  approvedFundRate: numeric("approved_fund_rate", { precision: 10, scale: 2 }).default("0").notNull(),
  amountReceived: numeric("amount_received", { precision: 10, scale: 2 }).default("0").notNull(),
  receiptNo: text("receipt_no"),
  paymentDate: timestamp("payment_date"),
  balance: numeric("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  totalOutstanding: numeric("total_outstanding", { precision: 10, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  balance: true,
  totalOutstanding: true
});

// Types
export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Extended schemas for API validation
export const familySearchSchema = z.object({
  query: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(10),
});

export type FamilySearch = z.infer<typeof familySearchSchema>;

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true,
  passwordHash: true
}).extend({
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type User = typeof users.$inferSelect;
export type InsertUser = Omit<z.infer<typeof insertUserSchema>, 'confirmPassword'>;

// Extended types for API responses
export type FamilyWithPayments = Family & {
  latestPayment?: Payment | null;
};
