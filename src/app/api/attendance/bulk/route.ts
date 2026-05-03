import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyRecords } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: Array<{
    customerId: number;
    date: string;
    quantityTaken: number;
    isPresent: boolean;
    notes?: string;
  }> = await req.json();

  for (const entry of body) {
    const existing = await db
      .select({ id: dailyRecords.id })
      .from(dailyRecords)
      .where(and(eq(dailyRecords.customerId, entry.customerId), eq(dailyRecords.date, entry.date)));

    if (existing.length > 0) {
      await db
        .update(dailyRecords)
        .set({ quantityTaken: entry.quantityTaken, isPresent: entry.isPresent, notes: entry.notes })
        .where(and(eq(dailyRecords.customerId, entry.customerId), eq(dailyRecords.date, entry.date)));
    } else {
      await db.insert(dailyRecords).values(entry);
    }
  }

  return NextResponse.json({ ok: true, count: body.length });
}
