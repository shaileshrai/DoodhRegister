import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyBills } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bills = await db
    .select()
    .from(monthlyBills)
    .where(eq(monthlyBills.customerId, parseInt(id)))
    .orderBy(desc(monthlyBills.year), desc(monthlyBills.month));

  return NextResponse.json(bills);
}
