import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const category = searchParams.get("category");

  const conditions = [];
  if (year && month) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;
    conditions.push(gte(expenses.date, startDate), lte(expenses.date, endDate));
  }
  if (category) conditions.push(eq(expenses.category, category as never));

  const rows = await db
    .select()
    .from(expenses)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(expenses.date));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, date, amount, description } = body;

  if (!category || !date || !amount) {
    return NextResponse.json({ error: "Category, date and amount are required" }, { status: 400 });
  }

  const [expense] = await db
    .insert(expenses)
    .values({ category, date, amount: parseFloat(amount), description })
    .returning();

  return NextResponse.json(expense, { status: 201 });
}
