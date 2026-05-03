import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, dailyRecords, expenses, monthlyBills, profitLossReports } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  // Revenue from all bills for this month
  const bills = await db
    .select()
    .from(monthlyBills)
    .where(and(eq(monthlyBills.year, year), eq(monthlyBills.month, month)));

  const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalQuantity = bills.reduce((sum, b) => sum + b.totalQuantity, 0);
  const paidCount = bills.filter((b) => b.paymentStatus === "PAID").length;
  const dueCount = bills.filter((b) => b.paymentStatus === "DUE").length;

  // Expenses for this month
  const expenseRows = await db
    .select()
    .from(expenses)
    .where(and(gte(expenses.date, startDate), lte(expenses.date, endDate)));

  const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);

  const expenseByCategory: Record<string, number> = {};
  for (const e of expenseRows) {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  }

  const netProfit = totalRevenue - totalExpenses;

  // Upsert into profit_loss_reports
  await db
    .insert(profitLossReports)
    .values({ year, month, totalRevenue, totalExpenses, netProfit })
    .onConflictDoUpdate({
      target: [profitLossReports.year, profitLossReports.month],
      set: { totalRevenue, totalExpenses, netProfit },
    });

  return NextResponse.json({
    year,
    month,
    totalRevenue,
    totalExpenses,
    netProfit,
    totalQuantity,
    paidCount,
    dueCount,
    expenseByCategory,
    billCount: bills.length,
  });
}
