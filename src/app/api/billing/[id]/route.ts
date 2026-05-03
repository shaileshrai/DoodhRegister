import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyBills } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { today } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { paymentStatus, notes } = await req.json();

  const updates: Record<string, unknown> = { paymentStatus };
  if (paymentStatus === "PAID") updates.paidDate = today();
  if (notes !== undefined) updates.notes = notes;

  const [updated] = await db
    .update(monthlyBills)
    .set(updates)
    .where(eq(monthlyBills.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated);
}
