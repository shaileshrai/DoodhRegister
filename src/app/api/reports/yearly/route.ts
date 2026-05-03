import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profitLossReports } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const rows = await db
    .select()
    .from(profitLossReports)
    .where(eq(profitLossReports.year, year))
    .orderBy(profitLossReports.month);

  const totalRevenue = rows.reduce((s, r) => s + r.totalRevenue, 0);
  const totalExpenses = rows.reduce((s, r) => s + r.totalExpenses, 0);
  const netProfit = totalRevenue - totalExpenses;

  return NextResponse.json({ year, months: rows, totalRevenue, totalExpenses, netProfit });
}
