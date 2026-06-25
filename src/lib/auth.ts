import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { Role, User } from "@prisma/client";

const COOKIE_NAME = "rh_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";

// A session cookie is `userId.signature`, where the signature is an HMAC of the
// userId. This keeps the cookie tamper-evident without a server-side store.
// Adequate for an MVP; a production app would use a vetted library (e.g. iron-session).
function sign(value: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const value = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  if (sig.length !== expected.length) return null;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? value : null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = verify(token);
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

/** Require any logged-in user, or redirect to /login. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require a user of a specific role, or redirect appropriately. */
export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) {
    redirect(user.role === "LANDLORD" ? "/dashboard" : "/portal");
  }
  return user;
}
