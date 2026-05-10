import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, dailyRecords } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { today } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || today();
  const shift = searchParams.get("shift");

  const allCustomers = await db
    .select()
    .from(customers)
    .where(
      shift
        ? and(eq(customers.isActive, true), eq(customers.shift, shift as "MORNING" | "EVENING" | "OTHER"))
        : eq(customers.isActive, true)
    )
    .orderBy(customers.name);

  const records = await db
    .select()
    .from(dailyRecords)
    .where(eq(dailyRecords.date, date));

  const recordMap = new Map(records.map((r) => [r.customerId, r]));

  const result = allCustomers.map((c) => {
    const record = recordMap.get(c.id);
    return {
      customer: c,
      record: record || null,
      isPresent: record?.isPresent ?? false,
      quantityTaken: record?.quantityTaken ?? c.defaultQuantity ?? 0,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerId, date, quantityTaken, isPresent, notes } = body;

  const existing = await db
    .select()
    .from(dailyRecords)
    .where(and(eq(dailyRecords.customerId, customerId), eq(dailyRecords.date, date)));

  if (existing.length > 0) {
    const [updated] = await db
      .update(dailyRecords)
      .set({ quantityTaken, isPresent, notes })
      .where(and(eq(dailyRecords.customerId, customerId), eq(dailyRecords.date, date)))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(dailyRecords)
    .values({ customerId, date, quantityTaken, isPresent, notes })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
