import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { getSession } from "@/lib/session";
import { today } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(customers).orderBy(customers.name);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, mobile, shift, rate, defaultQuantity } = body;

  if (!name || !mobile || !shift) {
    return NextResponse.json({ error: "Name, mobile, and shift are required" }, { status: 400 });
  }

  if (shift !== "OTHER" && (!rate || !defaultQuantity)) {
    return NextResponse.json({ error: "Rate and quantity required for morning/evening" }, { status: 400 });
  }

  const [newCustomer] = await db
    .insert(customers)
    .values({
      name,
      mobile,
      shift,
      rate: rate ?? null,
      defaultQuantity: defaultQuantity ?? null,
      joinedDate: today(),
    })
    .returning();

  return NextResponse.json(newCustomer, { status: 201 });
}
