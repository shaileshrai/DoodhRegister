import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { today } from "@/lib/utils";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [customer] = await db.select().from(customers).where(eq(customers.id, parseInt(id)));
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { name, mobile, shift, rate, defaultQuantity, isActive } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (mobile !== undefined) updates.mobile = mobile;
  if (shift !== undefined) updates.shift = shift;
  if (rate !== undefined) updates.rate = rate;
  if (defaultQuantity !== undefined) updates.defaultQuantity = defaultQuantity;
  if (isActive !== undefined) {
    updates.isActive = isActive;
    if (!isActive) updates.leftDate = today();
  }

  const [updated] = await db.update(customers).set(updates).where(eq(customers.id, parseInt(id))).returning();
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.update(customers).set({ isActive: false, leftDate: today() }).where(eq(customers.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
