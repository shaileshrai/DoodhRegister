import { cookies } from "next/headers";

const SESSION_COOKIE = "dairy_session";
const PASSWORD = process.env.ADMIN_PASSWORD || "dairy123";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token === PASSWORD ? { isLoggedIn: true } : { isLoggedIn: false };
}

export async function createSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function verifyPassword(input: string) {
  return input === PASSWORD;
}
