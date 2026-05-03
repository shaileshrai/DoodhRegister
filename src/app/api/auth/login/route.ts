import { NextRequest, NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
