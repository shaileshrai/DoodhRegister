import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  shift: text("shift", { enum: ["MORNING", "EVENING"] }).notNull(),
  rate: real("rate").notNull(),
  defaultQuantity: real("default_quantity").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  joinedDate: text("joined_date").notNull(),
  leftDate: text("left_date"),
  createdAt: text("created_at").notNull().default(sql`(date('now'))`),
});

export const dailyRecords = sqliteTable("daily_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  date: text("date").notNull(),
  quantityTaken: real("quantity_taken").notNull().default(0),
  isPresent: integer("is_present", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const monthlyBills = sqliteTable("monthly_bills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalQuantity: real("total_quantity").notNull().default(0),
  totalAmount: real("total_amount").notNull().default(0),
  paymentStatus: text("payment_status", { enum: ["PAID", "DUE"] }).notNull().default("DUE"),
  paidDate: text("paid_date"),
  notes: text("notes"),
  generatedAt: text("generated_at").notNull().default(sql`(datetime('now'))`),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category", {
    enum: ["FODDER", "MEDICINE", "REPAIRING", "MANPOWER", "POWER", "OTHER"],
  }).notNull(),
  date: text("date").notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const profitLossReports = sqliteTable("profit_loss_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalRevenue: real("total_revenue").notNull().default(0),
  totalExpenses: real("total_expenses").notNull().default(0),
  netProfit: real("net_profit").notNull().default(0),
  generatedAt: text("generated_at").notNull().default(sql`(datetime('now'))`),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type DailyRecord = typeof dailyRecords.$inferSelect;
export type NewDailyRecord = typeof dailyRecords.$inferInsert;
export type MonthlyBill = typeof monthlyBills.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type ProfitLossReport = typeof profitLossReports.$inferSelect;
