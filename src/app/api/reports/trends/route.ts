import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allCustomers = await db.select().from(customers);

  // Build monthly addition/removal timeline
  const trendMap: Record<string, { added: number; removed: number; net: number }> = {};

  for (const c of allCustomers) {
    const joinedKey = c.joinedDate.substring(0, 7);
    if (!trendMap[joinedKey]) trendMap[joinedKey] = { added: 0, removed: 0, net: 0 };
    trendMap[joinedKey].added += 1;

    if (c.leftDate) {
      const leftKey = c.leftDate.substring(0, 7);
      if (!trendMap[leftKey]) trendMap[leftKey] = { added: 0, removed: 0, net: 0 };
      trendMap[leftKey].removed += 1;
    }
  }

  const sorted = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Compute cumulative active
  let running = 0;
  for (const entry of sorted) {
    running += entry.added - entry.removed;
    (entry as Record<string, unknown>).activeCount = running;
  }

  return NextResponse.json({
    trends: sorted,
    currentActive: allCustomers.filter((c) => c.isActive).length,
    currentMorning: allCustomers.filter((c) => c.isActive && c.shift === "MORNING").length,
    currentEvening: allCustomers.filter((c) => c.isActive && c.shift === "EVENING").length,
    totalEver: allCustomers.length,
  });
}
