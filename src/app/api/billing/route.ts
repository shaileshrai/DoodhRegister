import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, dailyRecords, monthlyBills } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const bills = await db
    .select({
      bill: monthlyBills,
      customer: customers,
    })
    .from(monthlyBills)
    .innerJoin(customers, eq(monthlyBills.customerId, customers.id))
    .where(and(eq(monthlyBills.year, year), eq(monthlyBills.month, month)))
    .orderBy(customers.name);

  return NextResponse.json(bills);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const activeCustomers = await db.select().from(customers).where(eq(customers.isActive, true));

  const results = [];
  for (const customer of activeCustomers) {
    const records = await db
      .select()
      .from(dailyRecords)
      .where(
        and(
          eq(dailyRecords.customerId, customer.id),
          eq(dailyRecords.isPresent, true),
          gte(dailyRecords.date, startDate),
          lte(dailyRecords.date, endDate)
        )
      );

    const totalQuantity = records.reduce((sum, r) => sum + r.quantityTaken, 0);
    const totalAmount = totalQuantity * customer.rate;

    const [bill] = await db
      .insert(monthlyBills)
      .values({ customerId: customer.id, year, month, totalQuantity, totalAmount })
      .onConflictDoUpdate({
        target: [monthlyBills.customerId, monthlyBills.year, monthlyBills.month],
        set: { totalQuantity, totalAmount },
      })
      .returning();

    results.push(bill);
  }

  return NextResponse.json(results);
}
