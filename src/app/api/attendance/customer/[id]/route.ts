import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyRecords } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const records = await db
    .select()
    .from(dailyRecords)
    .where(
      and(
        eq(dailyRecords.customerId, parseInt(id)),
        gte(dailyRecords.date, startDate),
        lte(dailyRecords.date, endDate)
      )
    )
    .orderBy(dailyRecords.date);

  return NextResponse.json(records);
}
